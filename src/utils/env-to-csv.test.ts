import { describe, expect, test } from '@jest/globals';
import { envToCSV } from './env-to-csv.ts';

describe('envToCSV', () => {
  test('splits a comma-separated string into an array', () => {
    const input = 'a,b,c';
    const result = envToCSV(input);
    expect(result).toEqual(['a', 'b', 'c']);
  });

  test('trims whitespace from each element', () => {
    const input = ' a , b , c ';
    const result = envToCSV(input);
    expect(result).toEqual(['a', 'b', 'c']);
  });

  test('filters out empty elements', () => {
    const input = 'a,,c';
    const result = envToCSV(input);
    expect(result).toEqual(['a', 'c']);
  });

  test('returns an empty array for an empty string', () => {
    const input = '';
    const result = envToCSV(input);
    expect(result).toEqual([]);
  });

  test('handles string with only whitespace', () => {
    const input = '   ';
    const result = envToCSV(input);
    expect(result).toEqual([]);
  });

  test('handles string with only commas', () => {
    const input = ',,,';
    const result = envToCSV(input);
    expect(result).toEqual([]);
  });
});
