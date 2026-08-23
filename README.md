# Matte Browser

**Matte** is a sleek, privacy-respecting desktop browser with a custom-built UI — project codename **Silver Gate**.

![Matte](https://img.shields.io/badge/version-1.1.0_Silver_Gate-blue)

## Features
- 🎨 Custom dark **Silver Gate** theme with glassy rounded tabs and pill omnibox
- 🗂 Full multi-tab browsing (Ctrl+T new tab, Ctrl+W close, Ctrl+Tab cycle)
- 🔍 Smart omnibox — searches DuckDuckGo or navigates directly
- ⚡ Fast navigation with back / forward / reload and a live page-load progress bar
- 🚀 URL-launch support — run `Matte.exe https://example.com` to open any site on startup
- 🔒 Secure by default: context isolation, no node integration in pages
- 🪟 Frameless window with integrated custom title-bar controls

## Installation

You can install Matte **two ways**: with the ready-made `.exe` installer, or from source with Git.

---

### Option 1 — Install with the .exe (easiest)

1. Go to the [Releases page](../../releases).
2. Download the latest **`Matte-Setup-x.x.x.exe`** asset.
3. Run the installer, pick an install folder if you like, and finish.
4. Launch **Matte** from your desktop or Start menu. Done! ✅

> ⚠️ The exe is unsigned, so Windows SmartScreen may appear on first run.
> Click **More info → Run anyway** to continue.

---

### Option 2 — Install with Git (from source)

#### Prerequisites
Make sure you have these installed first:
| Tool | Get it from | Check with |
|------|-------------|------------|
| [Node.js](https://nodejs.org/) (LTS) | https://nodejs.org | `node -v` |
| [Git](https://git-scm.com/) | https://git-scm.com | `git --version` |

#### Tutorial

**Step 1 — Clone the repository**
```bash
git clone https://github.com/sillyjoshua/matte-insider.git
cd matte-insider
```
(For the stable repo use: `git clone https://github.com/sillyjoshua/matte.git`)

**Step 2 — Install dependencies**
```bash
npm install
```
This downloads Electron and the build tools (a one-time ~200 MB download).

**Step 3 — Run Matte**
```bash
npm start
```
That's it — Matte launches with the Silver Gate UI. 🎉

**Optional — open a website straight away**
```bash
npm start -- https://duckduckgo.com
```

**Optional — build your own .exe installer**
```bash
npm run dist
```
The installer appears at `dist/Matte-Setup-<version>.exe`.

#### Updating later
Just pull the newest code:
```bash
git pull
npm install
```

---

## Tech
Built on [Electron](https://www.electronjs.org/) with vanilla HTML/CSS/JS — no frameworks, tiny footprint.

## License
MIT
