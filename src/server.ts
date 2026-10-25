import { app } from './app.js';
import { port } from './config.js';
import { loadDatabase, db } from './store.js';
import { seedDatabase } from './seed-data.js';

await loadDatabase();
if (db().users.length === 0 && db().apartments.length === 0 && db().reviews.length === 0) {
  await seedDatabase();
}
app.listen(port, () => console.log(`Reviews API запущен: http://localhost:${port}`));
