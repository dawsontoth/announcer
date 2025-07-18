import { Atem, AtemState } from 'atem-connection';
import type { InputChannel } from 'atem-connection/dist/state/input';
import { play } from './audio.ts';
import { env } from './env.ts';
import { convertTextToSpeech } from './openai.ts';
import { formatString } from './utils/format-string.ts';
import { sleep } from './utils/sleep.ts';

const myAtem = new Atem();
const superSourceIdToName: Record<number, string> = {};

export async function connect(): Promise<void> {
  try {
    // Precompute speeches.
    console.log('Precomputing speeches...');
    for (const input of env.inputNames) {
      try {
        await convertTextToSpeech(formatString(env.fadedFormat, input));
        await convertTextToSpeech(formatString(env.fadingFormat, input));
        await convertTextToSpeech(formatString(env.cutFormat, input));
        await convertTextToSpeech(formatString(env.previewFormat, input));
      } catch (error) {
        console.error(`Failed to precompute speech for input "${input}":`, error);
        // Continue with other inputs even if one fails
      }
    }

    for (const keyerName of env.keyerNames) {
      try {
        await convertTextToSpeech(formatString(env.keyerOnFormat, keyerName));
        await convertTextToSpeech(formatString(env.keyerOffFormat, keyerName));
      } catch (error) {
        console.error(`Failed to precompute speech for keyer "${keyerName}":`, error);
        // Continue with other keyers even if one fails
      }
    }
    for (const superSourceName of env.superSourceNames) {
      try {
        await convertTextToSpeech(formatString(env.fadedFormat, superSourceName));
        await convertTextToSpeech(formatString(env.fadingFormat, superSourceName));
        await convertTextToSpeech(formatString(env.cutFormat, superSourceName));
        await convertTextToSpeech(formatString(env.previewFormat, superSourceName));
      } catch (error) {
        console.error(`Failed to precompute speech for supersource "${superSourceName}":`, error);
        // Continue with other superSourceNames even if one fails
      }
    }

    console.log('Setting up ATEM connection...');
    myAtem.on('connected', connected);
    myAtem.on('stateChanged', stateChanged);
    myAtem.on('error', error => {
      console.error('ATEM connection error:', error);
    });
    myAtem.on('disconnected', () => {
      console.log('Disconnected from ATEM');
    });

    console.log(`Connecting to ATEM at ${env.atemIP}...`);
    await myAtem.connect(env.atemIP);
  } catch (error) {
    console.error('Error during ATEM connection setup:', error);
    throw error; // Re-throw to be caught by the caller
  }
}

async function connected(): Promise<void> {
  try {
    console.log('ATEM connected callback triggered');
    await sleep(2000);

    const superSources = Object.values(myAtem.state?.inputs || {}).filter((input): input is InputChannel => !!input?.shortName?.startsWith('SS'));
    console.log(`Found ${superSources.length} super sources`);

    for (let i = 0; i < superSources.length; i++) {
      const superSource = superSources[i];
      try {
        if (i >= env.superSourceNames.length) {
          console.error(`Supersource ${i} with inputId ${superSource.inputId} not named in .env SUPER_SOURCE_NAMES`);
          continue;
        }
        superSourceIdToName[superSource.inputId] = env.superSourceNames[i];

        console.log(`Mapped super source ${superSource.shortName} with inputId ${superSource.inputId} to "${env.superSourceNames[i]}"`);
      } catch (error) {
        console.error(`Error processing super source ${superSource.shortName}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in connected callback:', error);
  }
}

async function stateChanged(state: AtemState, pathToChange: string[]): Promise<void> {
  try {
    // TODO: Tapping preview multiple times ideally would trigger the name to be said again.
    console.log('stateChanged', pathToChange.sort());

    // Validate state structure
    if (!state?.video?.mixEffects?.[0]) {
      console.error('Invalid state structure:', state);
      return;
    }

    const mixEffect = state.video.mixEffects[0];

    // Validate inputs
    if (!mixEffect.previewInput || !mixEffect.programInput) {
      console.error('Missing preview or program input:', mixEffect);
      return;
    }

    // Get input names with validation
    const previewInputIndex = mixEffect.previewInput - 1;
    const programInputIndex = mixEffect.programInput - 1;

    if (!superSourceIdToName[mixEffect.previewInput] && (previewInputIndex < 0 || previewInputIndex >= env.inputNames.length)) {
      console.error(`Preview input index out of range: ${previewInputIndex}`);
      return;
    }

    if (!superSourceIdToName[mixEffect.programInput] && (programInputIndex < 0 || programInputIndex >= env.inputNames.length)) {
      console.error(`Program input index out of range: ${programInputIndex}`);
      return;
    }

    const previewName = superSourceIdToName[mixEffect.previewInput] || env.inputNames[previewInputIndex];
    const programName = superSourceIdToName[mixEffect.programInput] || env.inputNames[programInputIndex];

    if (pathToChange.includes('video.mixEffects.0.transitionPosition')) {
      if (pathToChange.includes('video.mixEffects.0.programInput')) {
        return await play(formatString(env.fadedFormat, programName));
      }
      if (pathToChange.includes('video.mixEffects.0.previewInput')) {
        return await play(formatString(env.fadingFormat, previewName));
      }
      return;
    }

    // TODO: Support multiple m/es.
    if (pathToChange.includes('video.mixEffects.0.programInput')) {
      return await play(formatString(env.cutFormat, programName));
    }

    if (pathToChange.includes('video.mixEffects.0.previewInput')) {
      return await play(formatString(env.previewFormat, previewName));
    }

    // TODO: Support multiple keyers.
    if (pathToChange.includes('video.mixEffects.0.upstreamKeyers.0.onAir')) {
      // Validate keyer structure
      if (mixEffect.upstreamKeyers?.[0]?.onAir === undefined) {
        console.error('Invalid keyer structure:', mixEffect.upstreamKeyers);
        return;
      }

      const onAir = mixEffect.upstreamKeyers[0].onAir;

      if (env.keyerNames.length === 0) {
        console.error('No keyer names defined');
        return;
      }

      return await play(formatString(onAir ? env.keyerOnFormat : env.keyerOffFormat, env.keyerNames[0]));
    }
  } catch (error) {
    console.error('Error in stateChanged callback:', error);
  }
}

export function disconnect(): void {
  try {
    console.log('Disconnecting from ATEM...');
    myAtem.disconnect().catch(error => {
      console.error('Error disconnecting from ATEM:', error);
    });
  } catch (error) {
    console.error('Error in disconnect function:', error);
  }
}
