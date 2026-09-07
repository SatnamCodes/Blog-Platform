import { createApp } from './app.js';
import { connectDb } from './db.js';
import { env } from './config/env.js';

async function main() {
  await connectDb();
  const app = createApp();
  app.listen(env.port, () => {
    // Startup log is expected operational output, not debug console.log noise.
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${env.port} (${env.nodeEnv})`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
