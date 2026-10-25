import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { dataFile } from './config.js';
import type { Database } from './types.js';

const emptyDatabase = (): Database => ({
  users: [], apartments: [], reviews: [], nextIds: { user: 1, apartment: 1, review: 1 },
});

let database: Database;
let writeQueue = Promise.resolve();

export async function loadDatabase(): Promise<void> {
  try {
    database = JSON.parse(await readFile(dataFile, 'utf8')) as Database;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    database = emptyDatabase();
    await saveDatabase();
  }
}

export function db(): Database {
  if (!database) throw new Error('Database has not been loaded');
  return database;
}

export function saveDatabase(): Promise<void> {
  const snapshot = JSON.stringify(database, null, 2);
  writeQueue = writeQueue.then(async () => {
    await mkdir(path.dirname(dataFile), { recursive: true });
    const temporaryFile = `${dataFile}.tmp`;
    await writeFile(temporaryFile, snapshot, 'utf8');
    await rename(temporaryFile, dataFile);
  });
  return writeQueue;
}
