const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create a 512x512 canvas for the logo
function createHanzoLogo(color) {
  const canvas = createCanvas(512, 512);
  const ctx = canvas.getContext('2d');
  
  // Clear canvas
  ctx.clearRect(0, 0, 512, 512);
  
  // Set up gradient
  const gradient = ctx.createLinearGradient(0, 0, 512, 512);
  gradient.addColorStop(0, color === 'black' ? '#1a1a1a' : '#ffffff');
  gradient.addColorStop(1, color === 'black' ? '#333333' : '#f0f0f0');
  
  // Draw stylized H
  ctx.fillStyle = gradient;
  ctx.beginPath();
  
  // Left vertical bar
  ctx.moveTo(128, 96);
  ctx.lineTo(192, 96);
  ctx.lineTo(192, 224);
  ctx.lineTo(320, 224);
  ctx.lineTo(320, 96);
  ctx.lineTo(384, 96);
  ctx.lineTo(384, 416);
  ctx.lineTo(320, 416);
  ctx.lineTo(320, 288);
  ctx.lineTo(192, 288);
  ctx.lineTo(192, 416);
  ctx.lineTo(128, 416);
  ctx.closePath();
  
  ctx.fill();
  
  // Add subtle shadow
  if (color === 'white') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.save();
    ctx.translate(4, 4);
    ctx.beginPath();
    ctx.moveTo(128, 96);
    ctx.lineTo(192, 96);
    ctx.lineTo(192, 224);
    ctx.lineTo(320, 224);
    ctx.lineTo(320, 96);
    ctx.lineTo(384, 96);
    ctx.lineTo(384, 416);
    ctx.lineTo(320, 416);
    ctx.lineTo(320, 288);
    ctx.lineTo(192, 288);
    ctx.lineTo(192, 416);
    ctx.lineTo(128, 416);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  
  return canvas;
}

// Create small versions (64x64)
function createSmallLogo(color) {
  const canvas = createCanvas(64, 64);
  const ctx = canvas.getContext('2d');
  
  // Clear canvas
  ctx.clearRect(0, 0, 64, 64);
  
  // Set color
  ctx.fillStyle = color === 'black' ? '#1a1a1a' : '#ffffff';
  
  // Draw simplified H
  ctx.beginPath();
  ctx.moveTo(16, 12);
  ctx.lineTo(24, 12);
  ctx.lineTo(24, 28);
  ctx.lineTo(40, 28);
  ctx.lineTo(40, 12);
  ctx.lineTo(48, 12);
  ctx.lineTo(48, 52);
  ctx.lineTo(40, 52);
  ctx.lineTo(40, 36);
  ctx.lineTo(24, 36);
  ctx.lineTo(24, 52);
  ctx.lineTo(16, 52);
  ctx.closePath();
  ctx.fill();
  
  return canvas;
}

// Generate the logos
const assetsDir = path.join(__dirname, '..', 'src', 'assets');

// Create small logos
const blackSmall = createSmallLogo('black');
const whiteSmall = createSmallLogo('white');

// Save the files
fs.writeFileSync(
  path.join(assetsDir, 'HanzoBlackSmall.png'),
  blackSmall.toBuffer('image/png')
);

fs.writeFileSync(
  path.join(assetsDir, 'HanzoWhiteSmall.png'),
  whiteSmall.toBuffer('image/png')
);

// Also create a main Logo.png replacement
const mainLogo = createHanzoLogo('black');
fs.writeFileSync(
  path.join(assetsDir, 'Logo.png'),
  mainLogo.toBuffer('image/png')
);

console.log('Hanzo logos generated successfully!');