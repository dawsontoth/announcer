import { envToCSV } from 'src/utils/env-to-csv';

/**
 * Validates that an environment variable exists and returns its value
 * @param name The name of the environment variable
 * @param defaultValue Optional default value if the environment variable is not set
 * @returns The value of the environment variable or the default value
 * @throws If the environment variable is not set and no default value is provided
 */
function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) {
      console.warn(`Environment variable ${name} is not set, using default value: "${defaultValue}"`);
      return defaultValue;
    }
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

/**
 * Validates that an environment variable exists, parses it as a CSV, and returns the result
 * @param name The name of the environment variable
 * @param defaultValue Optional default value if the environment variable is not set
 * @returns An array of values parsed from the CSV
 * @throws If the environment variable is not set and no default value is provided
 */
function getEnvVarAsCSV(name: string, defaultValue?: string): string[] {
  const value = getEnvVar(name, defaultValue);
  return envToCSV(value);
}

console.log('Validating environment variables...');

// ATEM configuration
export const env = {
  atemIP: getEnvVar('ATEM_IP'),
  superSourceNames: getEnvVarAsCSV('SUPER_SOURCE_NAMES'),
  inputNames: getEnvVarAsCSV('INPUT_NAMES', [...Array(21).keys()].slice(1).join(',')),
  keyerNames: getEnvVarAsCSV('KEYER_NAMES'),

  fadedFormat: getEnvVar('FADED_FORMAT', '{0} is now live'),
  fadingFormat: getEnvVar('FADING_FORMAT', 'fading in {0}'),
  cutFormat: getEnvVar('CUT_FORMAT', 'cut {0}'),
  previewFormat: getEnvVar('PREVIEW_FORMAT', '{0} next'),
  keyerOnFormat: getEnvVar('KEYER_ON_FORMAT', '{0} is on'),
  keyerOffFormat: getEnvVar('KEYER_OFF_FORMAT', '{0} is off')
} as const;

if (!env.atemIP.match(/^\d+\.\d+\.\d+\.\d+$/)) {
  throw new Error('ATEM_IP must be a valid IP address (e.g., 192.168.1.240)');
}

console.log('Validated environment variables.');
