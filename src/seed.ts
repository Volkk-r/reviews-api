import { loadDatabase } from './store.js';
import { seedDatabase } from './seed-data.js';

await loadDatabase();
await seedDatabase();
