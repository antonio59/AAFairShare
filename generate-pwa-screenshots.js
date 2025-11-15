#!/usr/bin/env node

/**
 * PWA Screenshot Generator
 * Creates placeholder screenshots for PWA manifest
 */

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, 'public');

async function generateScreenshots() {
  console.log('📸 Generating PWA screenshot placeholders...\n');

  // Wide screenshot (desktop)
  const wideSvg = Buffer.from(`
    <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#grad)"/>
      <text x="640" y="300" font-family="Arial, sans-serif" font-size="64" font-weight="bold" fill="white" text-anchor="middle">AAFairShare</text>
      <text x="640" y="380" font-family="Arial, sans-serif" font-size="32" fill="white" text-anchor="middle" opacity="0.9">Track and Split Expenses</text>
      <text x="640" y="450" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" opacity="0.8">Manage shared finances together</text>
    </svg>
  `);

  await sharp(wideSvg)
    .png()
    .toFile(path.join(outputDir, 'screenshot-wide.png'));
  
  console.log('✅ Generated: screenshot-wide.png (1280x720)');

  // Mobile screenshot
  const mobileSvg = Buffer.from(`
    <svg width="750" height="1334" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="750" height="1334" fill="url(#grad2)"/>
      <text x="375" y="500" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">AAFairShare</text>
      <text x="375" y="580" font-family="Arial, sans-serif" font-size="28" fill="white" text-anchor="middle" opacity="0.9">Track Expenses</text>
      <text x="375" y="640" font-family="Arial, sans-serif" font-size="28" fill="white" text-anchor="middle" opacity="0.9">Split Bills</text>
      <text x="375" y="700" font-family="Arial, sans-serif" font-size="28" fill="white" text-anchor="middle" opacity="0.9">Save Together</text>
      <text x="375" y="800" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle" opacity="0.7">Mobile-optimized expense tracker</text>
    </svg>
  `);

  await sharp(mobileSvg)
    .png()
    .toFile(path.join(outputDir, 'screenshot-mobile.png'));
  
  console.log('✅ Generated: screenshot-mobile.png (750x1334)');

  console.log('\n✨ PWA screenshots generated successfully!\n');
}

generateScreenshots().catch(console.error);
