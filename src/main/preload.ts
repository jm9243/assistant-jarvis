import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel: string, args: any) => {
      ipcRenderer.send(channel, args);
    },
    invoke: (channel: string, args?: any) => {
      return ipcRenderer.invoke(channel, args);
    },
    on: (channel: string, func: (...args: any[]) => void) => {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    once: (channel: string, func: (...args: any[]) => void) => {
      ipcRenderer.once(channel, (event, ...args) => func(...args));
    },
    removeListener: (channel: string, func: (...args: any[]) => void) => {
      ipcRenderer.removeListener(channel, func);
    },
  },
  app: {
    getVersion: () => ipcRenderer.invoke('get-app-version'),
    getAppPath: () => ipcRenderer.invoke('get-app-path'),
    getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  },
});

// Type augmentation for window object
declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        send: (channel: string, args: any) => void;
        invoke: (channel: string, args?: any) => Promise<any>;
        on: (channel: string, func: (...args: any[]) => void) => void;
        once: (channel: string, func: (...args: any[]) => void) => void;
        removeListener: (channel: string, func: (...args: any[]) => void) => void;
      };
      app: {
        getVersion: () => Promise<string>;
        getAppPath: () => Promise<string>;
        getUserDataPath: () => Promise<string>;
      };
    };
  }
}

export {};
