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
 * Charge l'historique des DID auxquels le bot a déjà répondu
 * @returns {Object} Un objet avec les DIDs comme clés et les timestamps comme valeurs
 */
function loadReplyHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[Historique] Erreur lors du chargement de l\'historique:', error.message);
  }
  return {}; // Retourne un objet vide si le fichier n'existe pas ou est invalide
}

/**
 * Sauvegarde l'historique des DID auxquels le bot a déjà répondu
 * @param {Object} history Un objet avec les DIDs comme clés et les timestamps comme valeurs
 */
function saveReplyHistory(history) {
  try {
    // Nettoie l'historique en supprimant les entrées trop anciennes
    const now = Date.now();
    const maxAge = MAX_HISTORY_DAYS * 24 * 60 * 60 * 1000; // Convertit jours en ms

    Object.keys(history).forEach(did => {
      if (now - history[did] > maxAge) {
        delete history[did];
      }
    });

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
  } catch (error) {
    console.error('[Historique] Erreur lors de la sauvegarde de l\'historique:', error.message);
  }
}

/**
 * Vérifie si on a déjà répondu à un utilisateur récemment
 * @param {string} did DID de l'utilisateur à vérifier
 * @param {Object} history Historique des réponses
 * @returns {boolean} true si on a déjà répondu récemment
 */
function hasRepliedRecently(did, history) {
  return history.hasOwnProperty(did);
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
    const MAX_REPLIES = isTest ? 3 : 10; // Seulement 3 réponses en mode test
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

      // Vérifie si on a déjà répondu à cet utilisateur récemment
      if (hasRepliedRecently(author.did, replyHistory)) {
        console.log(`[IGNORÉ] Post ignoré (déjà répondu à ${author.handle}): uri=${uri}`);
        continue;
      }

      // Ne répondre qu'aux posts en anglais
      const langs = record?.langs;
      if (!langs || !langs.includes('en')) {
        console.log(`[IGNORÉ] Post ignoré (langue non-anglaise): langs=${JSON.stringify(langs)}, uri=${uri}`);
        continue;
      }
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

        // Ajoute l'utilisateur à l'historique
        replyHistory[author.did] = Date.now();
        saveReplyHistory(replyHistory);
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
