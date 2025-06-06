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

const APP_STATE_FILE_PATH_DIR = path.join(path.dirname(app.getPath('userData')), 'Notepad--')
const APP_STATE_FILE_PATH = path.join(APP_STATE_FILE_PATH_DIR, 'appState')
console.log('APP_STATE_FILE_PATH:', APP_STATE_FILE_PATH);

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
    backgroundColor: '#242424',
    show: false,
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  createMenu(win);

  win.on('ready-to-show', () => {
    if (win) {
      win.show();
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
          click: () => { saveActiveTab(win); }
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
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Show DevTools',
          accelerator: 'F12',
          click: () => {
            if (win) {
              win.webContents.toggleDevTools();
            }
          }
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

ipcMain.on(Messages.ASK_SAVE_TAB, async (_event, tab: Tab) => {
  enum DialogResponse {
    SAVE = 0,
    DONT_SAVE = 1,
    CANCEL = 2
  }

  const showConfirmDialog = async () => {
    const result = await dialog.showMessageBox({
      type: 'info',
      noLink: true,
      buttons: ['Save', 'Don\'t Save', 'Cancel'],
      title: 'Unsaved Changes',
      message: `The tab "${tab.name}" has unsaved changes. Do you want to save it?`
    })
    
    return result.response as DialogResponse; // 0 is the index of the "Save" button
  }

  if (win) {
    const dialogResponse = await showConfirmDialog();
    if (dialogResponse === DialogResponse.SAVE) {
      const saved = await saveTabToFile(win, tab);

      // Keep the tab open if failed to save (user closed save file dialog or FS error)
      win.webContents.send(Messages.ASK_SAVE_TAB, !saved);
    }
    else {
      // Keep the tab open if the user chose to cancel
      win.webContents.send(Messages.ASK_SAVE_TAB, dialogResponse === DialogResponse.CANCEL);
    }
  }
});

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
    // Create the directory if it doesn't exist
    if (!fs.existsSync(APP_STATE_FILE_PATH_DIR)) {
      fs.mkdirSync(APP_STATE_FILE_PATH_DIR, { recursive: true });
    }

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

const saveActiveTab = (win: BrowserWindow) => {
  getActiveTab(win, async (tab: Tab | null) => {
    if (tab) {
      saveTabToFile(win, tab);
    }
    else {
      console.error('No active tab found to save.');
    }
  });
}

const saveTabToFile = async (win: BrowserWindow, tab: Tab) => {
  const saveDialog = async () => {
    const { canceled, filePath } = await dialog.showSaveDialog({});
    console.log(canceled, filePath);
    if (canceled || !filePath) return null;
    return filePath;
  };
  const filePath = tab.path ?? await saveDialog();
  if (filePath) {
    try {
      fs.writeFileSync(filePath, tab.content ?? '', 'utf-8');
      
      tab.name = path.basename(filePath) || 'New File';
      tab.dirty = false;
      tab.path = filePath;
      win.webContents.send(Messages.TAB_UPDATED, {
        ...tab,
      });
      return true;
    } catch (error) {
      console.error('Failed to save tab:', error);
      return false;
    }
  }
  else {
    return false;
  }
}