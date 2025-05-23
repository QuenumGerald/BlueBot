// testPostClippy.js
// Script pour tester la publication d'un post Clippy (texte + image) sur Bluesky

import { postClippyImage } from './postImage.js';

(async () => {
  try {
    console.log('Tentative de publication d’un post Clippy sur Bluesky...');
    await postClippyImage();
    console.log('✅ Post Clippy publié avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la publication du post Clippy :', error);
  }
})();
