import { spawn } from 'node:child_process';

const children = [
  spawn(process.execPath, ['server.js'], { stdio: 'inherit' }),
  spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'vite'], { stdio: 'inherit' }),
];

for (const child of children) child.on('exit', code => code && process.exit(code));
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    children.forEach(child => child.kill(signal));
    process.exit(0);
  });
}
