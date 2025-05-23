// testBlueskySearch.js
// Teste la recherche de posts par hashtag avec @atproto/api

import { agent, initBluesky } from './bluesky.js';

(async () => {
  try {
    await initBluesky();
    const hashtags = ['memecoin', 'crypto', 'ai', 'tech', 'nft'];
    for (const hashtag of hashtags) {
      console.log(`[TEST] Recherche de posts contenant #${hashtag}`);
      // Utilisation de searchPosts (méthode standard de l'API)
      const res = await agent.app.bsky.feed.searchPosts({ q: `#${hashtag}`, limit: 10 });
      if (res && Array.isArray(res.data.posts)) {
        console.log(`[TEST] #${hashtag} : ${res.data.posts.length} posts trouvés`);
        if (res.data.posts.length > 0) {
          console.log('[TEST] Premier post (structure complète):', JSON.stringify(res.data.posts[0], null, 2));
        }
        for (const post of res.data.posts) {
          const postText = post.record?.text;
          console.log(`[TEST] Post: uri=${post.uri}, auteur=${post.author?.handle}, texte="${postText?.slice(0,60)}..."`);
        }
      } else {
        console.log(`[TEST] #${hashtag} : Aucun post trouvé ou mauvais format`);
      }
    }
  } catch (err) {
    console.error('[TEST][Erreur] :', err?.response?.data || err.message);
  }
})();
