// autoReply.js
// Répond automatiquement aux 10 derniers posts #CLIPPY avec une réponse IA

import { agent, initBluesky } from './bluesky.js';
import { generateReplyText } from './generateText.js';
import fs from 'fs';
import path from 'path';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Gestion de l'historique des utilisateurs déjà contactés
const HISTORY_FILE = './reply-history.json';
const MAX_HISTORY_DAYS = 14; // Durée en jours pendant laquelle on ne recontacte pas quelqu'un 

/**
 * Charge l'historique des réponses (utilisateurs et posts)
 * @returns {Object} Un objet avec les propriétés users et posts
 */
function loadReplyHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf8');
      const history = JSON.parse(data);

      // Assure la compatibilité avec l'ancien format
      if (!history.users || !history.posts) {
        // Convertit l'ancien format au nouveau format
        const oldUsers = {};
        Object.keys(history).forEach(key => {
          if (key !== 'users' && key !== 'posts') {
            oldUsers[key] = history[key];
          }
        });

        return {
          users: oldUsers,
          posts: {}
        };
      }

      return history;
    }
  } catch (error) {
    console.error('[Historique] Erreur lors du chargement de l\'historique:', error.message);
  }

  // Retourne une structure vide avec users et posts
  return {
    users: {},
    posts: {}
  };
}

/**
 * Sauvegarde l'historique des réponses (utilisateurs et posts)
 * @param {Object} history Un objet avec les propriétés users et posts
 */
function saveReplyHistory(history) {
  try {
    // Assure que la structure est correcte
    if (!history.users) history.users = {};
    if (!history.posts) history.posts = {};

    // Nettoie l'historique en supprimant les entrées trop anciennes
    const now = Date.now();
    const maxAge = MAX_HISTORY_DAYS * 24 * 60 * 60 * 1000; // Convertit jours en ms

    // Nettoie les utilisateurs
    Object.keys(history.users).forEach(did => {
      if (now - history.users[did] > maxAge) {
        delete history.users[did];
      }
    });

    // Nettoie les posts
    Object.keys(history.posts).forEach(uri => {
      if (now - history.posts[uri] > maxAge) {
        delete history.posts[uri];
      }
    });

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
  } catch (error) {
    console.error('[Historique] Erreur lors de la sauvegarde de l\'historique:', error.message);
  }
}

/**
 * Vérifie si on a déjà répondu à un utilisateur ou à un post spécifique
 * @param {string} did DID de l'utilisateur à vérifier
 * @param {string} uri URI du post à vérifier
 * @param {Object} history Historique des réponses
 * @returns {boolean} true si on a déjà répondu récemment à cet utilisateur ou à ce post
 */
function hasRepliedRecently(did, uri, history) {
  // Vérifie si on a déjà répondu à cet utilisateur récemment
  if (history.users && history.users[did]) {
    return true;
  }

  // Vérifie si on a déjà répondu à ce post spécifique
  if (history.posts && history.posts[uri]) {
    return true;
  }

  return false;
}

/**
 * Recherche les 10 derniers posts #CLIPPY et y répond de façon IA
 */
export async function autoReply() {
  let timeline;
  try {
    // Charge l'historique des réponses
    const replyHistory = loadReplyHistory();

    // Limite différente selon le mode (test ou production)
    const isTest = process.env.NODE_ENV === 'test';
    // Limite recommandée Bluesky :
    // - Pas plus de 100-200 replies/jour
    // - MAX_REPLIES_PER_RUN = 10 si scheduler toutes les 20-30 min
    const MAX_REPLIES_PER_RUN = 10; // Limite adaptée pour éviter le spam
    // Authentifie l'agent Bluesky avant toute requête
    await initBluesky();
    // Termes de recherche pour trouver des posts intéressants (sans hashtags)
    const searchTerms = [
      // Termes généraux de base
      'bitcoin', 'ethereum', 'blockchain', 'tech', 'clippy',

      // Termes Bitcoin spécifiques et techniques
      'satoshi nakamoto', 'hal finney', 'lightning network',
      'segwit', 'bitcoin halving', 'UTXO', 'proof of work',
      'bitcoin mining difficulty', 'bitcoin mempool', 'taproot upgrade',

      // Termes Ethereum spécifiques et techniques
      'gavin wood', 'polkadot founder',
      'ethereum merge', 'solidity', 'ERC-20', 'EIP-1559', 'optimistic rollups',
      'layer 2 scaling', 'serenity upgrade', 'casper protocol',

      // Termes blockchain spécifiques et techniques
      'zero knowledge proofs', 'merkle tree', 'consensus algorithm',
      'delegated proof of stake', 'sharding implementation',
      'blockchain interoperability', 'atomic swap', 'chainlink oracle',
      'decentralized identity', 'evm compatibility',

      // Termes tech spécifiques et profonds
      'arm64 architecture', 'RISC processor', 'quantum computing',
      'neural network optimization', 'IPv6 transition', 'WebAssembly',
      'microservice architecture', 'TensorFlow implementation',
      'CUDA parallel computing', 'serverless deployment',

      // Termes Clippy et technologie rétro spécifiques
      'leanne ruzsa-atkinson',
      'kevan atkinson clippy', 'BonziBuddy purple gorilla', 'microsoft bob interface',
      'windows 95 release', 'windows NT kernel', 'internet explorer 6 quirks', 'MS-DOS commands'
    ];

    const allPosts = [];
    if (!agent.session || !agent.session.did) {
      console.error('[ERREUR] L’agent Bluesky n’est pas authentifié. Vérifiez vos identifiants et la connexion.');
      return;
    }

    for (const term of searchTerms) {
      console.log(`[Recherche] Récupération des 10 derniers posts contenant "${term}"`);
      // Recherche par terme (hashtag ou mots-clés)
      const res = await agent.app.bsky.feed.searchPosts({ q: term, limit: 10 });
      if (res && Array.isArray(res.data.posts)) {
        allPosts.push(...res.data.posts);
      }
      // Petit délai entre les requêtes pour éviter le rate limiting
      await delay(500);
    }
    // Supprime les doublons de posts (par uri)
    const uniquePosts = Array.from(new Map(allPosts.map(p => [p.uri, p])).values());
    // Mélange aléatoire pour répondre à des posts variés à chaque run
    uniquePosts.sort(() => Math.random() - 0.5);
    if (uniquePosts.length === 0) {
      console.warn('[INFO] Aucun post trouvé pour les hashtags ciblés.');
      return;
    }
    // Récupère le handle du bot pour ne pas répondre à soi-même
    const myHandle = agent.session?.handle;
    console.log(`[DEBUG] Nombre de posts uniques récupérés : ${uniquePosts.length}`);
    let repliedCount = 0;
    for (const post of uniquePosts) {
      const { uri, author, record } = post;
      const text = record?.text;

      // Vérifie si on a déjà répondu à cet utilisateur ou à ce post récemment
      if (hasRepliedRecently(author.did, uri, replyHistory)) {
        const reason = replyHistory.users[author.did] ? `déjà répondu à ${author.handle}` : 'post déjà traité';
        console.log(`[IGNORÉ] Post ignoré (${reason}): uri=${uri}`);
        continue;
      }

      // Note: La vérification de langue a été supprimée - le bot répond à toutes les langues
      try {
        // Tronque intelligemment les textes trop longs pour l'API
        const MAX_INPUT_LENGTH = 500; // Longueur maximale raisonnable pour l'entrée
        let truncatedText = text;

        if (text && text.length > MAX_INPUT_LENGTH) {
          // Coupe à la dernière phrase complète avant la limite
          const lastSentenceBreak = text.substring(0, MAX_INPUT_LENGTH).lastIndexOf('.');
          if (lastSentenceBreak > MAX_INPUT_LENGTH * 0.5) { // Si on a au moins la moitié du texte
            truncatedText = text.substring(0, lastSentenceBreak + 1) + ' [...]';
          } else {
            // Sinon coupe au dernier espace pour ne pas couper un mot
            const lastSpace = text.substring(0, MAX_INPUT_LENGTH).lastIndexOf(' ');
            truncatedText = text.substring(0, lastSpace) + ' [...]';
          }
          console.log(`[Troncature] Texte original ${text.length} caractères -> ${truncatedText.length} caractères`);
        }

        console.log(`[Réponse] Génération d'une réponse à : ${truncatedText}`);
        const reply = await generateReplyText(truncatedText);
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

        // Ajoute l'utilisateur et le post à l'historique
        if (!replyHistory.users) replyHistory.users = {};
        if (!replyHistory.posts) replyHistory.posts = {};

        replyHistory.users[author.did] = Date.now();
        replyHistory.posts[uri] = Date.now();
        saveReplyHistory(replyHistory);
      } catch (error) {
        console.error(`[Erreur] Échec lors de la réponse à ${uri} :`, error?.response?.data || error.message);
      }
      await delay(10000);
      if (repliedCount >= MAX_REPLIES_PER_RUN) {
        console.log(`[INFO] Limite de ${MAX_REPLIES_PER_RUN} réponses atteinte, arrêt de la boucle.`);
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
