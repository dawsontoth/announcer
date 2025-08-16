import { Buffer } from 'node:buffer';
import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs, { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import OpenAI from 'openai';

// Initialize OpenAI client
let openai: OpenAI;
try {
  openai = new OpenAI();
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY environment variable is not set. OpenAI API calls will likely fail.');
  }
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error);
  throw new Error('OpenAI client initialization failed. Please check your configuration.');
}

// Cache directory setup
const intoDir = './speech.cache/';

try {
  if (!existsSync(intoDir)) {
    console.log(`Creating cache directory: ${intoDir}`);
    mkdirSync(intoDir);
  }
} catch (error) {
  console.error(`Failed to create cache directory ${intoDir}:`, error);
  throw error;
}

/**
 * Converts text to speech using OpenAI's API and caches the result
 * @param text The text to convert to speech
 * @returns The path to the audio file
 * @throws If the text is empty, the OpenAI API call fails, or the file cannot be written
 */
export async function convertTextToSpeech(text: string): Promise<string> {
  if (!text) {
    throw new Error('Text cannot be empty');
  }

  // Create a hash of the text for a more robust filename
  const hash = crypto.createHash('md5').update(text).digest('hex');
  const safeText = text.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 50);
  const speechFile = join(intoDir, `${safeText}_${hash}.mp3`);
  const speechFileRaw = join(intoDir, `${safeText}_${hash}_raw.mp3`);

  // Check if the file already exists in cache
  if (existsSync(speechFile)) {
    console.log(`Using cached speech file for "${text}": ${speechFile}`);
    return speechFile;
  }

  console.log(`Converting text to speech via OpenAI API: "${text}"`);

  // Call OpenAI API with retry logic
  let retries = 3;
  let mp3;

  while (retries > 0) {
    try {
      mp3 = await openai.audio.speech.create({
        model: 'gpt-4o-mini-tts',
        voice: 'coral',
        input: text,
        instructions: 'Speak in a quick, neutral and positive tone.',
      });
      break; // Success, exit the retry loop
    } catch (apiError) {
      retries--;
      if (retries === 0) {
        throw apiError; // No more retries, re-throw the error
      }
      console.warn(`OpenAI API call failed, retrying (${retries} attempts left):`, apiError);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
    }
  }

  if (!mp3) {
    throw new Error('Failed to generate speech after multiple attempts');
  }

  // Convert the response to a buffer and write to file
  try {
    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.promises.writeFile(speechFileRaw, buffer);
    console.log('Cutting off silence from the start via ffmpeg');
    execSync(`ffmpeg -i ${speechFileRaw} -af silenceremove=1:0:-50dB -y ${speechFile}`);
  } catch (fileError) {
    console.error('Failed to write speech file:', fileError);
    throw fileError;
  }

  return speechFile;
}
