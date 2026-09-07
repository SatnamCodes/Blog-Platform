/**
 * Verification-only helper: starts an in-memory MongoDB instance and prints
 * its connection URI, then keeps the process alive. This is NOT part of the
 * production app - it exists purely because this sandbox has no real
 * mongod/MongoDB Atlas reachable, so we use mongodb-memory-server to stand
 * up a real (embedded) MongoDB binary for local end-to-end verification.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongod = await MongoMemoryServer.create({ instance: { port: 27117 } });
// eslint-disable-next-line no-console
console.log('MONGO_URI=' + mongod.getUri());

process.on('SIGINT', async () => {
  await mongod.stop();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await mongod.stop();
  process.exit(0);
});
