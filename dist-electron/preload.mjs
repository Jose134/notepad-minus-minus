"use strict";
const electron = require("electron");
var Messages = /* @__PURE__ */ ((Messages2) => {
  Messages2["NEW_FILE"] = "new-file";
  Messages2["OPEN_FILE"] = "open-file";
  Messages2["SAVE_FILE"] = "save-file";
  Messages2["CLOSE_CURRENT_TAB"] = "close-current-tab";
  Messages2["OPEN_SETTINGS"] = "open-settings";
  Messages2["GET_ACTIVE_TAB"] = "get-active-tab";
  Messages2["GET_APP_STATE"] = "get-app-state";
  Messages2["TAB_UPDATED"] = "tab-updated";
  Messages2["APP_STATE_UPDATED"] = "app-state-updated";
  Messages2["ASK_SAVE_TAB"] = "ask-save-tab";
  return Messages2;
})(Messages || {});
const exposedAPI = {
  onNewFile: (callback) => {
    electron.ipcRenderer.on(Messages.NEW_FILE, () => {
      callback();
    });
  },
  onOpenFile: (callback) => {
    electron.ipcRenderer.on(Messages.OPEN_FILE, (_event, filePath, content) => {
      callback(filePath, content);
    });
  },
  onCloseCurrentTab: (callback) => {
    electron.ipcRenderer.on(Messages.CLOSE_CURRENT_TAB, () => {
      callback();
    });
  },
  onOpenSettings: (callback) => {
    electron.ipcRenderer.on(Messages.OPEN_SETTINGS, () => {
      callback();
    });
  },
  onGetActiveTab: (getter) => {
    electron.ipcRenderer.on(Messages.GET_ACTIVE_TAB, async () => {
      const activeTab = getter();
      electron.ipcRenderer.send(Messages.GET_ACTIVE_TAB, activeTab);
    });
  },
  onGetAppState: (getter) => {
    electron.ipcRenderer.on(Messages.GET_APP_STATE, async () => {
      const appState = getter();
      electron.ipcRenderer.send(Messages.GET_APP_STATE, appState);
    });
  },
  onTabUpdated: (callback) => {
    electron.ipcRenderer.on(Messages.TAB_UPDATED, (_event, tab) => {
      callback(tab);
    });
  },
  onAppStateUpdated: (callback) => {
    electron.ipcRenderer.on(Messages.APP_STATE_UPDATED, (_event, appState) => {
      callback(appState);
    });
  },
  askSaveTab: (tab) => {
    electron.ipcRenderer.send(Messages.ASK_SAVE_TAB, tab);
  },
  listenNextAskSaveResult: (callback) => {
    electron.ipcRenderer.once(Messages.ASK_SAVE_TAB, (_event, cancel) => {
      callback(cancel);
    });
  },
  clearCallbacks: () => {
    for (const key in Messages) {
      const message = Messages[key];
      electron.ipcRenderer.removeAllListeners(message);
    }
  }
};
electron.contextBridge.exposeInMainWorld("electron", exposedAPI);
