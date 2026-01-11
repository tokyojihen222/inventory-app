const fs = require('fs');
const path = require('path');

const imagePath = path.join(process.cwd(), 'src', 'assets', 'ruby_main.png');
const outputPath = path.join(process.cwd(), 'src', 'app', 'login', 'rubyBase64.js');

try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = 'image/png';
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    const content = `export const rubyBase64 = "${dataUrl}";\n`;

    fs.writeFileSync(outputPath, content);
    console.log('Successfully generated rubyBase64.js');
} catch (error) {
    console.error('Error generating base64:', error);
    process.exit(1);
}
