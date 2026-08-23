/* Matte browser — tab & omnibox logic */
'use strict';

const HOME = 'https://www.duckduckgo.com/';
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
  return 'https://duckduckgo.com/?q=' + encodeURIComponent(t);
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
  el.innerHTML = `<span class="tab-title"></span><button class="tab-close" title="Close tab">&#x2715;</button>`;
  el.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-close')) { closeTab(id); return; }
    activateTab(id);
  });
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
      omnibox.value = e.url.startsWith('https://duckduckgo.com/?q=')
        ? decodeURIComponent(e.url.split('q=')[1] || '') : e.url;
    }
  });
  wv.addEventListener('did-navigate-in-page', (e) => {
    if (tab.id === activeId && e.url && !e.isMainFrame === false) omnibox.value = e.url;
  });

  wv.addEventListener('did-start-loading', () => {
    if (tab.id === activeId) progressFill.classList.add('loading'), setProgress(30);
  });
  wv.addEventListener('did-stop-loading', () => {
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
  omnibox.value = url.startsWith('https://duckduckgo.com/?q=')
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

omnibox.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const url = normalizeInput(omnibox.value);
  if (url) current()?.webview.loadURL(url);
  current()?.webview.focus();
});

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

/* Boot */
const bootUrl = new URLSearchParams(location.search).get('url');
if (bootUrl) {
  const t = createTab(decodeURIComponent(bootUrl));
} else {
  createTab(HOME);
}
