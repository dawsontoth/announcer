import { describe, expect, test } from '@jest/globals';
import { formatString } from './format-string.ts';

describe('formatString', () => {
  test('replaces {name} with the provided name', () => {
    const template = 'Hello, {name}!';
    const name = 'John';
    const result = formatString(template, name);
    expect(result).toBe('Hello, John!');
  });

  test('replaces multiple occurrences of {name}', () => {
    const template = 'Hello, {name}! How are you, {name}?';
    const name = 'Jane';
    const result = formatString(template, name);
    expect(result).toBe('Hello, Jane! How are you, Jane?');
  });

  test('returns the original string if no {name} is present', () => {
    const template = 'Hello, world!';
    const name = 'Alice';
    const result = formatString(template, name);
    expect(result).toBe('Hello, world!');
  });

  test('works with empty name', () => {
    const template = 'Hello, {name}!';
    const name = '';
    const result = formatString(template, name);
    expect(result).toBe('Hello, !');
  });

  test('works with empty template', () => {
    const template = '';
    const name = 'Bob';
    const result = formatString(template, name);
    expect(result).toBe('');
  });

  test('handles special characters in name', () => {
    const template = 'Hello, {name}!';
    const name = 'John & Jane';
    const result = formatString(template, name);
    expect(result).toBe('Hello, John & Jane!');
  });
});
