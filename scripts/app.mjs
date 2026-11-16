// Dev only: runs the core from source + the UI dev server, then opens the UI
// in a browser app window (Edge on Windows, Chrome elsewhere). Ctrl+C stops all.
import { spawn, spawnSync } from 'node:child_process'
import path from 'node:path'

const coreRepo = path.resolve(process.env.ADERTHA_CORE_DIR ?? '../adertha')
const uiUrl = 'http://localhost:5173/'
const isWin = process.platform === 'win32'
const children = []

function start(cmd, args, opts) {
  // detached on macOS/Linux so the whole process group can be stopped together
  const child = spawn(cmd, args, { stdio: ['ignore', 'inherit', 'inherit'], detached: !isWin, ...opts })
  children.push(child)
}

function stopAll() {
  for (const { pid } of children) {
    if (isWin) spawnSync('taskkill', ['/pid', pid, '/T', '/F'], { stdio: 'ignore' })
    else try { process.kill(-pid) } catch {}
  }
  process.exit()
}

async function waitFor(url) {
  for (let i = 0; i < 360; i++) {
    try { await fetch(url); return } catch { await new Promise((r) => setTimeout(r, 500)) }
  }
  throw new Error(`Timed out waiting for ${url}`)
}

function openAppWindow() {
  const arg = `--app=${uiUrl}`
  const [cmd, args] =
    isWin ? ['cmd', ['/c', 'start', '', 'msedge', arg]]
    : process.platform === 'darwin' ? ['open', ['-na', 'Google Chrome', '--args', arg]]
    : ['google-chrome', [arg]]
  spawn(cmd, args, { stdio: 'ignore', detached: true })
    .on('error', () => console.log(`Open ${uiUrl} in your browser.`))
    .unref()
}

process.on('SIGINT', stopAll)
process.on('SIGTERM', stopAll)

if (isWin) start(`"${path.join(coreRepo, 'mvnw.cmd')}"`, ['spring-boot:run'], { cwd: coreRepo, shell: true })
else start('sh', ['mvnw', 'spring-boot:run'], { cwd: coreRepo })
start(process.execPath, [path.resolve('node_modules/vite/bin/vite.js')])

await Promise.all([waitFor('http://127.0.0.1:8080/api/status'), waitFor(uiUrl)])
openAppWindow()
console.log('\nAdertha is running. Press Ctrl+C to stop.\n')
