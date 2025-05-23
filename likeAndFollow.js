// likeAndFollow.js
// Like et follow automatiquement des cibles via l'agent Bluesky

import { agent } from './bluesky.js';

// Fonction utilitaire pour temporiser
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Like 5 posts et follow 5 handles sur Bluesky, avec logs et gestion d'erreur individuelle.
 */
/**
 * Recherche les derniers posts d’un hashtag, like chaque post et follow l’auteur.
 * @param {string} hashtag - Hashtag sans # (ex: 'clippy')
 * @param {number} max - Nombre de posts à traiter (par défaut 5)
 */
export async function likeAndFollowHashtag(hashtag = 'clippy', max = 5) {
  try {
    // Recherche les derniers posts contenant le hashtag
    const res = await agent.app.bsky.feed.searchPosts({ q: `#${hashtag}`, limit: max });
    const posts = res.data.posts || [];
    for (const post of posts) {
      const { uri, cid, author } = post;
      // Like le post (besoin de uri + cid)
      try {
        if (!uri || !cid || !author?.did) throw new Error('Post incomplet (uri/cid/did manquant)');
        const record = {
          $type: 'app.bsky.feed.like',
          subject: { uri, cid },
          createdAt: new Date().toISOString(),
        };
        console.log('[DEBUG] record envoyé à like.create:', JSON.stringify(record));
        await agent.api.com.atproto.repo.createRecord({
          repo: agent.session.did,
          collection: 'app.bsky.feed.like',
          record,
        });
        console.log(`[Like] Succès : ${uri}`);
      } catch (err) {
        console.error(`[Like] Échec : ${uri} ->`, err?.response?.data || err.message);
      }
      // Follow l’auteur (besoin de DID)
      try {
        await agent.follow(author.did);
        console.log(`[Follow] Succès : ${author.handle}`);
      } catch (err) {
        console.error(`[Follow] Échec : ${author.handle} ->`, err?.response?.data || err.message);
      }
      await delay(1000);
    }
  } catch (err) {
    console.error('Erreur lors de la recherche ou du traitement du hashtag :', err?.response?.data || err.message);
  }
}
