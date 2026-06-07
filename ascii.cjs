const sharp = require('sharp');

async function asciiArt() {
  const files = ['public/v1.png', 'public/v2.png', 'public/v3.png', 'public/v4.png'];
  for (const file of files) {
    console.log('--- ' + file + ' ---');
    const buf = await sharp(file)
      .resize(40, 20) // resize smaller for quick look
      .raw()
      .toBuffer();
      
    let str = '';
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 40; x++) {
        const idx = (y * 40 + x) * 4;
        const a = buf[idx+3];
        str += (a > 128) ? '#' : '.';
      }
      str += '\n';
    }
    console.log(str);
  }
}
asciiArt();
