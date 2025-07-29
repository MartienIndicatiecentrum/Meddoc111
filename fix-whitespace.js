#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

// File extensions to process
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.md', '.html'];

// Directories to skip
const SKIP_DIRS = ['node_modules', 'dist', 'coverage', '.git', 'venv', 'build'];

function shouldProcessFile(filePath) {
  const ext = extname(filePath);
  return EXTENSIONS.includes(ext);
}

function shouldSkipDirectory(dirName) {
  return SKIP_DIRS.includes(dirName);
}

function removeTrailingWhitespace(content) {
  return content
    .split('\n')
    .map(line => line.replace(/\s+$/, ''))
    .join('\n');
}

function processDirectory(dirPath) {
  try {
    const items = readdirSync(dirPath);

    for (const item of items) {
      const fullPath = join(dirPath, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        if (!shouldSkipDirectory(item)) {
          processDirectory(fullPath);
        }
      } else if (stat.isFile() && shouldProcessFile(fullPath)) {
        try {
          const content = readFileSync(fullPath, 'utf8');
          const cleanedContent = removeTrailingWhitespace(content);

          if (content !== cleanedContent) {
            writeFileSync(fullPath, cleanedContent, 'utf8');
            console.log(`✅ Fixed: ${fullPath}`);
          }
        } catch (error) {
          console.error(`❌ Error processing ${fullPath}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error reading directory ${dirPath}:`, error.message);
  }
}

console.log('🧹 Starting whitespace cleanup...');
processDirectory('.');
console.log('✅ Whitespace cleanup completed!');