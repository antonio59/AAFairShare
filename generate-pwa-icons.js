#!/usr/bin/env node

/**
 * PWA Icon Generator
 * 
 * This script generates PWA icons from the favicon.svg
 * 
 * Requirements: sharp (npm install sharp)
 * 
 * Usage: node generate-pwa-icons.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [
  { size: 64, name: 'pwa-64x64.png' },
  { size: 192, name: 'pwa-192x192.png' },
  { size: 512, name: 'pwa-512x512.png' },
  { size: 512, name: 'maskable-icon-512x512.png' }
];

const inputSvg = path.join(__dirname, 'public', 'favicon.svg');
const outputDir = path.join(__dirname, 'public');

async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');

  for (const { size, name } of sizes) {
    const outputPath = path.join(outputDir, name);
    
    try {
      await sharp(inputSvg)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated: ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Error generating ${name}:`, error.message);
    }
  }

  console.log('\n✨ PWA icons generated successfully!\n');
  console.log('📁 Icons saved in: public/\n');
}

generateIcons().catch(console.error);
