const playSound = require('play-sound');
const { Atem } = require('atem-connection');

process.on('SIGINT', cleanUp);
let audios = [];
const player = playSound(opts = {});
const myAtem = new Atem();
const inputs = [
  'main', 'wide', 'left', 'right', 'guitar',
  'drums', 'piano', 'video', 'tripod', 'flycam',
  'handheld', 'confidence', 'floor', 'audience', '',
  'lower thirds fill', '', '', 'desktop', 'hyperdeck',
];


const superSourceName = 'SS1';
const atemIP = '10.1.34.34';
// const superSourceName = 'MP2';
// const atemIP = '127.0.0.1';

(async () => {

  myAtem.on('stateChanged', async (state, pathToChange) => {
    // TODO: Tighten up timings.
    // TODO: Daemon.
    // TODO: Tapping preview multiple times ideally would trigger the name to be said again.
    console.log('stateChanged', pathToChange.sort());
    const previewName = inputs[state.video.mixEffects[0].previewInput - 1];
    const programName = inputs[state.video.mixEffects[0].programInput - 1];
    if (pathToChange.includes('video.mixEffects.0.transitionPosition')) {
      if (pathToChange.includes('video.mixEffects.0.programInput')) {
        return play(`faded ${programName}`);
      }
      if (pathToChange.includes('video.mixEffects.0.previewInput')) {
        return play(`fading ${previewName}`);
      }
      return;
    }
    if (pathToChange.includes('video.mixEffects.0.programInput')) {
      return play(`cut ${programName}`);
    }
    if (pathToChange.includes('video.mixEffects.0.previewInput')) {
      return play(previewName);
    }
    if (pathToChange.includes('video.mixEffects.0.upstreamKeyers.0.onAir')) {
      const onAir = state.video.mixEffects[0].upstreamKeyers[0].onAir;
      return play(`lower thirds ${onAir ? 'on' : 'off'}`);
    }
  });
  myAtem.on('receivedCommand', (command) => {
    console.log('receivedCommand', command);
  });

  myAtem.on('connected', async () => {
    await sleep(2000);

    const superSource = Object.values(myAtem.state.inputs).find(input => input.shortName === superSourceName);
    if (superSource) {
      inputs[superSource.inputId - 1] = 'supersource';
      console.log(`SuperSource found at ${superSource.inputId}`);
    }
    else {
      console.log(`SuperSource not found with shortName ${superSourceName}!`);
    }

    // await sleep(2000);
    // await myAtem.changePreviewInput(15);
    // await sleep(2000);
    // await myAtem.autoTransition();
    // await sleep(6000);
    // await myAtem.changePreviewInput(1);
    // await sleep(2000);
    // await myAtem.cut();
    // await sleep(2000);
    // await myAtem.changeProgramInput(15);
    // await sleep(2000);
    // for (let i = 1; i <= 20; i++) {
    //   await myAtem.changePreviewInput(i);
    //   await sleep(2000);
    //   await myAtem.cut();
    //   await sleep(2000);
    // }
  });

  await myAtem.connect(atemIP);
})();

function sleep(ms = 1000) {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
}

function play(name) {
  console.log(`Playing ${name}`);
  audios?.forEach(audio => audio.kill());
  audios = [];
  audios.push(player.play(`audio/${name}.m4a`, { mplayer: ['-ss', '0.15'] }));
}

async function cleanUp() {
  console.log('');
  console.log('Exiting...');
  audios?.forEach(audio => audio.kill());
  myAtem.disconnect().then();
  console.log('Done!');
  console.log('');
  process.exit();
}
