import { app as T, BrowserWindow as u, ipcMain as m, dialog as f, Menu as S } from "electron";
import { createRequire as h } from "node:module";
import { fileURLToPath as b } from "node:url";
import r from "node:path";
import i from "node:fs";
var c = /* @__PURE__ */ ((e) => (e.NEW_FILE = "new-file", e.OPEN_FILE = "open-file", e.SAVE_FILE = "save-file", e.CLOSE_CURRENT_TAB = "close-current-tab", e.GET_ACTIVE_TAB = "get-active-tab", e.GET_APP_STATE = "get-app-state", e.TAB_UPDATED = "tab-updated", e.APP_STATE_UPDATED = "app-state-updated", e.ASK_SAVE_TAB = "ask-save-tab", e))(c || {});
const P = h(import.meta.url), _ = r.dirname(b(import.meta.url));
process.env.APP_ROOT = r.join(_, "..");
const A = process.env.VITE_DEV_SERVER_URL, j = r.join(process.env.APP_ROOT, "dist-electron"), v = r.join(process.env.APP_ROOT, "dist"), E = r.join(r.dirname(T.getPath("userData")), "Notepad--"), d = r.join(E, "appState");
console.log("APP_STATE_FILE_PATH:", d);
process.env.VITE_PUBLIC = A ? r.join(process.env.APP_ROOT, "public") : v;
let n;
function C() {
  console.log(r.join(_, "preload.mjs")), n = new u({
    title: "Notepad--",
    icon: r.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: r.join(_, "preload.mjs"),
      contextIsolation: !0,
      nodeIntegration: !1
    }
  }), n.webContents.on("did-finish-load", () => {
    n == null || n.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), A ? n.loadURL(A) : n.loadFile(r.join(v, "index.html")), F(n), n.on("ready-to-show", () => {
    console.log("Window is ready to show"), n && y(n).catch((e) => {
      console.error("Failed to restore state:", e);
    });
  }), n.on("close", (e) => {
    if (n) {
      e.preventDefault();
      const t = () => {
        n == null || n.removeAllListeners("close"), n == null || n.close();
      };
      O(n).then(() => {
        t();
      }).catch((o) => {
        console.error("Failed to preserve state:", o), t();
      });
    }
  });
}
function F(e) {
  const t = [
    {
      label: "File",
      submenu: [
        {
          label: "New File",
          accelerator: "CommandOrControl+N",
          click: () => {
            e.webContents.send(c.NEW_FILE);
          }
        },
        {
          label: "Open...",
          accelerator: "CommandOrControl+O",
          click: () => {
            g(e);
          }
        },
        {
          label: "Save",
          accelerator: "CommandOrControl+S",
          click: () => {
            L(e);
          }
        },
        {
          label: "Close Current Tab",
          accelerator: "CommandOrControl+W",
          click: () => {
            e.webContents.send(c.CLOSE_CURRENT_TAB);
          }
        },
        {
          label: "Exit",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Alt+F4",
          click: () => {
            T.quit();
          }
        }
      ]
    },
    {
      label: "View",
      submenu: [
        {
          label: "Show DevTools",
          accelerator: "F12",
          click: () => {
            e && e.webContents.toggleDevTools();
          }
        }
      ]
    }
  ], o = S.buildFromTemplate(t);
  S.setApplicationMenu(o);
}
T.on("window-all-closed", () => {
  process.platform !== "darwin" && (T.quit(), n = null);
});
T.on("activate", () => {
  u.getAllWindows().length === 0 && C();
});
T.whenReady().then(C);
m.on(c.ASK_SAVE_TAB, async (e, t) => {
  let o;
  ((a) => {
    a[a.SAVE = 0] = "SAVE", a[a.DONT_SAVE = 1] = "DONT_SAVE", a[a.CANCEL = 2] = "CANCEL";
  })(o || (o = {}));
  const s = async () => (await f.showMessageBox({
    type: "info",
    noLink: !0,
    buttons: ["Save", "Don't Save", "Cancel"],
    title: "Unsaved Changes",
    message: `The tab "${t.name}" has unsaved changes. Do you want to save it?`
  })).response;
  if (n) {
    const a = await s();
    if (a === 0) {
      const l = await w(n, t);
      n.webContents.send(c.ASK_SAVE_TAB, !l);
    } else
      n.webContents.send(
        c.ASK_SAVE_TAB,
        a === 2
        /* CANCEL */
      );
  }
});
const D = (e, t) => {
  m.once(c.GET_APP_STATE, (o, s) => {
    t(s);
  }), e.webContents.send(c.GET_APP_STATE);
}, I = (e, t) => {
  m.once(c.GET_ACTIVE_TAB, (o, s) => {
    t(s);
  }), e.webContents.send(c.GET_ACTIVE_TAB);
}, O = async (e) => new Promise((t, o) => {
  i.existsSync(E) || i.mkdirSync(E, { recursive: !0 }), D(e, (s) => {
    const a = P("lz-string").compressToUTF16(JSON.stringify(s));
    i.writeFile(d, a, "utf-16le", (l) => {
      l ? o(l) : t();
    });
  });
}), y = async (e) => new Promise((t, o) => {
  i.existsSync(d) ? i.readFile(d, "utf-16le", (s, a) => {
    if (s)
      o(s);
    else {
      const l = P("lz-string").decompressFromUTF16(a);
      try {
        const p = JSON.parse(l);
        e.webContents.send(c.APP_STATE_UPDATED, p), t();
      } catch (p) {
        o(p);
      }
    }
  }) : o(new Error("No saved tabs found."));
}), g = (e) => {
  (async () => {
    const { canceled: o, filePaths: s } = await f.showOpenDialog({ properties: ["openFile"] });
    if (o || s.length === 0) return null;
    const a = i.readFileSync(s[0], "utf-8");
    return { path: s[0], content: a };
  })().then((o) => {
    e.webContents.send(c.OPEN_FILE, o == null ? void 0 : o.path, o == null ? void 0 : o.content);
  });
}, L = (e) => {
  I(e, async (t) => {
    t ? w(e, t) : console.error("No active tab found to save.");
  });
}, w = async (e, t) => {
  const o = async () => {
    const { canceled: a, filePath: l } = await f.showSaveDialog({});
    return console.log(a, l), a || !l ? null : l;
  }, s = t.path ?? await o();
  if (s)
    try {
      return i.writeFileSync(s, t.content ?? "", "utf-8"), t.name = r.basename(s) || "New File", t.dirty = !1, t.path = s, e.webContents.send(c.TAB_UPDATED, {
        ...t
      }), !0;
    } catch (a) {
      return console.error("Failed to save tab:", a), !1;
    }
  else
    return !1;
};
export {
  j as MAIN_DIST,
  v as RENDERER_DIST,
  A as VITE_DEV_SERVER_URL
};
