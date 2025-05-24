import { Atem } from 'atem-connection';
import type { InputChannel } from 'atem-connection/dist/state/input';
import { play } from 'src/audio';
import { env } from 'src/env';
import { convertTextToSpeech } from 'src/openai';
import { formatString } from 'src/utils/format-string';
import { sleep } from 'src/utils/sleep';

const myAtem = new Atem();

export async function connect(): Promise<void> {
  // Precompute speeches.
  for (const input of env.inputNames) {
    await convertTextToSpeech(formatString(env.fadedFormat, input));
    await convertTextToSpeech(formatString(env.fadingFormat, input));
    await convertTextToSpeech(formatString(env.cutFormat, input));
    await convertTextToSpeech(formatString(env.previewFormat, input));
  }
  for (const keyerName of env.keyerNames) {
    await convertTextToSpeech(formatString(env.keyerOnFormat, keyerName));
    await convertTextToSpeech(formatString(env.keyerOffFormat, keyerName));
  }

  myAtem.on('connected', connected);
  myAtem.on('stateChanged', stateChanged);
  await myAtem.connect(env.atemIP);
}

async function connected() {
  await sleep(2000);

  const superSources = Object.values(myAtem.state?.inputs || {}).filter((input): input is InputChannel => !!input?.shortName?.startsWith('SS'));
  for (const superSource of superSources) {
    const superSourceNumber = parseInt(superSource.shortName.replace(/ss/ig, ''), 10);
    env.inputNames[superSource.inputId - 1] = env.superSourceNames[superSourceNumber - 1];
  }
}

async function stateChanged(state: any, pathToChange: string[]) {
  // TODO: Tapping preview multiple times ideally would trigger the name to be said again.
  console.log('stateChanged', pathToChange.sort());
  const previewName = env.inputNames[state.video.mixEffects[0].previewInput - 1];
  const programName = env.inputNames[state.video.mixEffects[0].programInput - 1];
  if (pathToChange.includes('video.mixEffects.0.transitionPosition')) {
    if (pathToChange.includes('video.mixEffects.0.programInput')) {
      return play(formatString(env.fadedFormat, programName));
    }
    if (pathToChange.includes('video.mixEffects.0.previewInput')) {
      return play(formatString(env.fadingFormat, previewName));
    }
    return;
  }
  // TODO: Support multiple m/es.
  if (pathToChange.includes('video.mixEffects.0.programInput')) {
    return play(formatString(env.cutFormat, programName));
  }
  if (pathToChange.includes('video.mixEffects.0.previewInput')) {
    return play(formatString(env.previewFormat, previewName));
  }
  // TODO: Support multiple keyers.
  if (pathToChange.includes('video.mixEffects.0.upstreamKeyers.0.onAir')) {
    const onAir = state.video.mixEffects[0].upstreamKeyers[0].onAir;
    return play(formatString(onAir ? env.keyerOnFormat : env.keyerOffFormat, env.keyerNames[0]));
  }
}

export function disconnect(): void {
  myAtem.disconnect().then();
}
