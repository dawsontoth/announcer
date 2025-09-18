import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import type { Mock } from 'jest-mock';

// ESM-friendly mocks
jest.mock('play-sound', () => () => ({
  play: jest.fn().mockReturnValue({
    kill: jest.fn(),
  }),
}));

jest.mock('node:fs', () => ({
  existsSync: jest.fn(() => true),
}));

// Mock convertTextToSpeech to avoid OpenAI usage
jest.mock('./openai.ts', () => ({
  convertTextToSpeech: jest.fn(() => Promise.resolve('speech.cache/fake.mp3')),
}));

async function importAudio() {
  return await import('./audio.ts');
}

beforeEach(() => {
  jest.resetModules();
  jest.spyOn(console, 'log').mockImplementation(() => {
  });
  jest.spyOn(console, 'error').mockImplementation(() => {
  });
});

describe('audio.ts', () => {
  test('play with empty text logs and returns early without calling TTS', async () => {
    const { play } = await importAudio();
    const { convertTextToSpeech } = jest.requireMock('./openai.ts') as { convertTextToSpeech: Mock };
    convertTextToSpeech.mockClear();

    await expect(play('')).resolves.toBeUndefined();
    expect(convertTextToSpeech).not.toHaveBeenCalled();
  });

  test('play happy path: converts TTS, verifies file, and plays', async () => {
    const { play, stopAll } = await importAudio();
    const { convertTextToSpeech } = jest.requireMock('./openai.ts') as { convertTextToSpeech: Mock };
    convertTextToSpeech.mockClear();

    await play('Hello world');

    // Verify TTS conversion called
    expect(convertTextToSpeech).toHaveBeenCalledWith('Hello world');

    // stopAll should not throw
    expect(() => stopAll()).not.toThrow();
  });

  test('throws when generated audio file does not exist', async () => {
    const { play } = await importAudio();
    const fsMock = jest.requireMock('node:fs') as { existsSync: Mock };
    fsMock.existsSync.mockReturnValue(false);

    await expect(play('Missing file case')).rejects.toThrow('Audio file does not exist');
  });

  test('throws when player returns null/undefined (failed to start playback)', async () => {
    // Rewire play-sound to return play() that yields null
    jest.doMock('play-sound', () => () => ({
      play: jest.fn().mockReturnValue(null),
    }));

    const { play } = await importAudio();

    await expect(play('Should fail to start')).rejects.toThrow('Failed to start audio playback');
  });

  test('stopAll handles kill throwing without crashing', async () => {
    // Return a handle whose kill throws
    jest.doMock('play-sound', () => () => ({
      play: jest.fn().mockReturnValue({
        kill: jest.fn(() => {
          throw new Error('kill failed');
        }),
      }),
    }));

    const { play, stopAll } = await importAudio();
    await play('Test kill error');

    // Should not throw
    expect(() => stopAll()).not.toThrow();
  });
});
