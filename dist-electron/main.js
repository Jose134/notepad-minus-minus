import { app, BrowserWindow, Menu, dialog } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
const require2 = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  console.log(path.join(__dirname, "preload.mjs"));
  win = new BrowserWindow({
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
}
function createMenu(win2) {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "New File",
          accelerator: "Ctrl+N",
          click: () => {
            win2.webContents.send("menu-new");
          }
        },
        {
          label: "Open...",
          accelerator: "Ctrl+O",
          click: () => {
            openFile(win2);
          }
        },
        {
          label: "Save",
          accelerator: "Ctrl+S",
          click: () => {
            win2.webContents.send("menu-save");
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
const openFile = (win2) => {
  const openDialog = async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ["openFile"] });
    if (canceled || filePaths.length === 0) return null;
    const fs = require2("fs");
    const content = fs.readFileSync(filePaths[0], "utf-8");
    return { path: filePaths[0], content };
  };
  openDialog().then((result) => {
    win2.webContents.send("open-file", result == null ? void 0 : result.path, result == null ? void 0 : result.content);
  });
};
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
