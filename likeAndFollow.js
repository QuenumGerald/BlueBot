// likeAndFollow.js
// Like et follow automatiquement des cibles via l'agent Bluesky

import { agent } from './bluesky.js';
import fs from 'fs';

const LIKE_HISTORY_FILE = './like-history.json';
const MAX_LIKE_HISTORY_DAYS = 10;

function loadLikeHistory() {
  try {
    if (fs.existsSync(LIKE_HISTORY_FILE)) {
      const data = fs.readFileSync(LIKE_HISTORY_FILE, 'utf8');
      const history = JSON.parse(data);
      // Nettoyage: supprime les entrées trop vieilles
      const now = Date.now();
      const maxAge = MAX_LIKE_HISTORY_DAYS * 24 * 60 * 60 * 1000;
      for (const did of Object.keys(history)) {
        if (now - history[did] > maxAge) {
          delete history[did];
        }
      }
      return history;
    }
  } catch (e) { console.error('[LikeHistory] Erreur chargement:', e); }
  return {};
}

function saveLikeHistory(history) {
  try { fs.writeFileSync(LIKE_HISTORY_FILE, JSON.stringify(history, null, 2)); }
  catch (e) { console.error('[LikeHistory] Erreur sauvegarde:', e); }
}


// Fonction utilitaire pour temporiser
export function delay(ms) {
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
// Limites recommandées Bluesky :
// - Pas plus de 30 likes/heure (max 200/jour)
// - delayMs >= 3000 ms (3 secondes)
// - max <= 10-15 par run si scheduler toutes les 20-30 min
export async function likeAndFollowHashtag(hashtag = 'clippy', max = 10, delayMs = 3000) {
  try {
    // Recherche les derniers posts contenant le hashtag
    console.log(`[BlazeJob][INFO] Recherche des posts pour le hashtag #${hashtag} (max ${max})`);
    const res = await agent.app.bsky.feed.searchPosts({ q: `#${hashtag}`, limit: max });
    const posts = res.data.posts || [];
    console.log(`[BlazeJob][INFO] ${posts.length} posts trouvés pour #${hashtag}`);
    let count = 0;
    // Chargement de l'historique des likes
    const likeHistory = loadLikeHistory();
    for (const post of posts) {
      count++;
      const { uri, cid, author } = post;
      if (!author?.did) continue;
      // Ne jamais liker deux fois le même compte (sur la période)
      if (likeHistory[author.did]) {
        console.log(`[BlazeJob][Like] Ignoré : déjà liké ce compte (${author.did}) récemment.`);
        continue;
      }
      console.log(`[BlazeJob][INFO] Traitement du post ${count}/${posts.length} (uri: ${post.uri})`);
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
        // Ajoute le compte à l'historique des likes
        likeHistory[author.did] = Date.now();
        saveLikeHistory(likeHistory);
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
      await delay(delayMs);
    }
    console.log(`[BlazeJob][INFO] Fin du traitement des posts pour #${hashtag}`);
  } catch (err) {
    console.error('[BlazeJob] Erreur lors de la recherche ou du traitement du hashtag :', err?.response?.data || err.message);
  }
}
