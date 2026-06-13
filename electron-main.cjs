/**
 * ALI3NATION Desktop App Connection Wrapper
 * Native Electron Process Manager
 */

const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow = null;
let serverInstance = null;

// Resolve clean environment port
const PORT = process.env.PORT || 3000;

// Auto-launch Express Server process inside Electron Node Context
function startExpressNative() {
  try {
    const serverPath = path.join(__dirname, "dist", "server.cjs");
    if (fs.existsSync(serverPath)) {
      console.log(`[ALI3NATION-CORE] Found built production backend at: ${serverPath}`);
      console.log(`[ALI3NATION-CORE] Booting Express server locally on port ${PORT}...`);
      serverInstance = require(serverPath);
    } else {
      console.log("[ALI3NATION-CORE] Production server bundle not found. Trying to fallback to development runtime...");
      // In local dev, we run of standard development
      const devServerPath = path.join(__dirname, "server.ts");
      if (fs.existsSync(devServerPath)) {
        console.log(`[ALI3NATION-CORE] Dev server template ready. Assuming standard host port: ${PORT}`);
      }
    }
  } catch (err) {
    console.error("[ALI3NATION-CORE] FAILED to start local Express integration server:", err.message);
  }
}

function createWindow() {
  startExpressNative();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 880,
    minWidth: 1024,
    minHeight: 768,
    title: "ALI3NATION - VLESS Reality Bypass Core",
    icon: path.join(__dirname, "icon.png"),
    autoHideMenuBar: true, // Clean screen layout without standard Chrome menu rails
    backgroundColor: "#0c0c0e", // Smooth transition matching our dark theme
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  // Load local hosted application server
  const loadAddress = `http://localhost:${PORT}`;
  console.log(`[ALI3NATION-DESKTOP] Launching view pointing towards: ${loadAddress}`);
  mainWindow.loadURL(loadAddress);

  // Prevent internal redirects from leaving electron frame; open hyperlinks in user's default browser!
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", () => {
  createWindow();
});

app.on("window-all-closed", () => {
  // Gracefully terminate everything including running Express server threads
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
