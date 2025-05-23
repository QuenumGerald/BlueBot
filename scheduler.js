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
for (let i = 0; i < 9; i++) {
  jobs.schedule(async () => {
    try {
      console.log(`[BlazeJob] [START] Job texte Clippy ${9 + i}h`);
      await initBluesky();
      const text = await generateTrombonePostText();
      await agent.post({ text });
      console.log(`[BlazeJob][PostTexte] Texte posté à ${9 + i}h :`, text);
      console.log(`[BlazeJob] [END] Job texte Clippy ${9 + i}h`);
    } catch (err) {
      console.error(`[BlazeJob][ERROR] Job texte Clippy ${9 + i}h :`, err);
    }
  }, {
    name: `Trombone Text Post ${9 + i}h`,
    runAt: isTest ? inMinutes(3) : nextHour(9 + i),
    interval: 24 * 60 * 60 * 1000,
    maxRuns: 3650,
  });
}

// Like/follow maximal (25 posts/hashtag) à 7h et 19h sur hashtags acheteurs potentiels
const buyerHashtags = [
  'clippy',
  'memecoin',
  'tech',
];

// Répartition sur 5 créneaux (7h, 11h, 15h, 19h, 23h), 5 posts/hashtag/job, délai 2s entre chaque action
const likeFollowHours = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
const maxPerJob = 5;
const delayMs = 2000;

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
