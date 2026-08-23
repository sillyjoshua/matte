# Matte Browser

**Matte** is a sleek, privacy-respecting desktop browser with a custom-built UI — project codename **Silver Gate**.

![Matte](https://img.shields.io/badge/version-1.0.0_Silver_Gate-blue)

## Features
- 🎨 Custom dark **Silver Gate** theme with glassy rounded tabs and pill omnibox
- 🗂 Full multi-tab browsing (Ctrl+T new tab, Ctrl+W close, Ctrl+Tab cycle)
- 🔍 Smart omnibox — searches DuckDuckGo or navigates directly
- ⚡ Fast navigation with back / forward / reload and a live page-load progress bar
- 🔒 Secure by default: context isolation, no node integration in pages
- 🪟 Frameless window with integrated custom title-bar controls

## Tech
Built on [Electron](https://www.electronjs.org/) with vanilla HTML/CSS/JS — no frameworks, tiny footprint.

## Run from source
```bash
npm install
npm start
```

## Build the installer
```bash
npm run dist
```
Outputs `dist/Matte-Setup-1.0.0.exe`.

## License
MIT
