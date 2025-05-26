// testGenerateImage.js
// Test simple de génération d'image Clippy via Hugging Face

import { generateClippyImage } from './generateImage.js';
import fs from 'fs';

const prompt = `Photorealistic digital illustration of the EXACT Microsoft Office Assistant Clippy in a modern blockchain/crypto setting with subtle blockchain elements in the background (like a bitcoin logo or crypto chart). Clippy is a THIN METAL PAPERCLIP character with EXACTLY two large oval eyes (black pupils with white surrounding), bent in the classic paperclip shape with the top part forming a rounded triangle like an eyebrow. The paperclip is SHINY SILVER/METALLIC and has a thin wire body. EXTREMELY IMPORTANT: Clippy must be IMMEDIATELY RECOGNIZABLE as the original Office Assistant, with the exact right proportions and shape of a thin paperclip - NOT bulky, NOT a refrigerator, NOT a thick shape. NO text. NO human features except the eyes. NO extra limbs. Style: clean, professional digital art with good lighting.`;

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
