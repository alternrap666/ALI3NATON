/**
 * ALI3NATION Desktop App Connection Wrapper
 * Native Electron Process Manager
 */

const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow = null;
let serverInstance = null;

// Force production environment
process.env.NODE_ENV = 'production';

// Resolve clean environment port
const PORT = process.env.PORT || 3000;

// Auto-launch Express Server process inside Electron Node Context
async function startExpressNative() {
  try {
    const serverPath = path.join(__dirname, "dist", "server.cjs");
    if (fs.existsSync(serverPath)) {
      console.log(`[ALI3NATION-CORE] Found built production backend at: ${serverPath}`);
      console.log(`[ALI3NATION-CORE] Booting Express server locally on port ${PORT}...`);
      serverInstance = require(serverPath);
      
      if (typeof serverInstance.startServer === 'function') {
        const resolvedPort = await serverInstance.startServer(PORT);
        console.log(`[ALI3NATION-CORE] Express started on confirmed port: ${resolvedPort}`);
        return resolvedPort;
      }
      return PORT; // fallback
    } else {
      console.log("[ALI3NATION-CORE] Production server bundle not found. Trying to fallback to development runtime...");
      return PORT;
    }
  } catch (err) {
    console.error("[ALI3NATION-CORE] FAILED to start local Express integration server:", err.message);
    return PORT;
  }
}

async function createWindow() {
  const actualPort = await startExpressNative();

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
  const loadAddress = `http://localhost:${actualPort}`;
  console.log(`[ALI3NATION-DESKTOP] Launching view pointing towards: ${loadAddress}`);
  
  const loadWithRetry = () => {
    mainWindow.loadURL(loadAddress).catch(err => {
      console.log(`[ALI3NATION-CORE] Failed to load ${loadAddress}: ${err.message}. Retrying in 500ms...`);
      
      // If we failed after 5+ tries or so, we could show an error, but let's just keep trying
      // and maybe inject a loading message into the empty web contents
      mainWindow.webContents.executeJavaScript(`document.body.innerHTML = "<div style='color:#fff;font-family:sans-serif;padding:20px'>Server loading: ${err.message}... Please wait...</div>";`);
      
      setTimeout(() => {
        if (mainWindow) loadWithRetry();
      }, 500);
    });
  };
  
  loadWithRetry();
  
  // Open devtools so we can see the console
  mainWindow.webContents.openDevTools();

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
