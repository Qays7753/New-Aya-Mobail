import { dbClient } from '../client';
// @ts-ignore
import initSql from './001_init.sql?raw';

const migrations = [
  { version: 1, sql: initSql },
  // Future migrations can be added here
];

export async function runMigrations() {
  const currentVersion = await dbClient.getVersion();
  console.log(`Current DB version: ${currentVersion}`);

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      console.log(`Running migration ${migration.version}...`);
      try {
        // Execute migration as a single script
        // Note: SQLite exec() supports multiple statements separated by ';'
        await dbClient.run(migration.sql);
        await dbClient.setVersion(migration.version);
        console.log(`Migration ${migration.version} applied successfully.`);
      } catch (err) {
        console.error(`Migration ${migration.version} failed:`, err);
        throw err; // Stop application on migration failure
      }
    }
  }
}
