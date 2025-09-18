import { beforeEach, describe, expect, jest, test } from '@jest/globals';

// Helper to reset module cache between tests
async function importEnvModule() {
  jest.resetModules();
  // Dynamically import after setting process.env so top-level evaluation uses our env
  return await import('./env.ts');
}

const origEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...origEnv }; // clone
  // Silence logs to keep test output clean
  jest.spyOn(console, 'log').mockImplementation(() => {
  });
  jest.spyOn(console, 'warn').mockImplementation(() => {
  });
});

describe('env.ts', () => {
  test('throws when required env ATEM_IP is missing', async () => {
    delete process.env.ATEM_IP;
    process.env.SUPER_SOURCE_NAMES = 'SS1,SS2';
    process.env.KEYER_NAMES = 'Key1,Key2';

    await expect(importEnvModule()).rejects.toThrow('Required environment variable ATEM_IP is not set');
  });

  test('throws when ATEM_IP is not a valid IPv4 address', async () => {
    process.env.ATEM_IP = 'localhost';
    process.env.SUPER_SOURCE_NAMES = 'SS1,SS2';
    process.env.KEYER_NAMES = 'Key1,Key2';

    await expect(importEnvModule()).rejects.toThrow('ATEM_IP must be a valid IP address');
  });

  test('loads successfully with minimal required env and applies defaults', async () => {
    process.env.ATEM_IP = '127.0.0.1';
    process.env.SUPER_SOURCE_NAMES = 'SS1,SS2';
    process.env.KEYER_NAMES = 'Key1,Key2';
    // Intentionally omit INPUT_NAMES and various *_FORMAT to trigger defaults

    const { env } = await importEnvModule();

    expect(env.atemIP).toBe('127.0.0.1');
    expect(env.superSourceNames).toEqual(['SS1', 'SS2']);
    expect(env.keyerNames).toEqual(['Key1', 'Key2']);

    // INPUT_NAMES default should be 1..20
    expect(env.inputNames.length).toBe(20);
    expect(env.inputNames[0]).toBe('1');
    expect(env.inputNames[19]).toBe('20');

    // Format defaults
    expect(env.fadedFormat).toBe('{0} is now live');
    expect(env.fadingFormat).toBe('fading in {0}');
    expect(env.cutFormat).toBe('cut {0}');
    expect(env.previewFormat).toBe('{0} next');
    expect(env.keyerOnFormat).toBe('{0} is on');
    expect(env.keyerOffFormat).toBe('{0} is off');
  });

  test('logs warnings when defaults are used', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
    });

    process.env.ATEM_IP = '192.168.0.2';
    process.env.SUPER_SOURCE_NAMES = 'A,B';
    process.env.KEYER_NAMES = 'K1';
    delete process.env.INPUT_NAMES; // use default
    delete process.env.FADED_FORMAT;
    delete process.env.FADING_FORMAT;
    delete process.env.CUT_FORMAT;
    delete process.env.PREVIEW_FORMAT;
    delete process.env.KEYER_ON_FORMAT;
    delete process.env.KEYER_OFF_FORMAT;

    await importEnvModule();

    // We expect at least one default warning, and specifically for INPUT_NAMES and some formats
    const messages = warnSpy.mock.calls.map(args => String(args[0]));
    expect(messages.some(m => m.includes('Environment variable INPUT_NAMES is not set'))).toBe(true);
    expect(messages.some(m => m.includes('FADED_FORMAT') && m.includes('using default value'))).toBe(true);
  });

  test('respects provided INPUT_NAMES and formats', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {
    });

    process.env.ATEM_IP = '10.0.0.5';
    process.env.SUPER_SOURCE_NAMES = 'X';
    process.env.KEYER_NAMES = 'Y';

    process.env.INPUT_NAMES = 'Cam1,Cam2';
    process.env.FADED_FORMAT = 'Live: {0}';
    process.env.FADING_FORMAT = 'Up next: {0}';
    process.env.CUT_FORMAT = 'Cut to {0}';
    process.env.PREVIEW_FORMAT = 'Preview {0}';
    process.env.KEYER_ON_FORMAT = '{0} on';
    process.env.KEYER_OFF_FORMAT = '{0} off';

    const { env } = await importEnvModule();

    expect(env.inputNames).toEqual(['Cam1', 'Cam2']);
    expect(env.fadedFormat).toBe('Live: {0}');
    expect(env.fadingFormat).toBe('Up next: {0}');
    expect(env.cutFormat).toBe('Cut to {0}');
    expect(env.previewFormat).toBe('Preview {0}');
    expect(env.keyerOnFormat).toBe('{0} on');
    expect(env.keyerOffFormat).toBe('{0} off');
  });
});
