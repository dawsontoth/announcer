import { connect, disconnect } from 'src/atem';
import { stopAll } from 'src/audio';

process.on('SIGINT', cleanUp);
process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
  cleanUp().then(() => process.exit(1));
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  cleanUp().then(() => process.exit(1));
});

(async () => {
  try {
    await connect();
    console.log('Connected to ATEM successfully');
  } catch (error) {
    console.error('Failed to connect to ATEM:', error);
    await cleanUp();
    process.exit(1);
  }
})();

async function cleanUp(): Promise<void> {
  console.log('\nExiting...');

  try {
    stopAll();
    disconnect();
    console.log('Done!\n');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}
