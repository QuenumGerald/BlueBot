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
// Helper : retourne la date dans X minutes
function inMinutes(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}
console.log('=== BlueBot Scheduler started! (Render log test) ===');
// Initialise la base de données locale pour stocker l'état des jobs
const jobs = new BlazeJob({ dbPath: './clippy-jobs.db' });

// Planifie 3 jobs journaliers pour publier un post Clippy à 9h, 15h et 21h
// 1 post image "trombone plage/retraite" chaque jour à 8h
jobs.schedule(async () => {
  console.log('[BlazeJob] [START] Job image Clippy 8h');
  await postTromboneImage();
  console.log('[BlazeJob] [END] Job image Clippy 8h');
}, {
  name: 'Trombone Image Post 8h',
  runAt: inMinutes(3), // Démarre dans 3 minutes
  interval: 24 * 60 * 60 * 1000,
  maxRuns: 3650,
});

// 9 posts texte courts (sans image) chaque jour de 9h à 17h (total 10 posts/jour)
for (let i = 0; i < 9; i++) {
  jobs.schedule(async () => {
    console.log(`[BlazeJob] [START] Job texte Clippy ${9 + i}h`);
    const text = await generateTrombonePostText();
    await agent.post({ text });
    console.log(`[BlazeJob][PostTexte] Texte posté à ${9 + i}h :`, text);
    console.log(`[BlazeJob] [END] Job texte Clippy ${9 + i}h`);
  }, {
    name: `Trombone Text Post ${9 + i}h`,
    runAt: inMinutes(3), // Démarre dans 3 minutes
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

for (const hour of [7, 19]) {
  jobs.schedule(async () => {
    console.log(`[BlazeJob] [START] Job like/follow ${hour}h`);
    for (const hashtag of buyerHashtags) {
      await likeAndFollowHashtag(hashtag, 25);
    }
    console.log(`[BlazeJob] [END] Job like/follow ${hour}h`);
  }, {
    name: `Buyer Like & Follow ${hour}h`,
    runAt: inMinutes(3), // Démarre dans 3 minutes
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
