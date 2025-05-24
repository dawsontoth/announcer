import { Atem } from 'atem-connection';
import type { InputChannel } from 'atem-connection/dist/state/input';
import { play } from 'src/audio';
import { convertTextToSpeech } from 'src/openai';
import { envToCSV } from 'src/utils/env-to-csv';
import { formatString } from 'src/utils/format-string';
import { sleep } from 'src/utils/sleep';

const myAtem = new Atem();
const inputs: string[] = envToCSV(process.env.INPUT_NAMES!);
const superSourceNames = envToCSV(process.env.SUPER_SOURCE_NAMES!);
const keyerNames = envToCSV(process.env.KEYER_NAMES!);
const atemIP = process.env.ATEM_IP!;

export async function connect(): Promise<void> {
  // Precompute speeches.
  await convertTextToSpeech("flycam");
  await convertTextToSpeech("wide");
  // for (const input of inputs) {
  //   await convertTextToSpeech(formatString(process.env.FADED_FORMAT!, input));
  //   await convertTextToSpeech(formatString(process.env.FADING_FORMAT!, input));
  //   await convertTextToSpeech(formatString(process.env.CUT_FORMAT!, input));
  //   await convertTextToSpeech(formatString(process.env.PREVIEW_FORMAT!, input));
  // }
  // for (const keyerName of keyerNames) {
  //   await convertTextToSpeech(formatString(process.env.KEYER_ON_FORMAT!, keyerName));
  //   await convertTextToSpeech(formatString(process.env.KEYER_OFF_FORMAT!, keyerName));
  // }

  myAtem.on('connected', connected);
  myAtem.on('stateChanged', stateChanged);
  await myAtem.connect(atemIP);
}

async function connected() {
  await sleep(2000);

  const superSources = Object.values(myAtem.state?.inputs || {}).filter((input): input is InputChannel => !!input?.shortName?.startsWith('SS'));
  for (const superSource of superSources) {
    const superSourceNumber = parseInt(superSource.shortName.replace(/ss/ig, ''), 10);
    inputs[superSource.inputId - 1] = superSourceNames[superSourceNumber - 1];
  }
}

async function stateChanged(state: any, pathToChange: string[]) {
  // TODO: Tapping preview multiple times ideally would trigger the name to be said again.
  console.log('stateChanged', pathToChange.sort());
  const previewName = inputs[state.video.mixEffects[0].previewInput - 1];
  const programName = inputs[state.video.mixEffects[0].programInput - 1];
  if (pathToChange.includes('video.mixEffects.0.transitionPosition')) {
    if (pathToChange.includes('video.mixEffects.0.programInput')) {
      return play(formatString(process.env.FADED_FORMAT!, programName));
    }
    if (pathToChange.includes('video.mixEffects.0.previewInput')) {
      return play(formatString(process.env.FADING_FORMAT!, previewName));
    }
    return;
  }
  // TODO: Support multiple m/es.
  if (pathToChange.includes('video.mixEffects.0.programInput')) {
    return play(formatString(process.env.CUT_FORMAT!, programName));
  }
  if (pathToChange.includes('video.mixEffects.0.previewInput')) {
    return play(formatString(process.env.PREVIEW_FORMAT!, previewName));
  }
  // TODO: Support multiple keyers.
  if (pathToChange.includes('video.mixEffects.0.upstreamKeyers.0.onAir')) {
    const onAir = state.video.mixEffects[0].upstreamKeyers[0].onAir;
    return play(formatString(onAir ? process.env.KEYER_ON_FORMAT! : process.env.KEYER_OFF_FORMAT!, keyerNames[0]));
  }
}

export function disconnect(): void {
  myAtem.disconnect().then();
}
