const { performance } = require('perf_hooks');

// Benchmark simulating downloading N files:
// 1. Unbounded Promise.all (unthrottled)
// 2. Bounded Concurrency Worker Pool (CONCURRENCY_LIMIT = 5)
// 3. Sequential
async function benchmarkDownloadLoop(numFiles = 20, simulatedLatencyMs = 30, concurrencyLimit = 5) {
  const files = Array.from({ length: numFiles }, (_, i) => ({
    id: `file_${i + 1}`,
    name: `Trip_${i + 1}.json`,
    modifiedTime: new Date().toISOString()
  }));

  // Track max active concurrent connections to measure connection pressure / queue saturation
  let activeConnections = 0;
  let maxActiveConnections = 0;

  const mockFetchFile = async (file) => {
    activeConnections++;
    if (activeConnections > maxActiveConnections) {
      maxActiveConnections = activeConnections;
    }
    await new Promise(resolve => setTimeout(resolve, simulatedLatencyMs));
    activeConnections--;
    return {
      ok: true,
      json: async () => ({
        id: `trip_${file.id}`,
        title: `Trip ${file.name}`,
        data: { meta: { title: `Trip ${file.name}` } }
      })
    };
  };

  // --- 1. Unbounded Parallel (Promise.all) ---
  activeConnections = 0;
  maxActiveConnections = 0;
  const startUnbounded = performance.now();
  const unboundedResults = await Promise.all(files.map(async (file) => {
    if (!file.name) return null;
    const resp = await mockFetchFile(file);
    if (resp.ok) {
      return await resp.json();
    }
    return null;
  })).then(res => res.filter(Boolean));
  const unboundedDuration = performance.now() - startUnbounded;
  const unboundedMaxConnections = maxActiveConnections;

  // --- 2. Bounded Concurrency (Worker Pool) ---
  activeConnections = 0;
  maxActiveConnections = 0;
  const startBounded = performance.now();
  const boundedResults = [];
  let fileIndex = 0;
  const workerCount = Math.min(concurrencyLimit, files.length);
  const workers = Array.from({ length: workerCount }, async () => {
    while (fileIndex < files.length) {
      const file = files[fileIndex++];
      if (!file || !file.name) continue;
      const resp = await mockFetchFile(file);
      if (resp.ok) {
        const data = await resp.json();
        boundedResults.push(data);
      }
    }
  });
  await Promise.all(workers);
  const boundedDuration = performance.now() - startBounded;
  const boundedMaxConnections = maxActiveConnections;

  // --- 3. Sequential ---
  activeConnections = 0;
  maxActiveConnections = 0;
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
  const sequentialDuration = performance.now() - startSequential;

  console.log(`--- Google Drive File Download Benchmark (${numFiles} files, ${simulatedLatencyMs}ms network latency, concurrency limit ${concurrencyLimit}) ---`);
  console.log(`Sequential execution time:        ${sequentialDuration.toFixed(2)} ms (Max peak concurrent requests: ${1})`);
  console.log(`Unbounded Promise.all time:       ${unboundedDuration.toFixed(2)} ms (Max peak concurrent requests: ${unboundedMaxConnections})`);
  console.log(`Bounded Concurrency (Pool) time:  ${boundedDuration.toFixed(2)} ms (Max peak concurrent requests: ${boundedMaxConnections})`);
  console.log(`Results count match:              ${unboundedResults.length === boundedResults.length && boundedResults.length === sequentialResults.length ? 'YES' : 'NO'}`);

  return { sequentialDuration, unboundedDuration, boundedDuration, unboundedMaxConnections, boundedMaxConnections, numFiles };
}

if (require.main === module) {
  benchmarkDownloadLoop().catch(console.error);
}

module.exports = { benchmarkDownloadLoop };
