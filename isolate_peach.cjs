const sharp = require('sharp');

async function processV3() {
  try {
    const input = 'public/v3.png';
    const trimmedBuffer = await sharp(input).trim().toBuffer();
      
    // Save to assets for Capacitor
    await sharp(trimmedBuffer)
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile('assets/icon.png');
      
    // Save to public for web use (AppTour)
    await sharp(trimmedBuffer)
      .toFile('public/favicon_peach.png');
      
    console.log('Processed v3.png as the perfect icon!');
  } catch(e) {
    console.error(e);
  }
}
processV3();
