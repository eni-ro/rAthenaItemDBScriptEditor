import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const VERSION = pkg.version;
const APP_NAME = 'itemdb-script-editor';
const RELEASE_DIR = path.join(process.cwd(), 'release');
const ZIP_NAME = `${APP_NAME}-v${VERSION}.zip`;
const ZIP_PATH = path.join(RELEASE_DIR, ZIP_NAME);

// Ensure release directory exists
if (!fs.existsSync(RELEASE_DIR)) {
  fs.mkdirSync(RELEASE_DIR);
}

const output = fs.createWriteStream(ZIP_PATH);
const archive = archiver('zip', {
  zlib: { level: 9 } // Maximum compression
});

output.on('close', () => {
  console.log(`\nArchive created: ${ZIP_PATH}`);
  console.log(`Total size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
});

archive.on('warning', (err) => {
  if (err.code === 'ENOENT') {
    console.warn(err);
  } else {
    throw err;
  }
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

const innerFolder = `${APP_NAME}/`;

// 1. Add Executable
const exePath = path.join(process.cwd(), 'src-tauri', 'target', 'release', `${APP_NAME}.exe`);
if (fs.existsSync(exePath)) {
  archive.file(exePath, { name: `${innerFolder}${APP_NAME}.exe` });
} else {
  console.error(`Error: Executable not found at ${exePath}`);
  process.exit(1);
}

// 1.5. Add DB Processor (Sidecar)
const processorPath = path.join(process.cwd(), 'src-tauri', 'binaries', 'db_processor.exe');
if (fs.existsSync(processorPath)) {
  archive.file(processorPath, { name: `${innerFolder}db_processor.exe` });
} else {
  console.warn(`Warning: db_processor.exe not found at ${processorPath}. It will be missing from the release.`);
}

// 2. Add Config files (Flatly into the inner folder)
const configDir = path.join(process.cwd(), 'config');
if (fs.existsSync(configDir)) {
  const files = fs.readdirSync(configDir);
  files.forEach(file => {
    const filePath = path.join(configDir, file);
    if (fs.statSync(filePath).isFile()) {
      archive.file(filePath, { name: `${innerFolder}${file}` });
    }
  });
}

// 3. Add README and LICENSE
const rootFiles = ['README.md', 'LICENSE'];
rootFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    archive.file(filePath, { name: `${innerFolder}${file}` });
  }
});

archive.finalize();
