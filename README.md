# Announcer Project Guidelines

This document provides guidelines for development on the Announcer project, which creates audio announcements for ATEM video switcher operations using OpenAI's text-to-speech API.

## Build/Configuration Instructions

### Prerequisites

- Node.js (version specified in `.nvmrc`)
- An ATEM video switcher
- OpenAI API key

### Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure the following environment variables in `.env`:
    - `ATEM_IP`: IP address of your ATEM switcher
    - `SUPER_SOURCE_NAMES`: Comma-separated names for super sources
    - `INPUT_NAMES`: Comma-separated names for inputs
    - `KEYER_NAMES`: Comma-separated names for keyers
    - `*_FORMAT`: Various announcement format strings
    - `OPENAI_API_KEY`: Your OpenAI API key

#### Raspberry Pi Setup

```
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - &&\
sudo apt-get install -y nodejs

which node
# /usr/bin/node
sudo crontab -e
@reboot (cd /home/trinity/announcer/ && /usr/bin/node index.js) &
```

### Installation

```bash
npm install
```

### Building

```bash
npm run build
```

This compiles TypeScript files from `src/` to JavaScript in the `dist/` directory.

### Running

Development mode (with live TypeScript execution):
```bash
npm run dev
```

Production mode (compiled JavaScript):
```bash
npm run build
npm start
```

## Testing Information

### Running Tests

Run all tests:
```bash
npm test
```

Run a specific test file:
```bash
npx jest path/to/test.ts
```

### Adding New Tests

1. Create a new test file with the naming convention `[name].test.ts` in the same directory as the file being tested.

2. Import the necessary Jest functions and the module to test:
   ```typescript
   import { describe, expect, test } from '@jest/globals';
   import { yourFunction } from 'src/path/to/your/function';
   ```

3. Write tests using the describe/test pattern:
   ```typescript
   describe('yourFunction', () => {
     test('should do something specific', () => {
       expect(yourFunction('input')).toBe('expected output');
     });
   });
   ```

### Example Test

Here's an example of a test for a utility function that capitalizes strings:

```typescript
// src/utils/capitalize.ts
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// src/utils/capitalize.test.ts
import { describe, expect, test } from '@jest/globals';
import { capitalize } from 'src/utils/capitalize';

describe('capitalize', () => {
  test('capitalizes the first letter of a string', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  test('returns empty string for empty input', () => {
    expect(capitalize('')).toBe('');
  });
});
```

Run this specific test with:
```bash
npx jest src/utils/capitalize.test.ts
```

## Additional Development Information

### Project Structure

- `src/`: Source code
    - `index.ts`: Main entry point
    - `atem.ts`: ATEM connection and event handling
    - `audio.ts`: Audio playback functionality
    - `openai.ts`: OpenAI text-to-speech integration
    - `env.ts`: Environment configuration
    - `utils/`: Utility functions

### Code Style

- The project uses ESLint and Prettier for code formatting and linting
- Run linting: `npm run lint`
- Fix linting issues: `npm run lint:fix`

### Text-to-Speech Caching

- Generated speech files are cached in the `speech.cache/` directory
- Files are named based on the text content
- The cache prevents redundant API calls to OpenAI

### ATEM Integration

- The project connects to an ATEM video switcher using the `atem-connection` library
- It monitors state changes (program/preview changes, transitions, keyers)
- When state changes occur, it plays audio announcements using text-to-speech

To emulate this:
```bash
git clone https://github.com/jonknoll/pyAtemSim.git
cd pyAtemSim
python atem_server.py
```

### Environment Variables

- Environment variables are parsed using the `envToCSV` utility for comma-separated values
- The `dotenv` package is used to load environment variables from the `.env` file
- The `dotenv-cli` package is used to inject environment variables when running the application
