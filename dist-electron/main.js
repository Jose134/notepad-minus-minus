import { app as c, BrowserWindow as f, Menu as m, ipcMain as A, dialog as P } from "electron";
import { createRequire as u } from "node:module";
import { fileURLToPath as v } from "node:url";
import a from "node:path";
import i from "node:fs";
var s = /* @__PURE__ */ ((e) => (e.NEW_FILE = "new-file", e.OPEN_FILE = "open-file", e.SAVE_FILE = "save-file", e.CLOSE_CURRENT_TAB = "close-current-tab", e.GET_ACTIVE_TAB = "get-active-tab", e.GET_APP_STATE = "get-app-state", e.TAB_UPDATED = "tab-updated", e.APP_STATE_UPDATED = "app-state-updated", e))(s || {});
const w = u(import.meta.url), T = a.dirname(v(import.meta.url));
process.env.APP_ROOT = a.join(T, "..");
const E = process.env.VITE_DEV_SERVER_URL, V = a.join(process.env.APP_ROOT, "dist-electron"), C = a.join(process.env.APP_ROOT, "dist"), _ = a.join(process.env.APP_ROOT, "appState");
process.env.VITE_PUBLIC = E ? a.join(process.env.APP_ROOT, "public") : C;
let t;
function S() {
  console.log(a.join(T, "preload.mjs")), t = new f({
    title: "Notepad--",
    icon: a.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: a.join(T, "preload.mjs"),
      contextIsolation: !0,
      nodeIntegration: !1
    }
  }), t.webContents.on("did-finish-load", () => {
    t == null || t.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), E ? t.loadURL(E) : t.loadFile(a.join(C, "index.html")), t.webContents.openDevTools(), h(t), t.on("ready-to-show", () => {
    console.log("Window is ready to show"), t && R(t).catch((e) => {
      console.error("Failed to restore state:", e);
    });
  }), t.on("close", (e) => {
    if (t) {
      e.preventDefault();
      const r = () => {
        t == null || t.removeAllListeners("close"), t == null || t.close();
      };
      b(t).then(() => {
        r();
      }).catch((o) => {
        console.error("Failed to preserve state:", o), r();
      });
    }
  });
}
function h(e) {
  const r = [
    {
      label: "File",
      submenu: [
        {
          label: "New File",
          accelerator: "CommandOrControl+N",
          click: () => {
            e.webContents.send(s.NEW_FILE);
          }
        },
        {
          label: "Open...",
          accelerator: "CommandOrControl+O",
          click: () => {
            D(e);
          }
        },
        {
          label: "Save",
          accelerator: "CommandOrControl+S",
          click: () => {
            I(e);
          }
        },
        {
          label: "Close Current Tab",
          accelerator: "CommandOrControl+W",
          click: () => {
            e.webContents.send(s.CLOSE_CURRENT_TAB);
          }
        },
        {
          label: "Exit",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Alt+F4",
          click: () => {
            c.quit();
          }
        }
      ]
    }
  ], o = m.buildFromTemplate(r);
  m.setApplicationMenu(o);
}
c.on("window-all-closed", () => {
  process.platform !== "darwin" && (c.quit(), t = null);
});
c.on("activate", () => {
  f.getAllWindows().length === 0 && S();
});
c.whenReady().then(S);
const F = (e, r) => {
  A.once(s.GET_APP_STATE, (o, n) => {
    r(n);
  }), e.webContents.send(s.GET_APP_STATE);
}, O = (e, r) => {
  A.once(s.GET_ACTIVE_TAB, (o, n) => {
    r(n);
  }), e.webContents.send(s.GET_ACTIVE_TAB);
}, b = async (e) => new Promise((r, o) => {
  F(e, (n) => {
    const l = w("lz-string").compressToUTF16(JSON.stringify(n));
    i.writeFile(_, l, "utf-16le", (p) => {
      p ? o(p) : r();
    });
  });
}), R = async (e) => new Promise((r, o) => {
  i.existsSync(_) ? i.readFile(_, "utf-16le", (n, l) => {
    if (n)
      o(n);
    else {
      const p = w("lz-string").decompressFromUTF16(l);
      try {
        const d = JSON.parse(p);
        e.webContents.send(s.APP_STATE_UPDATED, d), r();
      } catch (d) {
        o(d);
      }
    }
  }) : o(new Error("No saved tabs found."));
}), D = (e) => {
  (async () => {
    const { canceled: o, filePaths: n } = await P.showOpenDialog({ properties: ["openFile"] });
    if (o || n.length === 0) return null;
    const l = i.readFileSync(n[0], "utf-8");
    return { path: n[0], content: l };
  })().then((o) => {
    e.webContents.send(s.OPEN_FILE, o == null ? void 0 : o.path, o == null ? void 0 : o.content);
  });
}, I = (e) => {
  const r = async () => {
    const { canceled: o, filePath: n } = await P.showSaveDialog({});
    return console.log(o, n), o || !n ? null : n;
  };
  O(e, async (o) => {
    if (o) {
      const n = o.path ?? await r();
      n && (i.writeFileSync(n, o.content ?? "", "utf-8"), o.name = a.basename(n) || "New File", o.dirty = !1, o.path = n, e.webContents.send(s.TAB_UPDATED, {
        ...o
      }));
    } else
      console.error("No active tab found");
  });
};
export {
  _ as APP_STATE_FILE_PATH,
  V as MAIN_DIST,
  C as RENDERER_DIST,
  E as VITE_DEV_SERVER_URL
};
