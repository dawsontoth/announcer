import { existsSync } from 'node:fs';
import playSound from 'play-sound';
import { convertTextToSpeech } from './openai.ts';

let audios: any[] = [];
const player = playSound({});

/**
 * Plays the given text as speech
 * @param text The text to convert to speech and play
 * @returns A promise that resolves when the audio starts playing
 * @throws If the text-to-speech conversion fails or the audio file cannot be played
 */
export async function play(text: string): Promise<void> {
  try {
    if (!text) {
      console.error('Cannot play empty text');
      return;
    }

    // Stop any currently playing audio
    stopAll();

    // Convert text to speech and get the audio file path
    console.log(`Converting text to speech: "${text}"`);
    const audioFile = await convertTextToSpeech(text);

    // Verify the audio file exists
    if (!existsSync(audioFile)) {
      throw new Error(`Audio file does not exist: ${audioFile}`);
    }

    console.log(`Playing audio: "${text}" from ${audioFile}`);

    // Play the audio file
    const audio = player.play(audioFile, err => {
      if (err) {
        console.error(`Error playing audio "${text}":`, err);
      }
    });

    if (!audio) {
      throw new Error('Failed to start audio playback');
    }

    // Store the audio instance for later stopping if needed
    audios = [audio];
  } catch (error) {
    console.error(`Error in play function for text "${text}":`, error);
    throw error; // Re-throw to be caught by the caller
  }
}

/**
 * Stops all currently playing audio
 */
export function stopAll(): void {
  try {
    console.log(`Stopping ${audios.length} audio(s)`);
    for (const audio of audios) {
      if (audio && typeof audio.kill === 'function') {
        try {
          audio.kill();
        } catch (error) {
          console.error('Error stopping audio:', error);
        }
      }
    }
    audios = [];
  } catch (error) {
    console.error('Error in stopAll function:', error);
  }
}
