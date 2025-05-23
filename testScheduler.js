// testScheduler.js
// Clone du scheduler de prod pour test rapide, avec BlazerJob et exécution immédiate
import pkg from 'blazerjob';
const { BlazeJob } = pkg;
import dotenv from 'dotenv';
import { postTromboneImage } from './postImage.js';
import { generateTrombonePostText } from './generateText.js';
import { likeAndFollowHashtag } from './likeAndFollow.js';
import { agent } from './bluesky.js';

dotenv.config();

function nowPlus(ms) { return new Date(Date.now() + ms); }

const jobs = new BlazeJob({ dbPath: './test-jobs.db' });

// 1 post image test
jobs.schedule(postTromboneImage, {
  name: 'Trombone Image Test',
  runAt: nowPlus(2000),
  maxRuns: 1
});

// 1 post texte test
jobs.schedule(async () => {
  const text = await generateTrombonePostText();
  await agent.post({ text });
  console.log('[Succès] Post texte trombone TEST publié !');
}, {
  name: 'Trombone Text Test',
  runAt: nowPlus(7000),
  maxRuns: 1
});

// Like/follow sur tous les hashtags (1 action chacun, test rapide)
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
jobs.schedule(async () => {
  for (const hashtag of buyerHashtags) {
    await likeAndFollowHashtag(hashtag, 1);
  }
  console.log('[Succès] Like & follow TEST sur tous les hashtags.');
}, {
  name: 'Buyer Like & Follow Test',
  runAt: nowPlus(12000),
  maxRuns: 1
});

jobs.start();

jobs.onAllTasksEnded(() => {
  console.log('Tous les tests BlazerJob (mode prod) sont terminés.');
  process.exit(0);
});
