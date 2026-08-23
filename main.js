const { app, BrowserWindow, session, ipcRenderer, ipcMain } = require('electron');
const path = require('path');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 720,
    minHeight: 480,
    backgroundColor: '#14161a',
    autoHideMenuBar: true,
    frame: false,
    title: 'Matte',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true
    }
  });

  // Let links targeting new windows open as normal popups via the shell of the UI
  const argUrl = process.argv.find((a, i) => i > 1 && /^https?:\/\//i.test(a));
  const query = argUrl ? '?url=' + encodeURIComponent(argUrl) : '';
  win.loadFile(path.join(__dirname, 'ui', 'index.html'), { search: query });
}

app.whenReady().then(() => {
  ipcMain.on('win:minimize', () => win?.minimize());
  ipcMain.on('win:maximize', () => {
    if (!win) return;
    win.isMaximized() ? win.unmaximize() : win.maximize();
  });
  ipcMain.on('win:close', () => win?.close());

  const ses = session.defaultSession;
  ses.setPermissionRequestHandler((wc, permission, callback) => {
    callback(['media', 'audioCapture', 'videoCapture', 'geolocation', 'notifications', 'fullscreen'].includes(permission));
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
