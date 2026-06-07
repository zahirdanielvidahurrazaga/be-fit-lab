const sharp = require('sharp');

async function processUserPeach() {
  try {
    const input = 'Logo/logo solo durazno.png';
    // Trim any excess transparent padding the user might have left
    const trimmedBuffer = await sharp(input).trim().toBuffer();
      
    // Save to assets for Capacitor, sized to 1024x1024 to fill the safe area
    await sharp(trimmedBuffer)
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile('assets/icon.png');
      
    // Save to public for web use (AppTour)
    await sharp(trimmedBuffer)
      .toFile('public/favicon_peach.png');
      
    console.log('Processed user peach logo perfectly!');
  } catch(e) {
    console.error(e);
  }
}
processUserPeach();
