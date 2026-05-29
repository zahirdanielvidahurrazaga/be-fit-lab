const sharp = require('sharp');
const fs = require('fs');

async function rotateImage() {
  try {
    await sharp('./public/logo2.png')
      .rotate(-90) // Try rotating 90 degrees counter-clockwise
      .toFile('./public/logo2_rotated.png');
    
    fs.copyFileSync('./public/logo2_rotated.png', './public/logo2.png');
    fs.unlinkSync('./public/logo2_rotated.png');
    console.log("Image rotated successfully.");
  } catch (err) {
    console.error("Error rotating image:", err);
  }
}

rotateImage();
