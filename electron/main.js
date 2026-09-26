const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const { spawn } = require('node:child_process');

let mainWindow;
let serverProcess;

function startServer() {
  const isDev = process.argv.includes('--dev');
  const serverDir = path.join(__dirname, '..', 'server');
  const script = path.join(serverDir, 'node_modules', 'tsx', 'dist', 'cli.mjs');

  serverProcess = spawn(process.execPath, [script, 'src/index.ts'], {
    cwd: serverDir,
    env: {
      ...process.env,
      PORT: process.env.PORT || '3001',
      CLIENT_ORIGIN: isDev ? 'http://localhost:5173' : 'http://localhost:3001',
      MARKET_DATA_PROVIDER: process.env.MARKET_DATA_PROVIDER || 'mock',
    },
    stdio: 'inherit',
  });

  serverProcess.on('exit', (code, signal) => {
    if (code !== null) console.log(`Server exited with code ${code}`);
    if (signal) console.log(`Server exited with signal ${signal}`);
  });
}

function createWindow() {
  const isDev = process.argv.includes('--dev');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0b0f19',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, '..', 'client', 'dist', 'index.html');
    mainWindow.loadFile(indexPath);
  }
}

app.whenReady().then(() => {
  startServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill('SIGTERM');
  }
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill('SIGTERM');
  }
});
