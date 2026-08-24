/* Matte browser — tab & omnibox logic */
'use strict';

const HOME = 'https://www.google.com/';
const content = document.getElementById('content');
const tabsEl = document.getElementById('tabs');
const omnibox = document.getElementById('omnibox');

let tabs = [];          // { id, webview, title }
let activeId = null;
let nextId = 1;

function normalizeInput(text) {
  const t = text.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(t) && !t.includes(' ')) return 'https://' + t;
  return 'https://www.google.com/search?q=' + encodeURIComponent(t);
}

function createTab(url = HOME, activate = true) {
  const id = nextId++;
  const wv = document.createElement('webview');
  wv.setAttribute('allowpopups', '');
  wv.src = url;
  content.appendChild(wv);

  const tab = { id, webview: wv, title: 'New Tab' };
  tabs.push(tab);

  // Tab strip element
  const el = document.createElement('div');
  el.className = 'tab';
  el.dataset.id = id;
  el.innerHTML = `<span class="favicon"></span><span class="tab-title"></span><button class="tab-close" title="Close tab">&#x2715;</button>`;
  el.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-close')) { closeTab(id); return; }
    activateTab(id);
  });
  el.addEventListener('auxclick', (e) => { if (e.button === 1) closeTab(id); });
  tabsEl.appendChild(el);
  tab.el = el;

  wireWebview(tab);

  if (activate) activateTab(id);
  return tab;
}

function wireWebview(tab) {
  const { webview: wv, el } = tab;
  const titleEl = el.querySelector('.tab-title');

  wv.addEventListener('page-title-updated', (e) => {
    tab.title = e.title || 'Untitled';
    titleEl.textContent = tab.title;
    el.title = tab.title;
    if (tab.id === activeId) document.title = tab.title + ' — Matte';
  });

  wv.addEventListener('did-navigate', (e) => {
    if (tab.id === activeId && e.url) {
      omnibox.value = e.url.startsWith('https://www.google.com/search?q=')
        ? decodeURIComponent(e.url.split('q=')[1] || '') : e.url;
    }
  });
  wv.addEventListener('did-navigate-in-page', (e) => {
    if (tab.id === activeId && e.url && !e.isMainFrame === false) omnibox.value = e.url;
  });

  wv.addEventListener('did-start-loading', () => {
    el.classList.add('loading');
    if (tab.id === activeId) progressFill.classList.add('loading'), setProgress(30);
  });
  wv.addEventListener('did-stop-loading', () => {
    el.classList.remove('loading');
    if (tab.id === activeId) { setProgress(100); setTimeout(() => { progressFill.classList.remove('loading'); setProgress(0); }, 250); }
  });

  wv.addEventListener('update-target-url', (e) => {
    statusbar.hidden = !e.url;
    statusbar.textContent = e.url || '';
  });

  wv.addEventListener('new-window', (e) => createTab(e.url));
}

function setProgress(pct) { progressFill.style.width = pct + '%'; }

function activateTab(id) {
  activeId = id;
  for (const t of tabs) {
    t.webview.style.display = t.id === id ? '' : 'none';
    t.el.classList.toggle('active', t.id === id);
  }
  const tab = tabs.find((t) => t.id === id);
  if (!tab) return;
  document.title = tab.title + ' — Matte';
  const url = tab.webview.getURL ? safeUrl(tab) : '';
  omnibox.value = url.startsWith('https://www.google.com/search?q=')
    ? decodeURIComponent(url.split('q=')[1] || '') : url;
  omnibox.select();
}

function safeUrl(tab) { try { return tab.webview.getURL(); } catch (_) { return ''; } }

function closeTab(id) {
  const idx = tabs.findIndex((t) => t.id === id);
  if (idx === -1) return;
  const tab = tabs[idx];
  tab.el.remove();
  tab.webview.remove();
  tabs.splice(idx, 1);
  if (tabs.length === 0) { app.quit(); return; }
  if (activeId === id) activateTab(tabs[Math.min(idx, tabs.length - 1)].id);
}
function appQuit() { window.close(); }
function app() { return { quit: appQuit }; }

/* ── Wire up controls ── */
document.getElementById('newtab').addEventListener('click', () => {
  const t = createTab();
  setTimeout(() => omnibox.focus(), 50);
});
document.getElementById('btn-min').addEventListener('click', () => window.matte.minimize());
document.getElementById('btn-max').addEventListener('click', () => window.matte.maximize());
document.getElementById('btn-close').addEventListener('click', () => window.matte.close());

document.getElementById('back').addEventListener('click', () => current()?.webview.goBack());
document.getElementById('forward').addEventListener('click', () => current()?.webview.goForward());
document.getElementById('reload').addEventListener('click', () => current()?.webview.reload());
document.getElementById('home').addEventListener('click', () => current()?.webview.loadURL(HOME));

omnibox.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  handleOmniboxSubmit(omnibox.value);
});

function handleOmniboxSubmit(text) {
  if (/^jarvis\b/i.test(text.trim())) {
    jarvisCommand(text.trim().replace(/^jarvis\s*,?\s*/i, ''));
    return;
  }
  const url = normalizeInput(text);
  if (url) current()?.webview.loadURL(url);
  current()?.webview.focus();
}

/* ── Jarvis ─────────────────────────────────────────────────── */
const KNOWN_SITES = {
  google: 'https://www.google.com', youtube: 'https://www.youtube.com',
  gmail: 'https://mail.google.com', maps: 'https://maps.google.com',
  drive: 'https://drive.google.com', github: 'https://github.com',
  reddit: 'https://www.reddit.com', twitter: 'https://twitter.com',
  x: 'https://twitter.com', wikipedia: 'https://www.wikipedia.org',
  amazon: 'https://www.amazon.com', netflix: 'https://www.netflix.com',
  spotify: 'https://open.spotify.com', discord: 'https://discord.com/app',
  twitch: 'https://www.twitch.tv', instagram: 'https://www.instagram.com',
  facebook: 'https://www.facebook.com', stackoverflow: 'https://stackoverflow.com',
  chatgpt: 'https://chat.openai.com', news: 'https://news.google.com'
};

const jarvisChip = document.getElementById('jarvis-chip');
const jarvisState = document.getElementById('jarvis-state');

function jarvisShow(active, ms = 2200) {
  jarvisChip.hidden = !active;
  jarvisState.hidden = !active;
  if (active && ms) setTimeout(() => { jarvisChip.hidden = true; jarvisState.hidden = true; }, ms);
}

function jarvisLocalParse(cmd) {
  const c = cmd.toLowerCase().trim();
  const siteKey = Object.keys(KNOWN_SITES).find((k) => new RegExp(`\\b${k}\\b`).test(c));
  // "go to / open / visit / take me to X"
  let m = c.match(/^(?:go\s*to|open|visit|launch|take\s*me\s*to)\s+(.+)$/);
  if (m) {
    const target = m[1].replace(/[.!?]+$/, '');
    if (siteKey) return { action: 'goto', url: KNOWN_SITES[siteKey] };
    const u = normalizeInput(target);
    if (u && /^https?:\/\//.test(u)) return { action: 'goto', url: u };
    return { action: 'search', q: target };
  }
  // "search (for) X"
  m = c.match(/^(?:search|google|look\s*up|find)(?:\s+for)?\s+(.+)$/);
  if (m) return { action: 'search', q: m[1] };
  // bare known-site name
  if (siteKey && c.split(/\s+/).length <= 3) return { action: 'goto', url: KNOWN_SITES[siteKey] };
  return null;
}

async function jarvisApiParse(cmd) {
  const apiOn = document.getElementById('jarvis-api').checked;
  const endpoint = (localStorage.getItem('matte.jarvis.endpoint') || '').trim();
  const key = (localStorage.getItem('matte.jarvis.key') || '').trim();
  if (!apiOn || !endpoint || !key) return null; // must connect your own key
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({
        model: 'default',
        messages: [
          { role: 'system', content:
            'You are Jarvis inside the Matte browser. Convert the user command into JSON: {"action":"goto","url":"..."} to navigate, {"action":"search","q":"..."} to search Google, or {"action":"none"}. Reply with ONLY the JSON.' },
          { role: 'user', content: cmd }
        ]
      })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const txt = data.choices?.[0]?.message?.content || '';
    const jm = txt.match(/\{[\s\S]*\}/);
    return jm ? JSON.parse(jm[0]) : null;
  } catch (_) {
    return null; // api.navy unreachable or unsupported — fail silently
  }
}

async function jarvisCommand(cmd) {
  if (!cmd) { omnibox.value = ''; return; }
  jarvisShow(true, 0); // show while thinking
  let plan = jarvisLocalParse(cmd);
  if (!plan) plan = await jarvisApiParse(cmd);
  jarvisShow(true);

  if (plan?.action === 'goto' && plan.url) {
    current()?.webview.loadURL(plan.url);
  } else if (plan?.action === 'search' && plan.q) {
    current()?.webview.loadURL('https://www.google.com/search?q=' + encodeURIComponent(plan.q));
  } else {
    // Last resort: just search whatever was said
    current()?.webview.loadURL('https://www.google.com/search?q=' + encodeURIComponent(cmd));
  }
  current()?.webview.focus();
}

const progressFill = document.getElementById('progressfill');
const statusbar = document.getElementById('statusbar');

function current() { return tabs.find((t) => t.id === activeId); }

window.addEventListener('keydown', (e) => {
  if (!(e.ctrlKey)) return;
  const k = e.key.toLowerCase();
  if (k === 't') { e.preventDefault(); createTab(); setTimeout(() => omnibox.focus(), 50); }
  else if (k === 'w') { e.preventDefault(); closeTab(activeId); }
  else if (k === 'r') { e.preventDefault(); current()?.webview.reload(); }
  else if (k === 'l') { e.preventDefault(); omnibox.focus(); omnibox.select(); }
  else if (k === 'tab') { e.preventDefault(); if (tabs.length > 1) { const i = tabs.findIndex((t) => t.id === activeId); activateTab(tabs[(i + 1) % tabs.length].id); } }
});

/* ── Settings: themes, custom CSS, updates ─────────────────── */
const APP_VERSION = '1.2.1';
const UPDATE_REPO = 'sillyjoshua/matte';

const settingsOverlay = document.getElementById('settings-overlay');
const themeCards = document.querySelectorAll('.theme-card');
const customCssEl = document.getElementById('custom-css');
const userCss = document.getElementById('user-css');
const updateStatus = document.getElementById('update-status');

function openSettings() { settingsOverlay.hidden = false; }
function closeSettings() { settingsOverlay.hidden = true; }
document.getElementById('btn-menu').addEventListener('click', openSettings);
document.getElementById('btn-avatar').addEventListener('click', openSettings);
document.getElementById('btn-star').addEventListener('click', () => flash(updateStatus, 'Bookmarks coming soon ✦'));
document.getElementById('settings-close').addEventListener('click', closeSettings);
settingsOverlay.addEventListener('click', (e) => { if (e.target === settingsOverlay) closeSettings(); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !settingsOverlay.hidden) closeSettings(); });

/* Themes */
function applyTheme(name) {
  if (name === 'silvergate') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = name;
  localStorage.setItem('matte.theme', name);
  themeCards.forEach((c) => c.classList.toggle('selected', c.dataset.theme === name));
}
themeCards.forEach((card) => card.addEventListener('click', () => applyTheme(card.dataset.theme)));

/* Custom CSS */
function applyCustomCss(css, save = true) {
  userCss.textContent = css || '';
  if (save) localStorage.setItem('matte.customcss', css);
}
document.getElementById('css-apply').addEventListener('click', () => {
  applyCustomCss(customCssEl.value);
  customCssEl.value ? flash(updateStatus, 'Custom CSS applied.') : null;
});
document.getElementById('css-reset').addEventListener('click', () => {
  customCssEl.value = '';
  applyCustomCss('');
});

/* Updates */
function compareVersions(a, b) {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

async function checkForUpdates(auto = false) {
  const banner = document.getElementById('update-banner');
  try {
    const res = await fetch(`https://api.github.com/repos/${UPDATE_REPO}/releases/latest`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const rel = await res.json();
    // Prefer the version embedded in the installer asset filename (Matte-Setup-X.Y.Z.exe),
    // falling back to digits parsed from the tag name.
    let version = '';
    for (const a of rel.assets || []) {
      const m = /Matte-Setup-([\d.]+)\.exe$/i.exec(a.name || '');
      if (m) { version = m[1].replace(/\.$/, ''); break; }
    }
    if (!version) version = (rel.tag_name || '').replace(/[^0-9.]/g, '').replace(/\.$/, '') || '0';
    const newer = compareVersions(version, APP_VERSION) > 0;
    if (newer && rel.html_url) {
      document.getElementById('update-text').textContent =
        `Matte ${version} is available — you have ${APP_VERSION}.`;
      document.getElementById('update-link').href = rel.html_url;
      banner.hidden = false;
      updateStatus.textContent = `Update available: Matte ${version}!`;
      updateStatus.className = 'newer';
    } else {
      if (!auto) { updateStatus.textContent = `You're up to date (v${APP_VERSION}).`; updateStatus.className = 'okay'; }
    }
  } catch (err) {
    if (!auto) { updateStatus.textContent = 'Could not check for updates (offline?).'; updateStatus.className = ''; }
  }
}
document.getElementById('check-updates').addEventListener('click', () => checkForUpdates(false));
document.getElementById('update-dismiss').addEventListener('click', () => {
  document.getElementById('update-banner').hidden = true;
});
document.getElementById('auto-update').addEventListener('change', (e) => {
  localStorage.setItem('matte.autoupdate', e.target.checked ? '1' : '0');
});

/* Jarvis API connection (bring your own key) */
const jarvisApiToggle = document.getElementById('jarvis-api');
const jarvisApiConfig = document.getElementById('jarvis-api-config');
const jarvisEndpointEl = document.getElementById('jarvis-endpoint');
const jarvisKeyEl = document.getElementById('jarvis-key');
const jarvisConnStatus = document.getElementById('jarvis-conn-status');

function refreshJarvisUi() {
  jarvisApiConfig.hidden = !jarvisApiToggle.checked;
}
jarvisApiToggle.addEventListener('change', () => {
  localStorage.setItem('matte.jarvis.api', jarvisApiToggle.checked ? '1' : '0');
  refreshJarvisUi();
});
document.getElementById('jarvis-save').addEventListener('click', () => {
  localStorage.setItem('matte.jarvis.endpoint', jarvisEndpointEl.value.trim());
  localStorage.setItem('matte.jarvis.key', jarvisKeyEl.value.trim());
  const ok = !!(jarvisEndpointEl.value.trim() && jarvisKeyEl.value.trim());
  jarvisConnStatus.textContent = ok ? '✓ Connected — your key stays on this device.' : '⚠ Enter an endpoint and a key.';
  jarvisConnStatus.className = ok ? 'hint okay' : 'hint';
  setTimeout(() => { jarvisConnStatus.textContent = ''; }, 3000);
});

function flash(el, msg) { el.textContent = msg; el.className = 'okay'; setTimeout(() => { el.textContent = ''; }, 2500); }

/* Restore persisted settings */
(function restoreSettings() {
  applyTheme(localStorage.getItem('matte.theme') || 'silvergate');
  const savedCss = localStorage.getItem('matte.customcss') || '';
  customCssEl.value = savedCss;
  applyCustomCss(savedCss, false);
  document.getElementById('auto-update').checked = localStorage.getItem('matte.autoupdate') !== '0';
  jarvisApiToggle.checked = localStorage.getItem('matte.jarvis.api') === '1';
  refreshJarvisUi();
  jarvisEndpointEl.value = localStorage.getItem('matte.jarvis.endpoint') || '';
  jarvisKeyEl.value = localStorage.getItem('matte.jarvis.key') || '';
  if (localStorage.getItem('matte.autoupdate') !== '0') setTimeout(() => checkForUpdates(true), 4000);
})();

/* Boot */
const bootUrl = new URLSearchParams(location.search).get('url');
if (bootUrl) {
  const t = createTab(decodeURIComponent(bootUrl));
} else {
  createTab(HOME);
}
