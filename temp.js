<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration failed:', err));
    });
  }

  setInterval(updateClocks, 1000);
  updateClocks();

  (async function() {
    await initData();
    buildNav();
    buildItinerary();
    reObserveLegs();
  })();
</script>
</body>
</html>
