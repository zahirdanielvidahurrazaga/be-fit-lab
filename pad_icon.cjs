const sharp = require('sharp');

async function fixIcon() {
  try {
    const input = 'Logo/logo solo durazno.png';
    // 1. Trim the image to get exactly the bounding box of the peach
    const trimmed = await sharp(input).trim().toBuffer();
      
    // 2. For Android App Icon: 
    // Capacitor requires 1024x1024. Adaptive icons mask the outer 1/6th on all sides.
    // The safe area is about 682x682. We'll make the logo 600x600 to be perfectly safe.
    await sharp(trimmed)
      .resize(600, 600, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 } // transparent
      })
      .extend({
        top: 212,
        bottom: 212,
        left: 212,
        right: 212,
        background: { r: 255, g: 255, b: 255, alpha: 0 } // transparent padding to reach 1024x1024
      })
      .toFile('assets/icon.png');
      
    // 3. For the Web App (AppTour):
    // Just a nicely cropped, square version so objectFit='contain' works perfectly.
    await sharp(trimmed)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile('public/favicon_peach.png');
      
    console.log('Icon perfectly centered and sized!');
  } catch(e) {
    console.error(e);
  }
}
fixIcon();
