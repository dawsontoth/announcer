Announcer: Development Guidelines (Project-Specific)

Audience: Experienced Node/TypeScript contributors. This document captures the non-obvious, project-specific setup, testing, and development details that will save you time.

1) Build and Configuration

Prerequisites
- Node.js: Use v22 (see .nvmrc). CI also validates on 20.x and 24.x.
  - nvm use (or nvm install) will align your local with .nvmrc.
- ffmpeg must be installed and on PATH (openai.ts shells out to ffmpeg to trim leading silence).
- System audio backend for play-sound:
  - macOS: afplay is available by default.
  - Linux: install one of mpg123, mplayer, aplay, or similar. play-sound will attempt available players.
  - Headless/CI: Do not exercise audio playback in tests; mock it (see Testing section).
- Network access to your ATEM switcher (or use the included simulator).
- OpenAI API access if you plan to exercise text-to-speech at runtime.

Environment Variables
- Copy .env.example to .env and configure:
  - ATEM_IP: Required. IPv4 format enforced at startup (e.g., 192.168.1.240). The app will throw if not IPv4.
  - SUPER_SOURCE_NAMES: CSV of super source labels.
  - INPUT_NAMES: CSV of input labels. Defaults to 1..20 if omitted.
  - KEYER_NAMES: CSV of keyer labels.
  - FADED_FORMAT, FADING_FORMAT, CUT_FORMAT, PREVIEW_FORMAT, KEYER_ON_FORMAT, KEYER_OFF_FORMAT: Format strings. Use {name} placeholder (formatString will replace {name} with the actual name).
  - OPENAI_API_KEY: Needed for runtime TTS. If absent, openai.ts will warn and requests will fail at call time.
- dotenv-cli is used for start/dev scripts; your .env is loaded automatically.

Install/Build/Run
- Install: npm ci (or npm install). postinstall triggers npm run build (tsc to dist/).
- Dev (TypeScript execution via tsx): npm run dev
- Prod: npm run build && npm start
  - start runs dist/index.js with dotenv preloaded.
- TypeScript/ESM specifics:
  - "type": "module" in package.json; tsconfig uses ESNext module/target.
  - allowImportingTsExtensions and rewriteRelativeImportExtensions are enabled. You must include .ts in relative imports (e.g., import { x } from './file.ts'). ESLint enforces this via import/extensions.

ATEM Simulator (local integration without hardware)
- A Python simulator is vendored at pyAtemSim. Start it in a separate shell:
  - npm run sim  # runs: (cd pyAtemSim && python3 ./atem_server.py)
- Set ATEM_IP=127.0.0.1 in your .env for local simulation.
- Start the app (dev or prod) and observe event logs. The simulator allows you to exercise state change handling without a switcher.

Speech Cache
- Generated TTS MP3s are cached in speech.cache/ (auto-created). Filenames include a hash of the text; clearing the directory forces regeneration.

2) Testing (Jest + ts-jest, ESM)

How tests are wired
- Jest config: jest.config.js
  - preset: ts-jest with useESM: true.
  - extensionsToTreatAsEsm: ['.ts'] and moduleNameMapper to support ESM and path mapping (e.g., stripping .js when Jest resolves compiled ESM paths).
  - modulePathIgnorePatterns: ['/dist'] to avoid compiled artifacts.
- Tests are colocated next to sources using *.test.ts naming (see src/utils/*).
- Use @jest/globals to import describe/test/expect in ESM.

Run tests
- All tests: npm test
- Single file: npx jest src/utils/format-string.test.ts
- Watch: npx jest --watch
- Coverage: npx jest --coverage

Authoring tests (guidelines)
- Prefer unit tests around pure utilities. Avoid hitting OpenAI/network/audio in unit tests.
- If a module has side effects (e.g., creates directories, connects to hardware), isolate those behind injectable helpers or mock them in tests.
- ESM/TypeScript import tip: keep .ts extensions in relative imports (tsconfig+ESLint expect this).

Mocking external effects
- openai.ts: mock the OpenAI client and its audio.speech.create method. Example:
  jest.mock('openai', () => ({ default: jest.fn().mockImplementation(() => ({ audio: { speech: { create: jest.fn().mockResolvedValue({ arrayBuffer: async () => new ArrayBuffer(0) }) } } })) }));
  - Also stub fs writes and child_process.execSync (ffmpeg) if you need to cover convertTextToSpeech without actually encoding audio.
- audio.ts: mock play-sound to avoid launching OS players:
  jest.mock('play-sound', () => () => ({ play: jest.fn().mockReturnValue({ kill: jest.fn() }) }));

Creating and running a demo test (what we verified)
- Existing tests are under src/utils and pass on Node 22.
- For demonstration we added a temporary test exercising formatString, executed the suite (npm test), then removed the file to keep the repo clean. You can replicate by creating any *.test.ts next to a module.

3) Additional Development Notes

Code style & linting
- ESLint (flat config) + Prettier integration.
  - Lint: npm run lint
  - Auto-fix: npm run lint:fix
- Notable rules:
  - import/extensions requires explicit extensions including .ts for local imports.
  - quotes: single, semi: always, 2-space indent, no trailing spaces, arrow-parens as-needed.

Error handling & resilience patterns in this codebase
- env.ts: fails fast on missing critical env with clear messages; ATEM_IP validated by regex (strict IPv4).
- openai.ts: initializes OpenAI client on import; warns if no OPENAI_API_KEY; retries TTS 3x with 1s backoff; writes a raw file then trims via ffmpeg; throws on failure.
- audio.ts: stopAll() before new playback; verifies file exists; collects spawned player handles and kills them safely.
- atem.ts: precomputes speech for configured names; maps super source IDs to configured names; guards against malformed AtemState; logs and continues when possible.

Runtime tips
- If TTS calls are failing locally, ensure OPENAI_API_KEY is set and ffmpeg is present. Try: ffmpeg -version.
- If audio playback is silent or errors, install a supported player (e.g., sudo apt-get install mpg123) and ensure your environment can play sound.
- If ATEM_IP is incorrect format or unreachable, the app will error during connect(); use the simulator for local testing.

CI matrix
- .github/workflows/build-test-lint.yml runs build, test, and lint on Ubuntu with Node 20.x/22.x/24.x. Keep Node 22 compatibility locally; CI will catch regressions across versions.

Releasing/Running in constrained environments (Raspberry Pi, etc.)
- See README.md for a minimal crontab-based auto-start example. Ensure the absolute npm path matches your environment when using @reboot.

Quick commands
- Align Node: nvm use
- Install deps: npm ci
- Build: npm run build
- Dev run: npm run dev
- Prod run: npm start
- Test all: npm test
- Lint: npm run lint

Appendix: file system notes
- dist/ is generated by tsc; excluded from lint and tests.
