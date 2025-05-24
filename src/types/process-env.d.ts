declare global {
  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: string|undefined;

      ATEM_IP: string;

      SUPER_SOURCE_NAMES: string;

      INPUT_NAMES: string;
      KEYER_NAMES: string;

      FADED_FORMAT: string;
      FADING_FORMAT: string;
      CUT_FORMAT: string;
      PREVIEW_FORMAT: string;
      KEYER_ON_FORMAT: string;
      KEYER_OFF_FORMAT: string;
    }
  }
}
