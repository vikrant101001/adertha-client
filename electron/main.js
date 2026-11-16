import { app, BrowserWindow, net, protocol } from 'electron'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const uiDir = path.join(here, '..', 'dist')
const coreDir = app.isPackaged ? path.join(process.resourcesPath, 'core') : path.join(here, '..', 'build', 'core')
const uiUrl = process.argv.includes('--dev') ? 'http://localhost:5173/' : 'app://adertha/'

let core, win

// Serve the built UI from app://adertha so the core can allow exactly that origin.
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }])

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer().on('error', reject)
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })
}

function startCore(port) {
  const java = path.join(coreDir, 'runtime', 'bin', process.platform === 'win32' ? 'java.exe' : 'java')
  core = spawn(java, ['-jar', path.join(coreDir, 'adertha.jar'), `--server.port=${port}`], { stdio: 'inherit', windowsHide: true })
}

if (!app.requestSingleInstanceLock()) app.quit()
app.on('second-instance', () => win?.focus())

app.whenReady().then(async () => {
  protocol.handle('app', (req) => {
    const file = path.join(uiDir, decodeURIComponent(new URL(req.url).pathname))
    if (path.relative(uiDir, file).startsWith('..')) return new Response('Not found', { status: 404 })
    return net.fetch(pathToFileURL(file.endsWith(path.sep) ? path.join(file, 'index.html') : file).toString())
  })

  const port = await freePort()
  startCore(port)

  win = new BrowserWindow({ width: 1000, height: 700, backgroundColor: '#15171d', autoHideMenuBar: true })
  win.loadURL(`${uiUrl}?core=${port}`)
})

app.on('window-all-closed', () => app.quit())
app.on('will-quit', () => core?.kill())
