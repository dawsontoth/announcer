import { envToCSV } from 'src/utils/env-to-csv';

export const env = {
  atemIP: process.env.ATEM_IP!,
  superSourceNames: envToCSV(process.env.SUPER_SOURCE_NAMES!),
  inputNames: envToCSV(process.env.INPUT_NAMES!),
  keyerNames: envToCSV(process.env.KEYER_NAMES!),

  fadedFormat: process.env.FADED_FORMAT!,
  fadingFormat: process.env.FADING_FORMAT!,
  cutFormat: process.env.CUT_FORMAT!,
  previewFormat: process.env.PREVIEW_FORMAT!,
  keyerOnFormat: process.env.KEYER_ON_FORMAT!,
  keyerOffFormat: process.env.KEYER_OFF_FORMAT!
} as const;
