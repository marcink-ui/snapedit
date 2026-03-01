import 'dotenv/config';
import { getMigrations } from 'better-auth/db/migration';
import { auth } from './auth.js';

const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(auth.options);

console.log('Tables to create:', toBeCreated);
console.log('Columns to add:', toBeAdded);

await runMigrations();
console.log('✅ Migrations complete!');
process.exit(0);
