import { ipcRenderer, contextBridge } from 'electron'
import Messages from './messages';
import Tab from '../src/models/Tab';
import AppState from '../src/models/AppState';

export interface IElectronAPI {
  onNewFile: (callback: () => void) => void,
  onOpenFile: (callback: (filePath: string, content: string) => void) => void,
  onCloseCurrentTab: (callback: () => void) => void,
  onOpenSettings: (callback: () => void) => void,
  onGetActiveTab: (callback: () => Tab | null) => void,
  onGetAppState: (callback: () => AppState) => void,
  onTabUpdated: (callback: (tab: Tab) => void) => void,
  onAppStateUpdated: (callback: (appState: AppState) => void) => void,
  askSaveTab: (tab: Tab) => void,
  listenNextAskSaveResult: (callback: (cancel: boolean) => void) => void,
  clearCallbacks: () => void,
}

const exposedAPI: IElectronAPI = {
  onNewFile: (callback) => {
    ipcRenderer.on(Messages.NEW_FILE, () => {
      callback();
    });
  },
  onOpenFile: (callback) => {
    ipcRenderer.on(Messages.OPEN_FILE, (_event, filePath, content) => {
      callback(filePath, content);
    });
  },
  onCloseCurrentTab: (callback) => {
    ipcRenderer.on(Messages.CLOSE_CURRENT_TAB, () => {
      callback();
    });
  },
  onOpenSettings: (callback) => {
    ipcRenderer.on(Messages.OPEN_SETTINGS, () => {
      callback();
    });
  },
  onGetActiveTab: (getter) => {
    ipcRenderer.on(Messages.GET_ACTIVE_TAB, async () => {
      const activeTab = getter();
      ipcRenderer.send(Messages.GET_ACTIVE_TAB, activeTab);
    });
  },
  onGetAppState: (getter) => {
    ipcRenderer.on(Messages.GET_APP_STATE, async () => {
      const appState = getter();
      ipcRenderer.send(Messages.GET_APP_STATE, appState);
    });
  },
  onTabUpdated: (callback) => {
    ipcRenderer.on(Messages.TAB_UPDATED, (_event, tab: Tab) => {
      callback(tab);
    });
  },
  onAppStateUpdated: (callback) => {
    ipcRenderer.on(Messages.APP_STATE_UPDATED, (_event, appState: AppState) => {
      callback(appState);
    });
  },
  askSaveTab: (tab) => {
    ipcRenderer.send(Messages.ASK_SAVE_TAB, tab);
  },
  listenNextAskSaveResult: (callback) => {
    ipcRenderer.once(Messages.ASK_SAVE_TAB, (_event, cancel: boolean) => {
      callback(cancel);
    });
  },
  clearCallbacks: () => {
    for (const key in Messages) {
      const message = Messages[key as keyof typeof Messages];
      ipcRenderer.removeAllListeners(message);
    }
  }
}

contextBridge.exposeInMainWorld('electron', exposedAPI);


declare global {
  interface Window {
    electron: IElectronAPI,
  }
}