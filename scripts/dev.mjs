// Managed preview supplies Vite-compatible development flags.
import { parseArgs } from 'node:util';
const {values} = parseArgs({options: {
  host: {type:'string'}, port: {type:'string'}, strictPort: {type:'boolean'}
}});
if (values.port) {
  const port = Number(values.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error('Invalid development port');
  process.env.PORT = String(port);
}
if (values.host) process.env.HOST = values.host;
await import('../server.mjs');
