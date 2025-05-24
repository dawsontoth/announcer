import { describe, expect, test } from '@jest/globals';
import { generateMD5Hash } from 'src/utils/md5';

describe('generateMD5Hash', () => {
  test('generates correct MD5 hash for a simple string', () => {
    // Known MD5 hash for "hello"
    const expected = '5d41402abc4b2a76b9719d911017c592';
    const result = generateMD5Hash('hello');
    expect(result).toBe(expected);
  });

  test('generates correct MD5 hash for an empty string', () => {
    // Known MD5 hash for ""
    const expected = 'd41d8cd98f00b204e9800998ecf8427e';
    const result = generateMD5Hash('');
    expect(result).toBe(expected);
  });

  test('generates correct MD5 hash for a string with special characters', () => {
    // Known MD5 hash for "hello!@#$%^&*()"
    const expected = 'eb87274d4a48faee78394df1ac75de35';
    const result = generateMD5Hash('hello!@#$%^&*()');
    expect(result).toBe(expected);
  });

  test('generates correct MD5 hash for a longer text', () => {
    // Known MD5 hash for a longer text
    const input = 'This is a longer text that will be hashed using the MD5 algorithm.';
    const expected = '005cd9586bdd59a2c7b1a962f8aefc56';
    const result = generateMD5Hash(input);
    expect(result).toBe(expected);
  });

  test('generates different hashes for different inputs', () => {
    const hash1 = generateMD5Hash('input1');
    const hash2 = generateMD5Hash('input2');
    expect(hash1).not.toBe(hash2);
  });

  test('generates same hash for same input', () => {
    const input = 'consistent input';
    const hash1 = generateMD5Hash(input);
    const hash2 = generateMD5Hash(input);
    expect(hash1).toBe(hash2);
  });
});
