import { ipcRenderer, contextBridge } from 'electron'
import Messages from './messages';
import Tab from '../src/models/Tab';

export interface IElectronAPI {
  onNewFile: (callback: () => void) => void,
  onOpenFile: (callback: (filePath: string, content: string) => void) => void,
  onCloseCurrentTab: (callback: () => void) => void,
  onGetActiveTab: (callback: () => Tab | null) => void,
  onGetAllTabs: (callback: () => Tab[]) => void,
  onTabUpdated: (callback: (tab: Tab) => void) => void,
  onAllTabsUpdated: (callback: (tabs: Tab[]) => void) => void,
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
  onGetActiveTab: (getter) => {
    ipcRenderer.on(Messages.GET_ACTIVE_TAB, async () => {
      const activeTab = getter();
      ipcRenderer.send(Messages.GET_ACTIVE_TAB, activeTab);
    });
  },
  onGetAllTabs: (getter) => {
    ipcRenderer.on(Messages.GET_ALL_TABS, async () => {
      const allTabs = getter();
      ipcRenderer.send(Messages.GET_ALL_TABS, allTabs);
    });
  },
  onTabUpdated: (callback) => {
    ipcRenderer.on(Messages.TAB_UPDATED, (_event, tab: Tab) => {
      callback(tab);
    });
  },
  onAllTabsUpdated: (callback) => {
    ipcRenderer.on(Messages.ALL_TABS_UPDATED, (_event, tabs: Tab[]) => {
      callback(tabs);
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