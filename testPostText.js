// testPostText.js
// Script pour tester la publication d'un post texte Clippy sur Bluesky

import { initBluesky } from './bluesky.js';
import { agent } from './bluesky.js';
import { generatePostText } from './generateText.js';

(async () => {
  try {
    console.log('Connexion et authentification Bluesky...');
    await initBluesky();
    console.log('Génération du texte du post Clippy...');
    const text = await generatePostText();
    console.log('Texte généré :', text);
    console.log('Publication du post texte sur Bluesky...');
    await agent.post({ text });
    console.log('✅ Post texte Clippy publié avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la publication du post texte Clippy :', error);
  }
})();
