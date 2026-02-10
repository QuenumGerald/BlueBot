// scheduler.js
// Orchestration de la planification des tâches Clippy avec BlazerJob

import pkg from 'blazerjob';
const { BlazeJob } = pkg;
import dotenv from 'dotenv';

import { generateTrombonePostText } from './generateText.js';
import { likeAndFollowHashtag } from './likeAndFollow.js';
import { agent, initBluesky } from './bluesky.js';
import { autoReply, autoSmallReply } from './autoReply.js';

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
console.log('=== Alkimo Bot Scheduler started! ===');
// Initialise la base de données locale pour stocker l'état des jobs
const jobs = new BlazeJob({ dbPath: './alkimo-jobs.db' });

const isTest = process.env.NODE_ENV === 'test';

// Posts texte plus fréquents pour accélérer la cadence de publication
const postTextHours = [6, 8, 10, 12, 14, 16, 18, 20, 22, 23];
for (const hour of postTextHours) {
  jobs.schedule(async () => {
    try {
      console.log(`[BlazeJob] [START] Job texte Alkimo ${hour}h`);
      await initBluesky();
      const text = await generateTrombonePostText();
      await agent.post({ text });
      console.log(`[BlazeJob][PostTexte] Texte posté à ${hour}h :`, text);
      console.log(`[BlazeJob] [END] Job texte Alkimo ${hour}h`);
    } catch (err) {
      console.error(`[BlazeJob][ERROR] Job texte Alkimo ${hour}h :`, err);
    }
  }, {
    name: `Alkimo Text Post ${hour}h`,
    runAt: isTest ? inMinutes(15) : nextHour(hour),
    interval: 24 * 60 * 60 * 1000,
    maxRuns: 3650,
  });
}


// Like/follow maximal (25 posts/hashtag) à 7h et 19h sur hashtags acheteurs potentiels
const projectCollabHashtags =
  [ // Tech & AI growth hashtags
    'startup', 'buildinpublic', 'saas', 'ai', 'automation',
    // Product & Growth
    'productivity', 'growth', 'indiehacker',
    // Engineering & founders
    'dev', 'founder', 'tech'
  ];

// Configuration spéciale pour les contributions et le networking à Silicon Valley (15 juillet - 2 septembre 2025)
const replyHours = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
const likeFollowHours = [6, 9, 12, 15, 18, 21, 23];
const maxPerJob = 5;
const delayMs = 2000;

// Planification auto-reply pour la recherche d'emploi (réponse aux opportunités)
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
    runAt: isTest ? inMinutes(1) : nextHour(hour),
    interval: isTest ? 5 * 60 * 1000 : 12 * 60 * 60 * 1000, // toutes les 5 min en test
    maxRuns: 3650,
  });
}

// Planification de quelques replies (max 2) pour maintenir l'interaction sans spam
const smallReplyHours = [9, 19];
for (const hour of smallReplyHours) {
  jobs.schedule(async () => {
    try {
      console.log(`[BlazeJob] [START] Job autoSmallReply ${hour}h`);
      await autoSmallReply();
      console.log(`[BlazeJob] [END] Job autoSmallReply ${hour}h`);
    } catch (err) {
      console.error(`[BlazeJob][ERROR] Job autoSmallReply ${hour}h :`, err);
    }
  }, {
    name: `AutoSmallReply ${hour}h`,
    runAt: isTest ? inMinutes(2) : nextHour(hour),
    interval: isTest ? 10 * 60 * 1000 : 24 * 60 * 60 * 1000, // toutes les 10 min en test
    maxRuns: 3650,
  });
}
for (const hour of likeFollowHours) {
  jobs.schedule(async () => {
    try {
      console.log(`[BlazeJob] [START] Job like/follow ${hour}h`);
      for (const hashtag of projectCollabHashtags) {
        await likeAndFollowHashtag(hashtag, maxPerJob, delayMs);
      }
      console.log(`[BlazeJob] [END] Job like/follow ${hour}h`);
    } catch (err) {
      console.error(`[BlazeJob][ERROR] Job like/follow ${hour}h :`, err);
    }
  }, {
    name: `Alkimo Like & Follow ${hour}h`,
    runAt: isTest ? inMinutes(3) : nextHour(hour),
    interval: isTest ? 5 * 60 * 1000 : 24 * 60 * 60 * 1000, // toutes les 5 min en test
    maxRuns: 3650,
  });
}


// Démarre le scheduler
jobs.start();


// Logue quand toutes les tâches planifiées sont terminées
jobs.onAllTasksEnded(() => {
  console.log('Toutes les tâches sont terminées');
});
