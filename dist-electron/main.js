import { app, BrowserWindow, ipcMain, dialog, Menu } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
var Messages = /* @__PURE__ */ ((Messages2) => {
  Messages2["NEW_FILE"] = "new-file";
  Messages2["OPEN_FILE"] = "open-file";
  Messages2["SAVE_FILE"] = "save-file";
  Messages2["CLOSE_CURRENT_TAB"] = "close-current-tab";
  Messages2["GET_ACTIVE_TAB"] = "get-active-tab";
  Messages2["GET_APP_STATE"] = "get-app-state";
  Messages2["TAB_UPDATED"] = "tab-updated";
  Messages2["APP_STATE_UPDATED"] = "app-state-updated";
  Messages2["ASK_SAVE_TAB"] = "ask-save-tab";
  return Messages2;
})(Messages || {});
const require2 = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
const APP_STATE_FILE_PATH = path.join(process.env.APP_ROOT, "appState");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  console.log(path.join(__dirname, "preload.mjs"));
  win = new BrowserWindow({
    title: "Notepad--",
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
  win.webContents.openDevTools();
  createMenu(win);
  win.on("ready-to-show", () => {
    console.log("Window is ready to show");
    if (win) {
      restoreState(win).catch((err) => {
        console.error("Failed to restore state:", err);
      });
    }
  });
  win.on("close", (event) => {
    if (win) {
      event.preventDefault();
      const closeWindow = () => {
        win == null ? void 0 : win.removeAllListeners("close");
        win == null ? void 0 : win.close();
      };
      preserveState(win).then(() => {
        closeWindow();
      }).catch((err) => {
        console.error("Failed to preserve state:", err);
        closeWindow();
      });
    }
  });
}
function createMenu(win2) {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "New File",
          accelerator: "CommandOrControl+N",
          click: () => {
            win2.webContents.send(Messages.NEW_FILE);
          }
        },
        {
          label: "Open...",
          accelerator: "CommandOrControl+O",
          click: () => {
            openFile(win2);
          }
        },
        {
          label: "Save",
          accelerator: "CommandOrControl+S",
          click: () => {
            saveActiveTab(win2);
          }
        },
        {
          label: "Close Current Tab",
          accelerator: "CommandOrControl+W",
          click: () => {
            win2.webContents.send(Messages.CLOSE_CURRENT_TAB);
          }
        },
        {
          label: "Exit",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Alt+F4",
          click: () => {
            app.quit();
          }
        }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(createWindow);
ipcMain.on(Messages.ASK_SAVE_TAB, async (_event, tab) => {
  let DialogResponse;
  ((DialogResponse2) => {
    DialogResponse2[DialogResponse2["SAVE"] = 0] = "SAVE";
    DialogResponse2[DialogResponse2["DONT_SAVE"] = 1] = "DONT_SAVE";
    DialogResponse2[DialogResponse2["CANCEL"] = 2] = "CANCEL";
  })(DialogResponse || (DialogResponse = {}));
  const showConfirmDialog = async () => {
    const result = await dialog.showMessageBox({
      type: "info",
      noLink: true,
      buttons: ["Save", "Don't Save", "Cancel"],
      title: "Unsaved Changes",
      message: `The tab "${tab.name}" has unsaved changes. Do you want to save it?`
    });
    return result.response;
  };
  if (win) {
    const dialogResponse = await showConfirmDialog();
    if (dialogResponse === 0) {
      const saved = await saveTabToFile(win, tab);
      win.webContents.send(Messages.ASK_SAVE_TAB, !saved);
    } else {
      win.webContents.send(
        Messages.ASK_SAVE_TAB,
        dialogResponse === 2
        /* CANCEL */
      );
    }
  }
});
const getAppState = (win2, callback) => {
  ipcMain.once(Messages.GET_APP_STATE, (_event, appState) => {
    callback(appState);
  });
  win2.webContents.send(Messages.GET_APP_STATE);
};
const getActiveTab = (win2, callback) => {
  ipcMain.once(Messages.GET_ACTIVE_TAB, (_event, tab) => {
    callback(tab);
  });
  win2.webContents.send(Messages.GET_ACTIVE_TAB);
};
const preserveState = async (win2) => {
  return new Promise((resolve, reject) => {
    getAppState(win2, (appState) => {
      const comrpessedState = require2("lz-string").compressToUTF16(JSON.stringify(appState));
      fs.writeFile(APP_STATE_FILE_PATH, comrpessedState, "utf-16le", (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
};
const restoreState = async (win2) => {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(APP_STATE_FILE_PATH)) {
      fs.readFile(APP_STATE_FILE_PATH, "utf-16le", (err, data) => {
        if (!err) {
          const appStateStr = require2("lz-string").decompressFromUTF16(data);
          try {
            const appState = JSON.parse(appStateStr);
            win2.webContents.send(Messages.APP_STATE_UPDATED, appState);
            resolve();
          } catch (error) {
            reject(error);
          }
        } else {
          reject(err);
        }
      });
    } else {
      reject(new Error("No saved tabs found."));
    }
  });
};
const openFile = (win2) => {
  const openDialog = async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ["openFile"] });
    if (canceled || filePaths.length === 0) return null;
    const content = fs.readFileSync(filePaths[0], "utf-8");
    return { path: filePaths[0], content };
  };
  openDialog().then((result) => {
    win2.webContents.send(Messages.OPEN_FILE, result == null ? void 0 : result.path, result == null ? void 0 : result.content);
  });
};
const saveActiveTab = (win2) => {
  getActiveTab(win2, async (tab) => {
    if (tab) {
      saveTabToFile(win2, tab);
    } else {
      console.error("No active tab found to save.");
    }
  });
};
const saveTabToFile = async (win2, tab) => {
  const saveDialog = async () => {
    const { canceled, filePath: filePath2 } = await dialog.showSaveDialog({});
    console.log(canceled, filePath2);
    if (canceled || !filePath2) return null;
    return filePath2;
  };
  const filePath = tab.path ?? await saveDialog();
  if (filePath) {
    try {
      fs.writeFileSync(filePath, tab.content ?? "", "utf-8");
      tab.name = path.basename(filePath) || "New File";
      tab.dirty = false;
      tab.path = filePath;
      win2.webContents.send(Messages.TAB_UPDATED, {
        ...tab
      });
      return true;
    } catch (error) {
      console.error("Failed to save tab:", error);
      return false;
    }
  } else {
    return false;
  }
};
export {
  APP_STATE_FILE_PATH,
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
