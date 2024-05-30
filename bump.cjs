// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

function incrementVersion(version, type) {
  const [major, minor, patch] = version.split('.').map(Number);

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error('Invalid version type');
  }
}

function updateVersionInFile(filePath, type) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading file: ${filePath}`);
      return;
    }

    let json;
    try {
      json = JSON.parse(data);
    } catch (parseError) {
      console.error(`Error parsing JSON in file: ${filePath}`);
      return;
    }

    if (!json.version) {
      console.error(`No version found in ${filePath}`);
      return;
    }

    const incrementedVersion = incrementVersion(json.version, type);
    const before = json.version;
    json.version = incrementedVersion;

    fs.writeFile(filePath, JSON.stringify(json, null, 2), 'utf8', err => {
      if (err) {
        console.error(`Error writing to file: ${filePath}`);
        return;
      }
      console.log(`Version updated successfully in ${filePath} from ${before} to ${incrementedVersion}`);
    });
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const versionType = args[0];

if (!versionType || !['--major', '--minor', '--patch'].includes(versionType)) {
  console.error('Usage: node increment_version.js <--major|--minor|--patch>');
  process.exit(1);
}

// Update versions in both files
updateVersionInFile('manifest.json', versionType.slice(2));
updateVersionInFile('package.json', versionType.slice(2));
