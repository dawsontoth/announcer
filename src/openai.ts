import { Buffer } from 'node:buffer';
import fs, { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import OpenAI from 'openai';

const openai = new OpenAI();
const intoDir = './speech.cache/';

if (!existsSync(intoDir)) {
  mkdirSync(intoDir);
}

export async function convertTextToSpeech(text: string): Promise<string> {
  const speechFile = join(intoDir, `${text.toLowerCase()}.mp3`);
  if (existsSync(speechFile)) {
    return speechFile;
  }

  const mp3 = await openai.audio.speech.create({
    model: 'gpt-4o-mini-tts',
    voice: 'coral',
    input: text,
    instructions: 'Speak in a fast, cheerful and positive tone.'
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(speechFile, buffer);

  return speechFile;
}
