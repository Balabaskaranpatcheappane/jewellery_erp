/// <reference types="vite/client" />

interface ErpBridge {
  apiBaseUrl: string;
  platform: string;
}

interface Window {
  erp?: ErpBridge;
}
