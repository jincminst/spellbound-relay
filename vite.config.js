import { defineConfig } from 'vite';
import os from 'node:os';

function lanAddress() {
  const interfaces = os.networkInterfaces();
  const candidates = Object.entries(interfaces).flatMap(([name, entries]) =>
    (entries || [])
      .filter(entry => entry.family === 'IPv4' && !entry.internal && !entry.address.startsWith('169.254.'))
      .map(entry => ({ name, address: entry.address })),
  );
  return candidates.sort((a, b) => Number(b.name === 'en0') - Number(a.name === 'en0'))[0]?.address || '';
}

export default defineConfig({
  plugins: [{
    name: 'spellbound-network-address',
    configureServer(server) {
      server.middlewares.use('/__spellbound/network', (_request, response) => {
        response.setHeader('Content-Type', 'application/json');
        response.setHeader('Cache-Control', 'no-store');
        response.end(JSON.stringify({ host: lanAddress() }));
      });
    },
  }],
  server: {
    // Preserve active matches while source and capture files are being updated.
    hmr: false,
    // Route multiplayer through the same public port as the game. Other computers
    // no longer need direct access to a second port through the macOS firewall.
    proxy: {
      '/rift-socket': {
        target: 'ws://127.0.0.1:8080',
        ws: true,
        changeOrigin: true,
      },
    },
    watch: {
      ignored: ['**/artifacts/**', '**/dist/**'],
    },
  },
});
