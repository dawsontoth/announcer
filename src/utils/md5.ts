import crypto from 'crypto';

export function generateMD5Hash(input: string): string {
  const hash = crypto.createHash('md5');
  hash.update(input);
  return hash.digest('hex');
}
