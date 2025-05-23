// testLikeAndFollow.js
import { initBluesky } from './bluesky.js';
import { likeAndFollow } from './likeAndFollow.js';

(async () => {
  try {
    console.log('Connexion et authentification Bluesky...');
    await initBluesky();
    console.log('Démarrage du like & follow...');
    await likeAndFollow();
    console.log('✅ Like & follow terminés !');
  } catch (err) {
    console.error('❌ Erreur like & follow :', err);
  }
})();
