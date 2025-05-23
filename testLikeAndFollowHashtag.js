// testLikeAndFollowHashtag.js
import { initBluesky } from './bluesky.js';
import { likeAndFollowHashtag } from './likeAndFollow.js';

(async () => {
  try {
    console.log('Connexion et authentification Bluesky...');
    await initBluesky();
    console.log('Recherche et engagement sur #clippy...');
    await likeAndFollowHashtag('clippy', 5); // hashtag et nombre de posts à traiter
    console.log('✅ Like & follow hashtag terminés !');
  } catch (err) {
    console.error('❌ Erreur like & follow hashtag :', err);
  }
})();
