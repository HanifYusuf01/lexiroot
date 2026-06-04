import 'reflect-metadata';
import dataSource from './data-source';

async function runMigrations() {
  console.log('Running migrations...');
  await dataSource.initialize();
  const migrations = await dataSource.runMigrations();
  console.log(`Ran ${migrations.length} migration(s):`, migrations.map(m => m.name));
  await dataSource.destroy();
  console.log('Migrations complete.');
}

runMigrations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});