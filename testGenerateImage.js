// testGenerateImage.js
// Test simple de génération d'image Clippy via Hugging Face

import { generateClippyImage } from './generateImage.js';
import fs from 'fs';

const prompt = "Clippy as a futuristic AI meme, vibrant colors, 4k";

(async () => {
  try {
    console.log('Génération de l’image Clippy...');
    const buffer = await generateClippyImage(prompt);
    fs.writeFileSync('clippy-test.png', buffer);
    console.log('Image générée et sauvegardée sous clippy-test.png');
  } catch (error) {
    console.error('Erreur lors du test de génération d’image :', error);
  }
})();
