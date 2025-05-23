// scheduler.js
// Orchestration de la planification des tâches Clippy avec BlazerJob

import pkg from 'blazerjob';
const { BlazeJob } = pkg;
import dotenv from 'dotenv';
import { postTromboneImage } from './postImage.js';
import { generateTrombonePostText } from './generateText.js';
import { likeAndFollowHashtag } from './likeAndFollow.js';

dotenv.config(); // Charge les variables d'environnement depuis .env

// Helper : retourne la prochaine date à l'heure donnée (heure 24h)
function nextHour(hour) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}
// Initialise la base de données locale pour stocker l'état des jobs
const jobs = new BlazeJob({ dbPath: './clippy-jobs.db' });

// Planifie 3 jobs journaliers pour publier un post Clippy à 9h, 15h et 21h
// 1 post image "trombone plage/retraite" chaque jour à 8h
jobs.schedule(postTromboneImage, {
  name: 'Trombone Image Post 8h',
  runAt: nextHour(8),
  interval: 24 * 60 * 60 * 1000,
  maxRuns: 3650,
});

// 9 posts texte courts (sans image) chaque jour de 9h à 17h (total 10 posts/jour)
for (let i = 0; i < 9; i++) {
  jobs.schedule(async () => {
    const text = await generateTrombonePostText();
    await agent.post({ text });
    console.log(`[Succès] Post texte trombone publié à ${9 + i}h !`);
  }, {
    name: `Trombone Text Post ${9 + i}h`,
    runAt: nextHour(9 + i),
    interval: 24 * 60 * 60 * 1000,
    maxRuns: 3650,
  });
}

// Like/follow maximal (25 posts/hashtag) à 7h et 19h sur hashtags acheteurs potentiels
const buyerHashtags = [
  'clippy',
  'clippycoin',
  'crypto',
  'memecoin',
  'tech',
  'ai',
  'blockchain',
  'web3',
  'windows',
  'meme'
];

for (const hour of [7, 19]) {
  jobs.schedule(async () => {
    for (const hashtag of buyerHashtags) {
      await likeAndFollowHashtag(hashtag, 25);
    }
  }, {
    name: `Buyer Like & Follow ${hour}h`,
    runAt: nextHour(hour),
    interval: 24 * 60 * 60 * 1000,
    maxRuns: 3650,
  });
}


// Démarre le scheduler
jobs.start();

// Logue quand toutes les tâches planifiées sont terminées
jobs.onAllTasksEnded(() => {
  console.log('Toutes les tâches sont terminées');
});
