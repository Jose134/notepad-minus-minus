import { ipcRenderer, contextBridge } from 'electron'

export interface IElectronAPI {
  onOpenFile: (callback: (filePath: string, content: string) => void) => void,
  clearOpenFileCallbacks: () => void
}

const exposedAPI: IElectronAPI = {
  onOpenFile: (callback) => {
    ipcRenderer.on('open-file', (_event, filePath, content) => {
      callback(filePath, content);
    });
  },
  clearOpenFileCallbacks: () => {
    ipcRenderer.removeAllListeners('open-file');
  }
}

contextBridge.exposeInMainWorld('electron', exposedAPI);


declare global {
  interface Window {
    electron: IElectronAPI,
  }
}