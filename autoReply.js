// autoReply.js
// Répond automatiquement aux 10 derniers posts #CLIPPY avec une réponse IA

import { agent, initBluesky } from './bluesky.js';
import { generateReplyText } from './generateText.js';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Recherche les 10 derniers posts #CLIPPY et y répond de façon IA
 */
export async function autoReply() {
  let timeline;
  try {
    // Authentifie l'agent Bluesky avant toute requête
    await initBluesky();
    // Liste de hashtags populaires à cibler
    const hashtags = ['crypto', 'tech', 'blockchain', 'web3', 'windows', 'clippy'];
    const allPosts = [];
    if (!agent.session || !agent.session.did) {
      console.error('[ERREUR] L’agent Bluesky n’est pas authentifié. Vérifiez vos identifiants et la connexion.');
      return;
    }
    for (const hashtag of hashtags) {
      console.log(`[Recherche] Récupération des 10 derniers posts #${hashtag}`);
      // Nouvelle méthode : searchPosts
      const res = await agent.app.bsky.feed.searchPosts({ q: `#${hashtag}`, limit: 10 });
      if (res && Array.isArray(res.data.posts)) {
        allPosts.push(...res.data.posts);
      }
    }
    // Supprime les doublons de posts (par uri)
    const uniquePosts = Array.from(new Map(allPosts.map(p => [p.uri, p])).values());
    if (uniquePosts.length === 0) {
      console.warn('[INFO] Aucun post trouvé pour les hashtags ciblés.');
      return;
    }
    // Récupère le handle du bot pour ne pas répondre à soi-même
    const myHandle = agent.session?.handle;
    console.log(`[DEBUG] Nombre de posts uniques récupérés : ${uniquePosts.length}`);
    const MAX_REPLIES = 10;
    let repliedCount = 0;
    for (const post of uniquePosts) {
      const { uri, author, record } = post;
      const text = record?.text;
      // Ne répondre qu'aux posts en anglais
      const langs = record?.langs;
      if (!langs || !langs.includes('en')) {
        console.log(`[IGNORÉ] Post ignoré (langue non-anglaise): langs=${JSON.stringify(langs)}, uri=${uri}`);
        continue;
      }
      try {
        console.log(`[Réponse] Génération d’une réponse à : ${text}`);
        const reply = await generateReplyText(text);
        console.log(`[Réponse] Réponse générée : ${reply}`);
        await agent.post({
          reply: {
            root: { cid: post.cid, uri: post.uri },
            parent: { cid: post.cid, uri: post.uri }
          },
          text: reply,
        });
        repliedCount++;
        console.log(`[Succès] Répondu à ${uri}`);
      } catch (error) {
        console.error(`[Erreur] Échec lors de la réponse à ${uri} :`, error?.response?.data || error.message);
      }
      await delay(10000);
      if (repliedCount >= MAX_REPLIES) {
        console.log(`[INFO] Limite de ${MAX_REPLIES} réponses atteinte, arrêt de la boucle.`);
        break;
      }
    }
    console.log(`[DEBUG] Nombre total de réponses postées : ${repliedCount}`);
    console.log(`[INFO] Le bot a répondu à ${repliedCount} message(s) sur ${uniquePosts.length} posts uniques récupérés.`);
  }
  catch (error) {
    console.error('[Erreur][autoReply] Erreur globale dans autoReply :', error?.response?.data || error.message);
  }
}

// Exécute autoReply() si ce fichier est lancé directement (compat ES module)
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('[INFO] Script lancé directement, démarrage autoReply()');
  autoReply();
}
