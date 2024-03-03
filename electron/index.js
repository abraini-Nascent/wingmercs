const { app, BrowserWindow } = require('electron')

function createWindow() {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true, // Start in full-screen mode
    fullscreenWindowTitle: true, // Show the window title when in full-screen mode
    autoHideMenuBar: true, // Hide the menu bar
    webPreferences: {
      nodeIntegration: true
    }
  })
  win.setTitle("Wing Mercs")
  // Open DevTools
  win.webContents.openDevTools()
  // Set the base working directory to the 'dist' folder
  win.loadFile('dist/index.html')
}

// Set the name of the Electron app
app.name = "Wing Mercs"
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