// Chrome compatibility
if (typeof browser === 'undefined') {
  globalThis.browser = chrome;
}

// Close button
document.getElementById('close-popup').addEventListener('click', () => {
  window.close();
});

// Tidy Now button
document.getElementById('tidy-now').addEventListener('click', () => {
  // Send message to background script to trigger tidy
  browser.runtime.sendMessage({ action: 'tidy' }, () => {
    // Close after message is sent
    window.close();
  });
});

// Settings button
document.getElementById('open-settings').addEventListener('click', () => {
  // Open options page - popup will auto-close
  if (browser.runtime.openOptionsPage) {
    browser.runtime.openOptionsPage();
  } else {
    const optionsUrl = browser.runtime.getURL('options/options.html');
    browser.tabs.create({ url: optionsUrl });
  }
  // Don't call window.close() - it will close automatically
});

// Advanced toggle
const advancedToggle = document.getElementById('advanced-toggle');
const advancedOptions = document.getElementById('advanced-options');
if (advancedToggle && advancedOptions) {
  advancedToggle.addEventListener('click', () => {
    const visible = advancedOptions.style.display !== 'none';
    advancedOptions.style.display = visible ? 'none' : 'block';
  });
}

// Clear Glance set
const clearGlanceBtn = document.getElementById('clear-glance-set');
if (clearGlanceBtn) {
  clearGlanceBtn.addEventListener('click', async () => {
    await browser.runtime.sendMessage({ action: 'clearGlanceSet' });
    // Refresh UI
    await refreshGrace();
  });
}

// Grace period controls
const graceInput = document.getElementById('grace-period-input');
const currentGrace = document.getElementById('current-grace');
const saveGrace = document.getElementById('save-grace-period');
async function refreshGrace() {
  try {
    const msg = await browser.runtime.sendMessage({ action: 'getGlanceGraceMs' });
    const ms = msg && typeof msg.graceMs === 'number' ? msg.graceMs : 0;
    const secs = Math.round(ms / 1000);
    if (graceInput) graceInput.value = secs;
    if (currentGrace) currentGrace.textContent = secs.toString();
  } catch (e) {
    // ignore
  }
}
if (saveGrace) {
  saveGrace.addEventListener('click', async () => {
    const secs = parseInt(graceInput.value || '0', 10);
    const ms = Math.max(0, Number(secs) * 1000);
    await browser.runtime.sendMessage({ action: 'setGlanceGracePeriod', graceMs: ms });
    refreshGrace();
  });
}

(async function initPopupAdvanced() {
  await refreshGrace();
})();