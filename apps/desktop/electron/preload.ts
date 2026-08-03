import { contextBridge } from 'electron';

// Minimal, safe bridge. The API base URL is exposed so the renderer talks to
// the local NestJS server. Extend this with IPC channels (native printing,
// file dialogs, backup/restore) as those features land.
const api = {
  apiBaseUrl: 'http://localhost:3000/api',
  platform: process.platform,
};

contextBridge.exposeInMainWorld('erp', api);

export type ErpBridge = typeof api;
