const sharp = require('sharp');
const fs = require('fs');

async function processIcon() {
  const inputPath = 'assets/icon.png';
  const backupPath = 'assets/icon_backup.png';

  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(inputPath, backupPath);
    console.log('Backup created at', backupPath);
  }

  try {
    // Read the image, trim the transparent borders, and resize/pad it slightly so it looks good
    // Capacitor recommends 1024x1024 minimum for icons
    await sharp(backupPath)
      .trim() // removes transparent padding automatically
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 } // transparent background
      })
      .toFile(inputPath);
    
    console.log('Successfully trimmed and resized assets/icon.png to 1024x1024.');
  } catch (err) {
    console.error('Error processing icon:', err);
  }
}

processIcon();
