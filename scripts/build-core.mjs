// Builds the adertha core jar and a trimmed Java runtime into build/core.
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import path from 'node:path'

const coreRepo = path.resolve(process.env.ADERTHA_CORE_DIR ?? '../adertha')
const out = path.resolve('build/core')
const isWin = process.platform === 'win32'
const jlink = process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', 'jlink') : 'jlink'
const modules = [
  'java.base', 'java.desktop', 'java.instrument', 'java.logging', 'java.management', 'java.naming',
  'java.net.http', 'java.security.jgss', 'java.sql', 'java.xml', 'jdk.crypto.ec', 'jdk.unsupported',
]
const run = (cmd, args, opts) => execFileSync(cmd, args, { stdio: 'inherit', ...opts })

if (isWin) run(`"${path.join(coreRepo, 'mvnw.cmd')}"`,['-q', '-B', '-DskipTests', 'package'], { cwd: coreRepo, shell: true })
else run('sh', ['mvnw', '-q', '-B', '-DskipTests', 'package'], { cwd: coreRepo })

const target = path.join(coreRepo, 'target')
const jar = readdirSync(target).find((f) => f.endsWith('.jar') && !f.endsWith('-plain.jar'))

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
cpSync(path.join(target, jar), path.join(out, 'adertha.jar'))
run(jlink, ['--add-modules', modules.join(','), '--strip-debug', '--no-header-files', '--no-man-pages', '--output', path.join(out, 'runtime')])

console.log(`Core ready in ${out}`)
