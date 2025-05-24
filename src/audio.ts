import playSound from 'play-sound';
import { convertTextToSpeech } from 'src/openai';

let audios: any[] = [];
const player = playSound({});

export async function play(text: string): Promise<void> {
  stopAll();
  const audioFile = await convertTextToSpeech(text);
  console.log(`Playing ${text}`);
  audios = [
    player.play(audioFile, { mplayer: ['-ss', '0.15'] })
  ];
}

export function stopAll(): void {
  for (const audio of audios) {
    audio.kill();
  }
}
