// postImage.js
// Publie un post Clippy avec image sur Bluesky en combinant les modules internes

import { initBluesky, uploadImageToBluesky } from './bluesky.js';
import { agent } from './bluesky.js';
import { generateClippyImage } from './generateImage.js';
import { generatePostText, generateTrombonePostText } from './generateText.js';

/**
 * Publie un post "trombone à la plage/retraite" avec image sur Bluesky.
 */
export async function postTromboneImage() {
  try {
    console.log('[Bluesky] Initialisation et authentification...');
    await initBluesky();

    console.log('[Texte] Génération du texte du post...');
    const text = await generateTrombonePostText();
    console.log(`[Texte] Texte généré : ${text}`);

    // Prompt image basé sur le texte généré
    // Liste de scènes influenceur pour Clippy
// Scènes pour Clippy reflétant sa reconversion dans la blockchain
const influencerScenes = [
  "at a blockchain conference, classic Microsoft Clippy design with big eyes, near a crypto logo",
  "on a yacht with sunglasses, authentic Microsoft Office assistant character with a tiny hardware wallet",
  "next to a crypto trading screen, classic paperclip assistant from Microsoft Office",
  "at a Web3 meetup, original Clippy design with a subtle ethereum logo nearby",
  "with a smartphone showing a crypto app, classic Office assistant character with large eyes",
  "streaming a blockchain tutorial, original Microsoft paperclip assistant",
  "in a modern tech office with blockchain posters, authentic Office Clippy design",
  "wearing a tiny crypto-themed bowtie, classic Microsoft Office paperclip",
  "at a crypto event holding a tiny bitcoin, authentic Clippy design",
  "next to a computer screen showing crypto charts, original Microsoft Office assistant"
];

const randomScene = influencerScenes[Math.floor(Math.random() * influencerScenes.length)];

// Prompt ultra-précis avec description détaillée de Clippy
const imagePrompt = `Photorealistic digital illustration of the EXACT Microsoft Office Assistant Clippy. Clippy is a THIN METAL PAPERCLIP character with EXACTLY two large oval eyes (black pupils with white surrounding), bent in the classic paperclip shape with the top part forming a rounded triangle like an eyebrow. The paperclip is SHINY SILVER/METALLIC and has a thin wire body. ${randomScene}. EXTREMELY IMPORTANT: Clippy must be IMMEDIATELY RECOGNIZABLE as the original Office Assistant, with the exact right proportions and shape of a thin paperclip - NOT bulky, NOT a refrigerator, NOT a thick shape. NO text. NO human features except the eyes. NO extra limbs. Style: clean, professional digital art with good lighting.`;

    console.log('[BlazeJob][Image] Génération de l’image trombone...');
console.log(`[BlazeJob][Image] Prompt utilisé : ${imagePrompt}`);
    let imageBuffer = await generateClippyImage(imagePrompt);
    console.log(`[Image] Image générée. Taille: ${(imageBuffer.length / 1024).toFixed(2)}KB`);

    // Vérification de la taille du fichier (max 900KB pour être largement sûr)
    const BLUESKY_SIZE_LIMIT = 900 * 1024; // 900KB, bien en dessous de la limite de 976KB
    
    if (imageBuffer.length > BLUESKY_SIZE_LIMIT) {
      console.log(`[Image] Taille de l'image trop grande (${(imageBuffer.length / 1024).toFixed(2)}KB), redimensionnement...`);
      // Utilisation de sharp pour redimensionner
      const sharp = await import('sharp');
      
      // Première tentative : réduction de taille avec qualité 80%
      let resizedBuffer = await sharp.default(imageBuffer)
        .resize({ width: 900, withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer();
      
      // Si encore trop grand, réessayer avec qualité 70%
      if (resizedBuffer.length > BLUESKY_SIZE_LIMIT) {
        console.log(`[Image] Toujours trop grande (${(resizedBuffer.length / 1024).toFixed(2)}KB), réduction supplémentaire...`);
        resizedBuffer = await sharp.default(resizedBuffer)
          .resize({ width: 800 })
          .jpeg({ quality: 70, mozjpeg: true })
          .toBuffer();
      }
      
      // Vérification finale et réduction drastique si nécessaire
      if (resizedBuffer.length > BLUESKY_SIZE_LIMIT) {
        console.log(`[Image] Dernier recours (${(resizedBuffer.length / 1024).toFixed(2)}KB), réduction maximale...`);
        resizedBuffer = await sharp.default(resizedBuffer)
          .resize({ width: 700 })
          .jpeg({ quality: 60, mozjpeg: true })
          .toBuffer();
      }
      
      imageBuffer = resizedBuffer;
      console.log(`[Image] Taille finale après redimensionnement: ${(imageBuffer.length / 1024).toFixed(2)}KB`);
    }

    console.log('[Bluesky] Upload de l\'image sur Bluesky...');
    const blob = await uploadImageToBluesky(imageBuffer);
    console.log('[Bluesky] Publication du post...');
    await agent.post({
      text,
      embed: {
        $type: 'app.bsky.embed.images',
        images: [
          {
            image: blob,
            alt: 'Retired paperclip cartoon at the beach',
          },
        ],
      },
    });
    console.log('[BlazeJob][Succès] Post trombone publié sur Bluesky !');
  } catch (error) {
    console.error('[BlazeJob][Erreur] Échec lors de la publication du post trombone :', error?.response?.data || error.message);
    throw error;
  }
}

/**
 * Publie un post Clippy avec image sur Bluesky.
 */
export async function postClippyImage() {
  try {
    console.log('[Bluesky] Initialisation et authentification...');
    await initBluesky();

    console.log('[Texte] Génération du texte du post...');
    const text = await generatePostText();
    console.log(`[Texte] Texte généré : ${text}`);

    // Utilise un prompt d'image standard et constant au lieu du texte généré
    // pour éviter les problèmes d'incohérence et les images bizarres
    const imagePrompt = `Photorealistic digital illustration of the EXACT Microsoft Office Assistant Clippy in a modern blockchain/crypto setting with subtle blockchain elements in the background (like a bitcoin logo or crypto chart). Clippy is a THIN METAL PAPERCLIP character with EXACTLY two large oval eyes (black pupils with white surrounding), bent in the classic paperclip shape with the top part forming a rounded triangle like an eyebrow. The paperclip is SHINY SILVER/METALLIC and has a thin wire body. EXTREMELY IMPORTANT: Clippy must be IMMEDIATELY RECOGNIZABLE as the original Office Assistant, with the exact right proportions and shape of a thin paperclip - NOT bulky, NOT a refrigerator, NOT a thick shape. NO text. NO human features except the eyes. NO extra limbs. Style: clean, professional digital art with good lighting.`;
    
    console.log('[Image] Génération de l’image Clippy...');
    console.log(`[Image] Prompt utilisé : ${imagePrompt}`);
    const imageBuffer = await generateClippyImage(imagePrompt);
    console.log('[Image] Image générée.');

    console.log('[Bluesky] Upload de l’image sur Bluesky...');
    const blob = await uploadImageToBluesky(imageBuffer);
    console.log(`[Bluesky] Blob ID : ${blob}`);

    console.log('[Bluesky] Publication du post...');
    await agent.post({
      text,
      embed: {
        $type: 'app.bsky.embed.images',
        images: [
          {
            image: blob,
            alt: 'Clippy Meme',
          },
        ],
      },
    });
    console.log('[Succès] Post Clippy publié sur Bluesky !');
  } catch (error) {
    console.error('[Erreur] Échec lors de la publication du post Clippy :', error?.response?.data || error.message);
    throw error;
  }
}
