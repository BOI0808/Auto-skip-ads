(() => {
  "use strict";

  const DEBUG = false;
  const SPEED_UP_ALWAYS = true;
  const SPEED_UP_FALLBACK = true;

  const SKIP_SELECTORS = [
    ".ytp-skip-ad-button",
    ".ytp-ad-skip-button-modern",
    ".ytp-ad-skip-button",
    ".ytp-ad-skip-button-container button",
    'button[id^="skip-button"]',
  ];
  const OVERLAY_CLOSE_SELECTORS = [".ytp-ad-overlay-close-button"];
  let settings = { ...DEFAULTS };
  let mutedByUs = false;
  let savedRate = null;
  let spedUp = false;
  let lastPressAt = 0;
  let pressAttempts = 0;
  let awaitingConfirm = false;
  let loggedAdStart = false;
  let lastRun = 0;
  let pending = null;

  const log = (...args) => {
    if (DEBUG) console.log("[YT Auto Skip]", ...args);
  };

  function isVisible(el) {
    return !!(
      el &&
      (el.offsetWidth || el.offsetHeight || el.getClientRects().length)
    );
  }

  function findVisible(selectors) {
    for (const sel of selectors) {
      for (const el of document.querySelectorAll(sel)) {
        if (isVisible(el)) return el;
      }
    }
    return null;
  }

  function effectiveOpacity(el) {
    let o = 1;
    for (let n = el, i = 0; n && i < 4; n = n.parentElement, i++) {
      const v = parseFloat(getComputedStyle(n).opacity);
      o *= Number.isNaN(v) ? 1 : v;
    }
    return o;
  }

  function getPlayer() {
    return (
      document.querySelector("#movie_player") ||
      document.querySelector(".html5-video-player")
    );
  }

  function pressButton(el) {
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const base = {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      clientX: x,
      clientY: y,
      button: 0,
    };
    const ptr = {
      ...base,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
    };

    el.dispatchEvent(new PointerEvent("pointerover", ptr));
    el.dispatchEvent(new MouseEvent("mouseover", base));
    el.dispatchEvent(new PointerEvent("pointerdown", { ...ptr, buttons: 1 }));
    el.dispatchEvent(new MouseEvent("mousedown", { ...base, buttons: 1 }));
    if (el.focus) el.focus();
    el.dispatchEvent(new PointerEvent("pointerup", ptr));
    el.dispatchEvent(new MouseEvent("mouseup", base));
    el.dispatchEvent(new MouseEvent("click", base));
  }

  function countSkip() {
    try {
      chrome.storage.local.get({ adsSkipped: 0 }, (data) => {
        chrome.storage.local.set({ adsSkipped: (data.adsSkipped || 0) + 1 });
      });
    } catch (_) {}
  }

  function speedUp(video) {
    if (savedRate === null) {
      savedRate = video.playbackRate;
      log("Tua nhanh quảng cáo 16x");
    }
    if (video.playbackRate !== 16) video.playbackRate = 16;
    if (!video.muted) {
      video.muted = true;
      mutedByUs = true;
    }
    spedUp = true;
  }

  function restoreVideo(video) {
    if (!video) return;
    if (mutedByUs) {
      video.muted = false;
      mutedByUs = false;
    }
    if (savedRate !== null) {
      video.playbackRate = savedRate;
      savedRate = null;
    }
  }

  function handle() {
    lastRun = Date.now();

    const player = getPlayer();
    if (!player) return;
    const video = player.querySelector("video");

    if (!settings.enabled) {
      restoreVideo(video);
      return;
    }

    const adShowing = player.classList.contains("ad-showing");

    if (!adShowing) {
      if (awaitingConfirm || spedUp) {
        countSkip();
        log("Quảng cáo đã kết thúc: tính là đã bỏ qua");
      }
      awaitingConfirm = false;
      spedUp = false;
      pressAttempts = 0;
      loggedAdStart = false;
      restoreVideo(video);
    } else {
      if (!loggedAdStart) {
        loggedAdStart = true;
        log("Phát hiện quảng cáo");
      }

      if (settings.muteAds && video && !video.muted) {
        video.muted = true;
        mutedByUs = true;
      }

      if (SPEED_UP_ALWAYS && video) speedUp(video);

      const skipBtn = findVisible(SKIP_SELECTORS);

      if (!skipBtn) {
        if (awaitingConfirm) {
          awaitingConfirm = false;
          pressAttempts = 0;
          spedUp = false;
          countSkip();
          log("Nút Skip đã biến mất: tính là đã bỏ qua");
        }
      } else {
        if (
          effectiveOpacity(skipBtn) >= 0.9 &&
          Date.now() - lastPressAt > 1200
        ) {
          lastPressAt = Date.now();
          pressAttempts++;
          awaitingConfirm = true;
          log("Bấm Skip, lần", pressAttempts, skipBtn);
          pressButton(skipBtn);
        }
        if (SPEED_UP_FALLBACK && pressAttempts >= 2 && video) speedUp(video);
      }
    }

    const closeBtn = findVisible(OVERLAY_CLOSE_SELECTORS);
    if (closeBtn) closeBtn.click();
  }

  function schedule() {
    if (pending) return;
    const wait = Math.max(0, 100 - (Date.now() - lastRun));
    pending = setTimeout(() => {
      pending = null;
      try {
        handle();
      } catch (err) {
        log("Lỗi:", err);
      }
    }, wait);
  }

  try {
    chrome.storage.sync.get(DEFAULTS, (stored) => {
      settings = { ...DEFAULTS, ...stored };
      schedule();
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "sync") return;
      for (const key in changes) settings[key] = changes[key].newValue;
      schedule();
    });
  } catch (_) {}

  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class"],
  });

  setInterval(schedule, 1000);
})();
