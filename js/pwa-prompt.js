/**
 * Mobile PWA & Play Store Advisory Prompt
 * Provides platform-aware guidance for mobile browser users (iOS Safari & Android).
 */

(function () {
  const DISMISS_KEY = 'travelApp_pwa_prompt_dismissed_v1';

  function isStandaloneApp() {
    return (
      window.navigator.standalone === true ||
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      (window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches) ||
      !!window.Capacitor ||
      !!window.isCapacitorNative
    );
  }

  function dismissPwaPrompt(permanent = true) {
    const el = document.getElementById('pwaPromptModal');
    if (el) {
      el.classList.add('pwa-prompt-leaving');
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 300);
    }
    if (permanent) {
      localStorage.setItem(DISMISS_KEY, 'permanent');
    } else {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    }
  }

  function initPwaPrompt() {
    if (isStandaloneApp()) return;

    const dismissedState = localStorage.getItem(DISMISS_KEY);
    if (dismissedState === 'permanent') return;
    if (dismissedState) {
      const timestamp = parseInt(dismissedState, 10);
      if (!isNaN(timestamp) && Date.now() - timestamp < 7 * 86400 * 1000) {
        return; // Suppress for 7 days if temporary "Remind Later"
      }
    }

    const ua = navigator.userAgent || '';
    const isIOS = /iPhone|iPad|iPod/.test(ua) && !window.MSStream;
    const isAndroid = /Android/.test(ua);
    const isMobileDevice = isIOS || isAndroid || (window.innerWidth <= 768 && ('ontouchstart' in window || navigator.maxTouchPoints > 0));

    if (!isMobileDevice) return;

    // Remove existing if any
    const existing = document.getElementById('pwaPromptModal');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

    const card = document.createElement('div');
    card.id = 'pwaPromptModal';
    card.className = `pwa-prompt-card ${isIOS ? 'role-ios' : 'role-android'}`;
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', isIOS ? 'Add to Home Screen prompt' : 'Play Store recommendation');

    if (isIOS) {
      card.innerHTML = `
        <div class="pwa-prompt-header">
          <div class="pwa-prompt-title-group">
            <span class="pwa-prompt-badge">Web App</span>
            <h4 class="pwa-prompt-title">📱 Add to Home Screen</h4>
          </div>
          <button type="button" class="pwa-prompt-close-btn" onclick="dismissPwaPrompt(true)" aria-label="Dismiss prompt">×</button>
        </div>
        <p class="pwa-prompt-body">
          Save <strong>Travel Planner</strong> as an app on your iPhone for full-screen mode and quick access!
        </p>
        <div class="pwa-prompt-steps">
          <div class="pwa-step">
            <span class="pwa-step-badge">1</span>
            <span>Tap the <strong>Share</strong> button <span class="pwa-share-icon" aria-hidden="true">⎋</span> in Safari's toolbar</span>
          </div>
          <div class="pwa-step">
            <span class="pwa-step-badge">2</span>
            <span>Scroll down and tap <strong>"Add to Home Screen ➕"</strong></span>
          </div>
        </div>
        <div class="pwa-prompt-footer">
          <button type="button" class="pwa-btn pwa-btn-primary" onclick="dismissPwaPrompt(true)">Got it!</button>
          <button type="button" class="pwa-btn pwa-btn-ghost" onclick="dismissPwaPrompt(false)">Remind Later</button>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="pwa-prompt-header">
          <div class="pwa-prompt-title-group">
            <span class="pwa-prompt-badge pwa-badge-android">Android App</span>
            <h4 class="pwa-prompt-title">🚀 Get the Mobile App</h4>
          </div>
          <button type="button" class="pwa-prompt-close-btn" onclick="dismissPwaPrompt(true)" aria-label="Dismiss prompt">×</button>
        </div>
        <p class="pwa-prompt-body">
          Install <strong>Travel Planner</strong> from Google Play for offline support and native app experience.
        </p>
        <div class="pwa-prompt-footer">
          <a href="https://play.google.com/store/apps/details?id=com.trentan.travelplanner" target="_blank" rel="noopener" class="pwa-btn pwa-btn-primary pwa-btn-play" onclick="dismissPwaPrompt(true)">
            <span>Get on Google Play</span>
          </a>
          <button type="button" class="pwa-btn pwa-btn-ghost" onclick="dismissPwaPrompt(false)">Keep Using Web</button>
        </div>
      `;
    }

    document.body.appendChild(card);
  }

  window.dismissPwaPrompt = dismissPwaPrompt;
  window.initPwaPrompt = initPwaPrompt;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initPwaPrompt, 1200);
    });
  } else {
    setTimeout(initPwaPrompt, 1200);
  }
})();
