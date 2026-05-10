<script>
  // Register service worker first (independent of other init)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration failed:', err));
    });
  }

  // Start clocks
  setInterval(updateClocks, 1000);
  updateClocks();

  // Main init function
  (async function main() {
    try {
      await initData();
      buildNav();
      buildItinerary();
      reObserveLegs();
      console.log('App initialization complete');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      alert('Failed to load data. Please refresh the page.');
    }
  })();
</script>
</body>
</html>
