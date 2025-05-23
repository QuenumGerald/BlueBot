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
    console.log(`[BlazeJob][INFO] Recherche des posts pour le hashtag #${hashtag} (max ${max})`);
    const res = await agent.app.bsky.feed.searchPosts({ q: `#${hashtag}`, limit: max });
    const posts = res.data.posts || [];
    console.log(`[BlazeJob][INFO] ${posts.length} posts trouvés pour #${hashtag}`);
    let count = 0;
    for (const post of posts) {
      count++;
      console.log(`[BlazeJob][INFO] Traitement du post ${count}/${posts.length} (uri: ${post.uri})`);
      const { uri, cid, author } = post;
      // Like le post (besoin de uri + cid)
      try {
        console.log(`[BlazeJob][INFO] Tentative de like pour le post (uri: ${uri})`);
        if (!uri || !cid || !author?.did) throw new Error('Post incomplet (uri/cid/did manquant)');
        const record = {
          $type: 'app.bsky.feed.like',
          subject: { uri, cid },
          createdAt: new Date().toISOString(),
        };
        console.log('[BlazeJob][DEBUG] record envoyé à like.create:', JSON.stringify(record));
        await agent.api.com.atproto.repo.createRecord({
          repo: agent.session.did,
          collection: 'app.bsky.feed.like',
          record,
        });
        console.log(`[BlazeJob][Like] Succès : ${uri}`);
      } catch (err) {
        console.error(`[BlazeJob][Like] Échec : ${uri} ->`, err?.response?.data || err.message);
      }
      // Follow l’auteur (besoin de DID)
      try {
        console.log(`[BlazeJob][INFO] Tentative de follow pour l’auteur (handle: ${author.handle}, did: ${author.did})`);
        await agent.follow(author.did);
        console.log(`[BlazeJob][Follow] Succès : ${author.handle}`);
      } catch (err) {
        console.error(`[BlazeJob][Follow] Échec : ${author.handle} ->`, err?.response?.data || err.message);
      }
      await delay(1000);
    }
    console.log(`[BlazeJob][INFO] Fin du traitement des posts pour #${hashtag}`);
  } catch (err) {
    console.error('[BlazeJob] Erreur lors de la recherche ou du traitement du hashtag :', err?.response?.data || err.message);
  }
}
