"use strict";
const electron = require("electron");
var Messages = /* @__PURE__ */ ((Messages2) => {
  Messages2["NEW_FILE"] = "new-file";
  Messages2["OPEN_FILE"] = "open-file";
  Messages2["SAVE_FILE"] = "save-file";
  Messages2["CLOSE_CURRENT_TAB"] = "close-current-tab";
  Messages2["GET_ACTIVE_TAB"] = "get-active-tab";
  Messages2["GET_ALL_TABS"] = "get-all-tabs";
  Messages2["TAB_UPDATED"] = "tab-updated";
  Messages2["ALL_TABS_UPDATED"] = "all-tabs-updated";
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
  onGetActiveTab: (getter) => {
    electron.ipcRenderer.on(Messages.GET_ACTIVE_TAB, async () => {
      const activeTab = getter();
      electron.ipcRenderer.send(Messages.GET_ACTIVE_TAB, activeTab);
    });
  },
  onGetAllTabs: (getter) => {
    electron.ipcRenderer.on(Messages.GET_ALL_TABS, async () => {
      const allTabs = getter();
      electron.ipcRenderer.send(Messages.GET_ALL_TABS, allTabs);
    });
  },
  onTabUpdated: (callback) => {
    electron.ipcRenderer.on(Messages.TAB_UPDATED, (_event, tab) => {
      callback(tab);
    });
  },
  onAllTabsUpdated: (callback) => {
    electron.ipcRenderer.on(Messages.ALL_TABS_UPDATED, (_event, tabs) => {
      callback(tabs);
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
