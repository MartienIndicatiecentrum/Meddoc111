// check-mcp-setup.js
const fs = require('fs');
const path = require('path');

function hasSpaces(p) {
  return /\s/.test(p);
}

function checkEnvFile(dir) {
  const envPath = path.join(dir, '.env');
  if (!fs.existsSync(envPath)) {
    return { exists: false };
  }
  const content = fs.readFileSync(envPath, 'utf-8');
  const required = ['SUPABASE_URL', 'SUPABASE_KEY', 'SUPABASE_ACCESS_TOKEN'];
  const missing = required.filter(key => !content.includes(key));
  return { exists: true, missing, content };
}

function checkBuild(dir) {
  const buildPath = path.join(dir, 'build', 'start-server.js');
  return fs.existsSync(buildPath);
}

const cwd = process.cwd();
console.log('Pad naar deze map:', cwd);
if (hasSpaces(cwd)) {
  console.log('FOUT: Het pad bevat spaties! Verplaats de map naar een locatie zonder spaties.');
} else {
  console.log('Pad bevat geen spaties.');
}

const envCheck = checkEnvFile(cwd);
if (!envCheck.exists) {
  console.log('FOUT: .env bestand ontbreekt!');
} else if (envCheck.missing.length > 0) {
  console.log('FOUT: .env mist de volgende variabelen:', envCheck.missing.join(', '));
} else {
  console.log('.env bestand is aanwezig en lijkt compleet.');
}

if (checkBuild(cwd)) {
  console.log('build/start-server.js bestaat.');
} else {
  console.log('FOUT: build/start-server.js ontbreekt. Run eerst: npm run build');
}