import * as Comlink from 'comlink';
import type { DbWorkerApi } from './worker';

const worker = new Worker(new URL('./worker.ts', import.meta.url), {
  type: 'module',
});

// Create Comlink proxy
export const dbClient = Comlink.wrap<DbWorkerApi>(worker);

export async function initDatabase() {
  await dbClient.initDb();
}
