/**
 * Mobile PWA & Play Store Advisory Prompt
 * Provides platform-aware guidance for mobile browser users (iOS Safari & Android).
 */

(function () {
  const DISMISS_KEY = 'travelApp_pwa_prompt_dismissed_v1';

  function isStandaloneApp() {
    if (typeof window === 'undefined') return false;
    const nav = window.navigator || {};
    return (
      nav.standalone === true ||
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      (window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches) ||
      Boolean(window.Capacitor) ||
      Boolean(window.isCapacitorNative) ||
      Boolean(window.AndroidBridge)
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

    // Header section
    const header = document.createElement('div');
    header.className = 'pwa-prompt-header';

    const titleGroup = document.createElement('div');
    titleGroup.className = 'pwa-prompt-title-group';

    const badge = document.createElement('span');
    badge.className = isIOS ? 'pwa-prompt-badge' : 'pwa-prompt-badge pwa-badge-android';
    badge.textContent = isIOS ? 'Web App' : 'Android App';

    const title = document.createElement('h4');
    title.className = 'pwa-prompt-title';
    title.textContent = isIOS ? '📱 Add to Home Screen' : '🚀 Get the Mobile App';

    titleGroup.appendChild(badge);
    titleGroup.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'pwa-prompt-close-btn';
    closeBtn.setAttribute('aria-label', 'Dismiss prompt');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => dismissPwaPrompt(true));

    header.appendChild(titleGroup);
    header.appendChild(closeBtn);
    card.appendChild(header);

    // Body section
    const body = document.createElement('p');
    body.className = 'pwa-prompt-body';
    if (isIOS) {
      body.appendChild(document.createTextNode('Save '));
      const strongApp = document.createElement('strong');
      strongApp.textContent = 'Travel Planner';
      body.appendChild(strongApp);
      body.appendChild(document.createTextNode(' as an app on your iPhone for full-screen mode and quick access!'));
    } else {
      body.appendChild(document.createTextNode('Install '));
      const strongApp = document.createElement('strong');
      strongApp.textContent = 'Travel Planner';
      body.appendChild(strongApp);
      body.appendChild(document.createTextNode(' from Google Play for offline support and native app experience.'));
    }
    card.appendChild(body);

    if (isIOS) {
      // Steps section
      const stepsContainer = document.createElement('div');
      stepsContainer.className = 'pwa-prompt-steps';

      // Step 1
      const step1 = document.createElement('div');
      step1.className = 'pwa-step';

      const step1Badge = document.createElement('span');
      step1Badge.className = 'pwa-step-badge';
      step1Badge.textContent = '1';

      const step1Text = document.createElement('span');
      step1Text.appendChild(document.createTextNode('Tap the '));
      const shareStrong = document.createElement('strong');
      shareStrong.textContent = 'Share';
      step1Text.appendChild(shareStrong);
      step1Text.appendChild(document.createTextNode(' button '));

      const shareIcon = document.createElement('span');
      shareIcon.className = 'pwa-share-icon';
      shareIcon.setAttribute('aria-hidden', 'true');
      shareIcon.textContent = '⎋';
      step1Text.appendChild(shareIcon);

      step1Text.appendChild(document.createTextNode(' in Safari\'s toolbar'));

      step1.appendChild(step1Badge);
      step1.appendChild(step1Text);

      // Step 2
      const step2 = document.createElement('div');
      step2.className = 'pwa-step';

      const step2Badge = document.createElement('span');
      step2Badge.className = 'pwa-step-badge';
      step2Badge.textContent = '2';

      const step2Text = document.createElement('span');
      step2Text.appendChild(document.createTextNode('Scroll down and tap '));
      const addStrong = document.createElement('strong');
      addStrong.textContent = '"Add to Home Screen ➕"';
      step2Text.appendChild(addStrong);

      step2.appendChild(step2Badge);
      step2.appendChild(step2Text);

      stepsContainer.appendChild(step1);
      stepsContainer.appendChild(step2);
      card.appendChild(stepsContainer);

      // Footer section
      const footer = document.createElement('div');
      footer.className = 'pwa-prompt-footer';

      const primaryBtn = document.createElement('button');
      primaryBtn.type = 'button';
      primaryBtn.className = 'pwa-btn pwa-btn-primary';
      primaryBtn.textContent = 'Got it!';
      primaryBtn.addEventListener('click', () => dismissPwaPrompt(true));

      const ghostBtn = document.createElement('button');
      ghostBtn.type = 'button';
      ghostBtn.className = 'pwa-btn pwa-btn-ghost';
      ghostBtn.textContent = 'Remind Later';
      ghostBtn.addEventListener('click', () => dismissPwaPrompt(false));

      footer.appendChild(primaryBtn);
      footer.appendChild(ghostBtn);
      card.appendChild(footer);
    } else {
      // Android Footer section
      const footer = document.createElement('div');
      footer.className = 'pwa-prompt-footer';

      const playLink = document.createElement('a');
      playLink.href = 'https://play.google.com/store/apps/details?id=com.trentan.travelplanner';
      playLink.target = '_blank';
      playLink.rel = 'noopener';
      playLink.className = 'pwa-btn pwa-btn-primary pwa-btn-play';
      playLink.addEventListener('click', () => dismissPwaPrompt(true));

      const playSpan = document.createElement('span');
      playSpan.textContent = 'Get on Google Play';
      playLink.appendChild(playSpan);

      const ghostBtn = document.createElement('button');
      ghostBtn.type = 'button';
      ghostBtn.className = 'pwa-btn pwa-btn-ghost';
      ghostBtn.textContent = 'Keep Using Web';
      ghostBtn.addEventListener('click', () => dismissPwaPrompt(false));

      footer.appendChild(playLink);
      footer.appendChild(ghostBtn);
      card.appendChild(footer);
    }

    document.body.appendChild(card);
  }

  if (typeof window !== 'undefined') {
    window.dismissPwaPrompt = dismissPwaPrompt;
    window.initPwaPrompt = initPwaPrompt;
    window.isStandaloneApp = isStandaloneApp;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      isStandaloneApp,
      dismissPwaPrompt,
      initPwaPrompt
    };
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initPwaPrompt, 1200);
      });
    } else {
      setTimeout(initPwaPrompt, 1200);
    }
  }
})();
