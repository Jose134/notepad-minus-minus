import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import Messages from './messages'
import Tab from '../src/models/Tab'
import AppState from '../src/models/AppState'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const APP_STATE_FILE_PATH = path.join(process.env.APP_ROOT, 'appState')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  console.log(path.join(__dirname, 'preload.mjs'));
  win = new BrowserWindow({
    title: 'Notepad--',
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  win.webContents.openDevTools();
  createMenu(win);

  win.on('ready-to-show', () => {
    console.log('Window is ready to show');
    if (win) {
      restoreState(win).catch((err) => {
        console.error('Failed to restore state:', err);
      });
    }
  });

  win.on('close', (event) => {
    if (win) {
      event.preventDefault();

      const closeWindow = () => {
        win?.removeAllListeners('close');
        win?.close();
      }

      preserveState(win).then(() => {
        closeWindow();
      })
      .catch((err) => {
        console.error('Failed to preserve state:', err);
        closeWindow();
      });
    }
  });

}

function createMenu(win: BrowserWindow) {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CommandOrControl+N',
          click: () => { win.webContents.send(Messages.NEW_FILE); }
        },
        {
          label: 'Open...',
          accelerator: 'CommandOrControl+O',
          click: () => { openFile(win); }
        },
        {
          label: 'Save',
          accelerator: 'CommandOrControl+S',
          click: () => { saveFile(win); }
        },
        {
          label: 'Close Current Tab',
          accelerator: 'CommandOrControl+W',
          click: () => { win.webContents.send(Messages.CLOSE_CURRENT_TAB); }
        },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          click: () => { app.quit(); }
        }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)

const getAppState = (win: BrowserWindow, callback: (tabs: AppState) => void) => {
  ipcMain.once(Messages.GET_APP_STATE, (_event, appState: AppState) => {
    callback(appState);
  });
  win.webContents.send(Messages.GET_APP_STATE);
}

const getActiveTab = (win: BrowserWindow, callback: (tab: Tab | null) => void) => {
  ipcMain.once(Messages.GET_ACTIVE_TAB, (_event, tab: Tab | null) => {
    callback(tab);
  });
  win.webContents.send(Messages.GET_ACTIVE_TAB);
}

const preserveState = async (win: BrowserWindow) => {
  return new Promise<void>((resolve, reject) => {
    getAppState(win, (appState: AppState) => {
      const comrpessedState = require('lz-string').compressToUTF16(JSON.stringify(appState));
      fs.writeFile(APP_STATE_FILE_PATH, comrpessedState, 'utf-16le', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
  
}

const restoreState = async (win: BrowserWindow) => {
  return new Promise<void>((resolve, reject) => {
    if (fs.existsSync(APP_STATE_FILE_PATH)) {
      fs.readFile(APP_STATE_FILE_PATH, 'utf-16le', (err, data) => {
        if (!err) {
          const appStateStr = require('lz-string').decompressFromUTF16(data);
          try {
            const appState: AppState = JSON.parse(appStateStr);
            win.webContents.send(Messages.APP_STATE_UPDATED, appState);
            resolve();
          } catch (error) {
            reject(error);
          }
        }
        else {
          reject(err);
        }
      });
    } else {
      reject(new Error('No saved tabs found.'));
    }
  });
}

const openFile = (win: BrowserWindow) => {
  const openDialog = async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openFile'] });
    if (canceled || filePaths.length === 0) return null;
    const content = fs.readFileSync(filePaths[0], 'utf-8');
    return { path: filePaths[0], content };
  };
  openDialog().then(result => {
    win.webContents.send(Messages.OPEN_FILE, result?.path, result?.content);
  });
}

const saveFile = (win: BrowserWindow) => {
  const saveDialog = async () => {
    const { canceled, filePath } = await dialog.showSaveDialog({});
    console.log(canceled, filePath);
    if (canceled || !filePath) return null;
    return filePath;
  };

  getActiveTab(win, async (tab: Tab | null) => {
    if (tab) {
      const filePath = tab.path ?? await saveDialog();
      if (filePath) {
        fs.writeFileSync(filePath, tab.content ?? '', 'utf-8');

        tab.name = path.basename(filePath) || 'New File';
        tab.dirty = false;
        tab.path = filePath;
        win.webContents.send(Messages.TAB_UPDATED, {
          ...tab,
        });
      }      
    } else {
      console.error('No active tab found');
    }
  });
}