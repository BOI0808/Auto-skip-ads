const DEFAULTS = { enabled: true, muteAds: true };

const enabledEl = document.getElementById('enabled');
const muteEl = document.getElementById('muteAds');
const countEl = document.getElementById('count');
const resetEl = document.getElementById('reset');

chrome.storage.sync.get(DEFAULTS, (s) => {
  enabledEl.checked = s.enabled;
  muteEl.checked = s.muteAds;
});

chrome.storage.local.get({ adsSkipped: 0 }, (d) => {
  countEl.textContent = d.adsSkipped;
});

enabledEl.addEventListener('change', () => {
  chrome.storage.sync.set({ enabled: enabledEl.checked });
});

muteEl.addEventListener('change', () => {
  chrome.storage.sync.set({ muteAds: muteEl.checked });
});

resetEl.addEventListener('click', () => {
  chrome.storage.local.set({ adsSkipped: 0 });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.adsSkipped) {
    countEl.textContent = changes.adsSkipped.newValue || 0;
  }
});