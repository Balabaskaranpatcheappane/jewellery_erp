import { app, BrowserWindow } from 'electron';
import { join, normalize } from 'node:path';
import { createServer, type Server } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';

const rendererDevUrl = process.env.ELECTRON_RENDERER_URL;
// Production renderer is served over http://localhost (not file://) so that
// WebAuthn / Windows Hello (fingerprint login) has a valid secure origin.
const PROD_PORT = 4180;
const PROD_ORIGIN = `http://localhost:${PROD_PORT}`;

const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

let server: Server | null = null;

/** Serves the built renderer (dist/) as a static SPA on 127.0.0.1. */
function startStaticServer(): Promise<void> {
  const root = join(__dirname, '../dist');
  return new Promise((resolve) => {
    server = createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
      let filePath = normalize(join(root, urlPath));
      if (!filePath.startsWith(root)) filePath = join(root, 'index.html'); // traversal guard
      if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
        filePath = join(root, 'index.html'); // SPA fallback
      }
      const ext = filePath.slice(filePath.lastIndexOf('.'));
      res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');
      createReadStream(filePath).pipe(res);
    });
    server.listen(PROD_PORT, '127.0.0.1', () => resolve());
  });
}

async function createWindow(): Promise<void> {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    title: 'Jewelry ERP',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (rendererDevUrl) {
    void win.loadURL(rendererDevUrl);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    if (!server) await startStaticServer();
    void win.loadURL(PROD_ORIGIN);
  }
}

app.whenReady().then(() => {
  void createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    server?.close();
    app.quit();
  }
});
