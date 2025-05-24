import { connect, disconnect } from 'src/atem';
import { stopAll } from 'src/audio';

process.on('SIGINT', cleanUp);

(async () => {
  await connect();
})();

async function cleanUp(): Promise<void> {
  console.log('\nExiting...');

  stopAll();
  disconnect();
  console.log('Done!\n');
  process.exit();
}
