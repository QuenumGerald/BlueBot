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
const influencerScenes = [
  "taking a selfie with fans at a tech conference",
  "recording a funny TikTok dance on the beach",
  "posing with a luxury sports car (paperclip-sized)",
  "enjoying avocado toast at a trendy café",
  "unboxing the latest smartphone for a YouTube review",
  "hosting a live Q&A stream with followers",
  "traveling in first class on a plane (window selfie)",
  "showing off a new designer outfit (paperclip fashion)",
  "filming a sponsored skincare routine video",
  "meeting other meme celebrities at an award show",
  "making a motivational post about productivity hacks",
  "at a crypto event, holding a sign #Web3",
  "posting a gym selfie: 'Paperclip gains'",
  "doing a collab with a famous AI robot",
  "sharing a behind-the-scenes look at content creation"
];
const randomScene = influencerScenes[Math.floor(Math.random() * influencerScenes.length)];
const imagePrompt = `Cartoon drawing of a paperclip character (like Clippy from Microsoft Office), as a social media influencer, ${randomScene}. Style: bright, fun, digital art. ${text}`;

    console.log('[Image] Génération de l’image trombone...');
    const imageBuffer = await generateClippyImage(imagePrompt);
    console.log('[Image] Image générée.');

    console.log('[Bluesky] Upload de l’image sur Bluesky...');
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
    console.log('[Succès] Post trombone publié sur Bluesky !');
  } catch (error) {
    console.error('[Erreur] Échec lors de la publication du post trombone :', error?.response?.data || error.message);
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

    console.log('[Image] Génération de l’image Clippy...');
    const imageBuffer = await generateClippyImage(text);
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
