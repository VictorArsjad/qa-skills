#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PKG_ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(PKG_ROOT, 'skills');
const NAME_RE = /^[a-z0-9][a-z0-9-]*$/;

function defaultTarget() {
  return process.env.QA_SKILLS_DIR || path.join(os.homedir(), '.agents', 'skills');
}

function parseArgs(argv) {
  const result = { command: 'help', skill: null, target: defaultTarget(), force: false };
  const positional = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--path' || arg === '-p') {
      const value = argv[++i];
      if (!value || value.startsWith('-')) throw new Error(`${arg} needs a directory`);
      result.target = path.resolve(value);
    } else if (arg === '--force' || arg === '-f') {
      result.force = true;
    } else if (arg === '--help' || arg === '-h') {
      positional.push('help');
    } else if (arg === '--version' || arg === '-v') {
      positional.push('version');
    } else {
      positional.push(arg);
    }
  }

  [result.command] = positional;
  result.skill = positional[1] || null;
  return result;
}

function availableSkills() {
  if (!fs.existsSync(SOURCE_DIR)) return [];
  return fs.readdirSync(SOURCE_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(SOURCE_DIR, entry.name, 'SKILL.md')))
    .map((entry) => entry.name)
    .sort();
}

function parseDescription(skill) {
  const content = fs.readFileSync(path.join(SOURCE_DIR, skill, 'SKILL.md'), 'utf8');
  const match = content.match(/^description:\s*(.+)$/m);
  return match ? match[1].trim() : '';
}

function checkName(skill, command) {
  if (!skill) throw new Error(`usage: qa-skills ${command} <skill>`);
  if (!NAME_RE.test(skill)) throw new Error(`invalid skill name: ${skill}`);
  const skills = availableSkills();
  if (!skills.includes(skill)) {
    throw new Error(`unknown skill: ${skill}. Available: ${skills.join(', ') || 'none'}`);
  }
}

function inside(target, destination) {
  const relative = path.relative(target, destination);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function add(skill, target, force) {
  checkName(skill, 'add');
  const source = path.join(SOURCE_DIR, skill);
  const destination = path.join(target, skill);

  if (fs.existsSync(destination) && !force) {
    throw new Error(`${destination} already exists. Use "npx @victorarsjad/qa-skills update ${skill}" or --force.`);
  }

  fs.mkdirSync(target, { recursive: true });
  fs.cpSync(source, destination, { recursive: true, force });
  console.log(`Installed ${skill} → ${destination}`);
}

function update(skill, target) {
  checkName(skill, 'update');
  const destination = path.join(target, skill);

  if (!fs.existsSync(destination)) {
    throw new Error(`${skill} is not installed at ${target}. Use "qa-skills add ${skill}".`);
  }

  fs.cpSync(path.join(SOURCE_DIR, skill), destination, { recursive: true, force: true });
  console.log(`Updated ${skill} → ${destination}`);
}

function remove(skill, target) {
  checkName(skill, 'remove');
  const destination = path.join(target, skill);

  if (!inside(target, destination) || !fs.existsSync(destination)) {
    throw new Error(`${skill} is not installed at ${target}.`);
  }
  if (!fs.existsSync(path.join(destination, 'SKILL.md'))) {
    throw new Error(`${destination} is not a skill directory.`);
  }

  fs.rmSync(destination, { recursive: true, force: true });
  console.log(`Removed ${skill} from ${target}`);
}

function help() {
  console.log(`qa-skills — install agent skills for QA engineers

Usage:
  qa-skills list
  qa-skills add <skill> [--path <dir>] [--force]
  qa-skills update <skill> [--path <dir>]
  qa-skills remove <skill> [--path <dir>]
  qa-skills --version

Default skills directory: ${defaultTarget()}
Override with --path or QA_SKILLS_DIR.`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  switch (args.command) {
    case 'list': {
      const skills = availableSkills();
      if (skills.length === 0) {
        console.log('No skills available.');
      } else {
        for (const skill of skills) {
          console.log(`${skill} — ${parseDescription(skill)}`);
        }
      }
      break;
    }
    case 'add':
      add(args.skill, args.target, args.force);
      break;
    case 'update':
      update(args.skill, args.target);
      break;
    case 'remove':
      remove(args.skill, args.target);
      break;
    case 'version':
      console.log(require(path.join(PKG_ROOT, 'package.json')).version);
      break;
    case 'help':
    default:
      help();
  }
}

try {
  main();
} catch (error) {
  console.error(`qa-skills: ${error.message}`);
  process.exitCode = 1;
}
