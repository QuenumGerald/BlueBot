// scheduler.js
// Orchestration de la planification des tâches Clippy avec BlazerJob

import pkg from 'blazerjob';
const { BlazeJob } = pkg;
import dotenv from 'dotenv';
import { postTromboneImage } from './postImage.js';
import { generateTrombonePostText } from './generateText.js';
import { likeAndFollowHashtag } from './likeAndFollow.js';
import { agent, initBluesky } from './bluesky.js';

dotenv.config(); // Charge les variables d'environnement depuis .env

// Helper : retourne la prochaine date à l'heure donnée (heure 24h)
function nextHour(hour) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}
// Helper : retourne la date dans X minutes
function inMinutes(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}
console.log('=== BlueBot Scheduler started! (Render log test) ===');
// Initialise la base de données locale pour stocker l'état des jobs
const jobs = new BlazeJob({ dbPath: './clippy-jobs.db' });

// Planifie 3 jobs journaliers pour publier un post Clippy à 9h, 15h et 21h
// 1 post image "trombone plage/retraite" chaque jour à 8h
const isTest = process.env.NODE_ENV === 'test';

jobs.schedule(async () => {
  try {
    console.log('[BlazeJob] [START] Job image Clippy 8h');
    await postTromboneImage();
    console.log('[BlazeJob] [END] Job image Clippy 8h');
  } catch (err) {
    console.error('[BlazeJob][ERROR] Job image Clippy 8h :', err);
  }
}, {
  name: 'Trombone Image Post 8h',
  runAt: isTest ? inMinutes(1) : nextHour(8),
  interval: 24 * 60 * 60 * 1000,
  maxRuns: 3650,
});

// 9 posts texte courts (sans image) chaque jour de 9h à 17h (total 10 posts/jour)
const postTextHours = [9, 13, 17]; // 3 posts texte par jour
for (const hour of postTextHours) {
  jobs.schedule(async () => {
    try {
      console.log(`[BlazeJob] [START] Job texte Clippy ${hour}h`);
      await initBluesky();
      const text = await generateTrombonePostText();
      await agent.post({ text });
      console.log(`[BlazeJob][PostTexte] Texte posté à ${hour}h :`, text);
      console.log(`[BlazeJob] [END] Job texte Clippy ${hour}h`);
    } catch (err) {
      console.error(`[BlazeJob][ERROR] Job texte Clippy ${hour}h :`, err);
    }
  }, {
    name: `Trombone Text Post ${hour}h`,
    runAt: isTest ? inMinutes(1) : nextHour(hour),
    interval: 24 * 60 * 60 * 1000,
    maxRuns: 3650,
  });
}


// Like/follow maximal (25 posts/hashtag) à 7h et 19h sur hashtags acheteurs potentiels
const buyerHashtags = [
  // Termes généraux de base
  'bitcoin', 'ethereum', 'blockchain', 'clippy',

  // Termes Bitcoin spécifiques et techniques
  'hal finney', 'lightning network',
  'segwit', 'UTXO', 'proof of work',
  'bitcoin mining difficulty', 'bitcoin mempool', 'taproot upgrade',

  // Termes Ethereum spécifiques et techniques
  'gavin wood',
  'ethereum merge', 'solidity', 'ERC-20', 'EIP-1559', 'optimistic rollups',
  'layer 2 scaling', 'serenity upgrade', 'casper protocol',

  // Termes blockchain spécifiques et techniques
  'zero knowledge proofs', 'merkle tree', 'consensus algorithm',
  'delegated proof of stake', 'sharding implementation',
  'blockchain interoperability', 'atomic swap',

  // Termes tech spécifiques et profonds
  'arm64 architecture', 'RISC processor', 'quantum computing',
  'neural network optimization',
  'microservice architecture',
  'CUDA parallel computing',

  // Termes Clippy et technologie rétro spécifiques
  'leanne ruzsa-atkinson',
  'kevan atkinson clippy',
  'windows 95 release', 'windows NT kernel', 'MS-DOS commands'
];

// [RÉDUIT] Suite à un avertissement Bluesky (mai 2025), fréquence divisée par 2, likes désactivés ailleurs.
const replyHours = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]; // 12 créneaux pour plus de replies
const likeFollowHours = [4, 12, 20]; // 3 créneaux, maxPerJob augmenté
const maxPerJob = 3; // 3 posts/hashtag/job pour +50%
const delayMs = 3000; // délai inchangé

// Planification auto-reply 5 fois/jour (créneaux séparés)
import { autoReply } from './autoReply.js';
for (const hour of replyHours) {
  jobs.schedule(async () => {
    try {
      console.log(`[BlazeJob] [START] Job autoReply ${hour}h`);
      await autoReply();
      console.log(`[BlazeJob] [END] Job autoReply ${hour}h`);
    } catch (err) {
      console.error(`[BlazeJob][ERROR] Job autoReply ${hour}h :`, err);
    }
  }, {
    name: `AutoReply ${hour}h`,
    runAt: isTest ? inMinutes(2) : nextHour(hour),
    interval: 12 * 60 * 60 * 1000,
    maxRuns: 3650,
  });
}
for (const hour of likeFollowHours) {
  jobs.schedule(async () => {
    try {
      console.log(`[BlazeJob] [START] Job like/follow ${hour}h`);
      for (const hashtag of buyerHashtags) {
        await likeAndFollowHashtag(hashtag, maxPerJob, delayMs);
      }
      console.log(`[BlazeJob] [END] Job like/follow ${hour}h`);
    } catch (err) {
      console.error(`[BlazeJob][ERROR] Job like/follow ${hour}h :`, err);
    }
  }, {
    name: `Buyer Like & Follow ${hour}h`,
    runAt: isTest ? inMinutes(3) : nextHour(hour),
    interval: 12 * 60 * 60 * 1000,
    maxRuns: 3650,
  });
}


// Démarre le scheduler
jobs.start();


// Logue quand toutes les tâches planifiées sont terminées
jobs.onAllTasksEnded(() => {
  console.log('Toutes les tâches sont terminées');
});
