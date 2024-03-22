const { app, BrowserWindow, ipcMain } = require('electron')

function createWindow() {
  const win = new BrowserWindow({
    icon: '/images/icon.png',
    width: 1920,
    height: 1080,
    fullscreen: true, // Start in full-screen mode
    fullscreenWindowTitle: true, // Show the window title when in full-screen mode
    autoHideMenuBar: true, // Hide the menu bar
    webPreferences: {
      nodeIntegration: false, // Disable Node.js integration
      preload: '/preload.js' // Load the preload script
    }
  })
  win.setTitle("Squadron: Mercenaries")
  // Open DevTools
  win.webContents.openDevTools()
  // Set the base working directory to the 'dist' folder
  win.loadFile('dist/index.html')
}

ipcMain.on('close-window', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        win.close();
    }
});

// Set the name of the Electron app
app.name = "Squadron: Mercenaries"
app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})