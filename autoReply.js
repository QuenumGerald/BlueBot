// autoReply.js
// Répond automatiquement aux 10 derniers posts #CLIPPY avec une réponse IA

import { agent } from './bluesky.js';
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
    console.log('[Recherche] Récupération des 10 derniers posts #CLIPPY...');
    timeline = await agent.getTimeline({ feed: 'hashtag', hashtag: 'CLIPPY', limit: 10 });
  } catch (error) {
    console.error('[Erreur] Échec lors de la récupération du timeline :', error?.response?.data || error.message);
    return;
  }

  if (!timeline || !Array.isArray(timeline.posts)) {
    console.error('[Erreur] Format inattendu du timeline.');
    return;
  }

  for (const post of timeline.posts) {
    const { text, uri } = post;
    try {
      console.log(`[Réponse] Génération d’une réponse à : ${text}`);
      const reply = await generateReplyText(text);
      console.log(`[Réponse] Réponse générée : ${reply}`);
      await agent.post({
        reply: { root: uri, parent: uri },
        text: reply,
      });
      console.log(`[Succès] Répondu à ${uri}`);
    } catch (error) {
      console.error(`[Erreur] Échec lors de la réponse à ${uri} :`, error?.response?.data || error.message);
    }
    await delay(2000);
  }
}
