// testAutoReply.js
// Teste la récupération et l'affichage des posts pour autoReply sans poster de réponse

import { agent } from './bluesky.js';

(async () => {
  try {
    const hashtags = ['memecoin', 'crypto', 'ai', 'tech', 'nft'];
    const allPosts = [];
    for (const hashtag of hashtags) {
      console.log(`[TEST] Récupération des 10 derniers posts #${hashtag}`);
      const res = await agent.getTimeline({ feed: 'hashtag', hashtag, limit: 10 });
      if (res && Array.isArray(res.posts)) {
        console.log(`[TEST] #${hashtag} : ${res.posts.length} posts trouvés`);
        for (const post of res.posts) {
          console.log(`[TEST] Post: uri=${post.uri}, auteur=${post.author?.handle}, texte="${post.text?.slice(0,60)}..."`);
        }
        allPosts.push(...res.posts);
      } else {
        console.log(`[TEST] #${hashtag} : Aucun post trouvé ou mauvais format`);
      }
    }
    const uniquePosts = Array.from(new Map(allPosts.map(p => [p.uri, p])).values());
    console.log(`[TEST] Nombre total de posts uniques sur tous les hashtags : ${uniquePosts.length}`);
  } catch (err) {
    console.error('[TEST][Erreur] :', err?.response?.data || err.message);
  }
})();
