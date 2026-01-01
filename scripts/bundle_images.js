const fs = require('fs');
const path = require('path');

const inputDir = path.join(process.cwd(), 'public', 'images', 'ruby');
const outputDir = path.join(process.cwd(), 'src', 'assets');
const outputFile = path.join(outputDir, 'rubyImages.js');

// Create output directory if not exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

try {
    const files = fs.readdirSync(inputDir);
    const imageMap = {};

    files.forEach(file => {
        if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
            const filePath = path.join(inputDir, file);
            const buffer = fs.readFileSync(filePath);
            const ext = path.extname(file).slice(1);
            const base64 = buffer.toString('base64');
            const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

            // Key based on filename without extension (e.g. "01", "05-1"), stripping "_transparent" suffix
            const key = path.parse(file).name.replace('_transparent', '');
            imageMap[key] = `data:${mimeType};base64,${base64}`;
            console.log(`Processed ${file} -> key: ${key}`);
        }
    });

    const content = `export const rubyImages = ${JSON.stringify(imageMap, null, 4)};\n`;

    fs.writeFileSync(outputFile, content);
    console.log(`Successfully generated ${outputFile} with ${Object.keys(imageMap).length} images.`);

} catch (error) {
    console.error('Error generating base64 images:', error);
    process.exit(1);
}
