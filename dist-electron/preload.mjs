"use strict";
const electron = require("electron");
const exposedAPI = {
  onOpenFile: (callback) => {
    electron.ipcRenderer.on("open-file", (_event, filePath, content) => {
      callback(filePath, content);
    });
  },
  clearOpenFileCallbacks: () => {
    electron.ipcRenderer.removeAllListeners("open-file");
  }
};
electron.contextBridge.exposeInMainWorld("electron", exposedAPI);
