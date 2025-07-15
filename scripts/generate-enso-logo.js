const fs = require('fs');
const { createCanvas } = require('canvas');

// Create Enso logo in different sizes and colors
function createEnsoLogo(size, color, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Clear canvas
  ctx.clearRect(0, 0, size, size);
  
  // Set up the enso circle
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35;
  const strokeWidth = size * 0.06;
  
  // Rotate the circle
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(-Math.PI / 4);
  ctx.translate(-centerX, -centerY);
  
  // Draw the main enso circle (incomplete circle)
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0.3, 2 * Math.PI - 0.5);
  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.stroke();
  
  // Add a slightly thinner overlay for texture
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0.3, 2 * Math.PI - 0.5);
  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth * 0.85;
  ctx.globalAlpha = 0.3;
  ctx.stroke();
  
  ctx.restore();
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Created ${filename}`);
}

// Generate logos
createEnsoLogo(512, '#1a1a1a', './src/assets/Logo.png');
createEnsoLogo(64, '#000000', './src/assets/KoanBlackSmall.png');
createEnsoLogo(64, '#ffffff', './src/assets/KoanWhiteSmall.png');

console.log('Enso logos generated successfully!');