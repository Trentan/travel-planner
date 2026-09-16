const { performance } = require('perf_hooks');

// Benchmark simulating downloading N files sequentially vs in parallel (using Promise.all)
async function benchmarkDownloadLoop(numFiles = 10, simulatedLatencyMs = 30) {
  const files = Array.from({ length: numFiles }, (_, i) => ({
    id: `file_${i + 1}`,
    name: `Trip_${i + 1}.json`,
    modifiedTime: new Date().toISOString()
  }));

  // Mock fetch simulating network request
  const mockFetchFile = async (file) => {
    await new Promise(resolve => setTimeout(resolve, simulatedLatencyMs));
    return {
      ok: true,
      json: async () => ({
        id: `trip_${file.id}`,
        title: `Trip ${file.name}`,
        data: { meta: { title: `Trip ${file.name}` } }
      })
    };
  };

  // --- Sequential Benchmark ---
  const startSequential = performance.now();
  const sequentialResults = [];
  for (const file of files) {
    if (!file.name) continue;
    const resp = await mockFetchFile(file);
    if (resp.ok) {
      const data = await resp.json();
      sequentialResults.push(data);
    }
  }
  const endSequential = performance.now();
  const sequentialDuration = endSequential - startSequential;

  // --- Parallel Benchmark ---
  const startParallel = performance.now();
  const parallelResults = await Promise.all(files.map(async (file) => {
    if (!file.name) return null;
    const resp = await mockFetchFile(file);
    if (resp.ok) {
      return await resp.json();
    }
    return null;
  })).then(res => res.filter(Boolean));
  const endParallel = performance.now();
  const parallelDuration = endParallel - startParallel;

  console.log(`--- Google Drive File Download Benchmark (${numFiles} files, ${simulatedLatencyMs}ms network latency) ---`);
  console.log(`Sequential execution time: ${sequentialDuration.toFixed(2)} ms`);
  console.log(`Parallel execution time:   ${parallelDuration.toFixed(2)} ms`);
  console.log(`Speedup factor:            ${(sequentialDuration / parallelDuration).toFixed(2)}x faster`);
  console.log(`Results count match:       ${sequentialResults.length === parallelResults.length ? 'YES' : 'NO'}`);

  return { sequentialDuration, parallelDuration, numFiles };
}

if (require.main === module) {
  benchmarkDownloadLoop().catch(console.error);
}

module.exports = { benchmarkDownloadLoop };
