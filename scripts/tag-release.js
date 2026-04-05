import { execSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const VERSION = pkg.version;
const TAG_NAME = `v${VERSION}`;

try {
  console.log(`Tagging release: ${TAG_NAME}`);
  
  // Create tag
  execSync(`git tag ${TAG_NAME}`, { stdio: 'inherit' });
  
  // Push tag
  console.log(`Pushing tag to origin...`);
  execSync(`git push origin ${TAG_NAME}`, { stdio: 'inherit' });
  
  console.log(`Successfully tagged and pushed ${TAG_NAME}`);
} catch (error) {
  console.error(`Error: Failed to tag and push release.`);
  console.error(error.message);
  process.exit(1);
}
