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
// Scènes plus précises pour Clippy
const influencerScenes = [
  "taking a selfie at a tech conference, classic Microsoft Clippy design with big eyes",
  "on a beach with sunglasses, authentic Microsoft Office assistant character",
  "next to a tiny toy sports car, classic paperclip assistant from Microsoft Office",
  "at a trendy café with a small coffee cup, original Clippy design",
  "with a smartphone, classic Office assistant character with large eyes",
  "streaming from a computer, original Microsoft paperclip assistant",
  "in business class seat, authentic Office Clippy design",
  "wearing a tiny bowtie, classic Microsoft Office paperclip",
  "at a crypto event with a small sign, authentic Clippy design",
  "next to a computer screen, original Microsoft Office assistant"
];

const randomScene = influencerScenes[Math.floor(Math.random() * influencerScenes.length)];

// Prompt amélioré avec des contraintes précises pour obtenir un Clippy authentique
const imagePrompt = `High-quality digital illustration of the original Microsoft Office Assistant Clippy (the paperclip character) ${randomScene}. IMPORTANT: Clippy must have EXACTLY two eyes, the classic bent paperclip shape, and correct proportions. NO human features except eyes. NO extra limbs. NO TEXT OR WORDS IN THE IMAGE. Style: clean, professional digital art with good lighting.`;

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
    const imagePrompt = `High-quality digital illustration of the original Microsoft Office Assistant Clippy (the paperclip character) in a professional setting. IMPORTANT: Clippy must have EXACTLY two eyes, the classic bent paperclip shape, and correct proportions. NO human features except eyes. NO extra limbs. NO TEXT OR WORDS IN THE IMAGE. Style: clean, professional digital art with good lighting.`;
    
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
