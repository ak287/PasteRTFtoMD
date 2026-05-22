import * as fs from 'fs';
import * as path from 'path';
import { runTests } from '@vscode/test-electron';

interface ExtensionManifest {
  publisher: string;
  name: string;
}

function getExtensionIdentifier(extensionDevelopmentPath: string): string {
  const manifestPath = path.join(extensionDevelopmentPath, 'package.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as ExtensionManifest;
  return `${manifest.publisher}.${manifest.name}`;
}

async function main(): Promise<void> {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');
    const extensionTestsPath = path.resolve(__dirname, './suite/index');
    const extensionId = getExtensionIdentifier(extensionDevelopmentPath);
    // Some shells export this globally, which makes Code.exe run as Node
    // and breaks @vscode/test-electron launch arguments.
    const extensionTestsEnv: NodeJS.ProcessEnv = {
      ELECTRON_RUN_AS_NODE: undefined
    };

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      extensionTestsEnv,
      launchArgs: ['--enable-proposed-api', extensionId],
      version: '1.96.0'
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to run tests', error);
    process.exit(1);
  }
}

void main();
