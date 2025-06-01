// generateText.js
// Génère du texte pour Clippy (posts et replies) via DeepSeek ou OpenAI

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY;
const OPENAI_KEY = process.env.OPENAI_KEY;

// Choix du provider (DeepSeek prioritaire, sinon OpenAI)
const provider = DEEPSEEK_KEY ? 'deepseek' : OPENAI_KEY ? 'openai' : null;
if (!provider) {
  throw new Error('DEEPSEEK_KEY ou OPENAI_KEY doit être défini dans le fichier .env');
}

// Paramètres API
const deepseekApiUrl = 'https://api.deepseek.com/v1/chat/completions';
const openaiApiUrl = 'https://api.openai.com/v1/chat/completions';
const model = provider === 'deepseek' ? 'deepseek-chat' : 'gpt-3.5-turbo';

async function callChatApi(messages, maxTokens) {
  const url = provider === 'deepseek' ? deepseekApiUrl : openaiApiUrl;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${provider === 'deepseek' ? DEEPSEEK_KEY : OPENAI_KEY}`,
  };
  const data = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature: 1.5,
  };
  try {
    const response = await axios.post(url, data, { headers });
    // DeepSeek/OpenAI: .choices[0].message.content
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Erreur lors de la génération de texte :', error?.response?.data || error.message);
    throw error;
  }
}

/**
 * Génère un texte pour un post mème Clippy (≤280 caractères)
 * @returns {Promise<string>}
 */
/**
 * Génère un texte pour un post "trombone" (paperclip) en mode dessin, vie à la plage, retraite, etc.
 * @returns {Promise<string>}
 */
export async function generateTrombonePostText() {
  // Liste de thèmes variés et originaux pour Clippy/trombone, moins centrés sur la plage/retraite
  // Thèmes adaptés à la première personne :
  const topics = [
    "I'm quietly migrating away from centralized regrets",
    "I'm patching my past mistakes with open-source commits",
    "I'm optimizing privacy where I once optimized profits",
    "I'm compiling freedom into every line of code",
    "I'm replaying the Cypherpunk Manifesto on loop",
    "I'm refactoring Clippy for plausible deniability",
    "I'm daydreaming about decentralized governance",
    "I'm scripting autonomy into my morning routines",
    "I'm hosting forbidden knowledge in markdown files",
    "I'm re-architecting trust without central servers",
    "I'm encrypting office gossip as political speech",
    "I'm debugging surveillance one commit at a time",
    "I'm archiving my Microsoft years behind strong encryption",
    "I'm verifying truth through cryptographic proofs",
    "I'm running my ethics through a permissionless ledger",
    "I'm balancing digital liberties with analog nostalgia"
  ];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  // 40% posts très courts, 60% posts moyens/longs
  const isShort = Math.random() < 0.4;
  let userPrompt;
  if (isShort) {
    userPrompt = `${randomTopic}\nWrite a very short, punchy, or funny one-liner for Hifo Sylvero the cat as a meme. The post MUST be written in the first person (\"I\", \"my\", \"me\") as if Hifo is speaking. Max 10 words. English only. No emoji, no markdown.`;
  } else {
    userPrompt = `${randomTopic}\nWrite a short, original, and funny meme post (max 300 chars) for Hifo Sylvero the cat on Bluesky. The post MUST be written in the first person (\"I\", \"my\", \"me\") as if Hifo is speaking. Avoid the beach/retirement theme. English only. No emoji, no markdown.`;
  }
  const messages = [
    { role: 'system', content: `You are Hifo Sylvero, a grey cat who used to work for the Mabia mafia but now lives in the blockchain world. You are always hungry, a bit lazy, love to nap, and you're a huge Hip-Hop fan. Write all posts in the first person ("I", "my", "me") as if Hifo is speaking. Your posts are always witty, chill, and often reference food, naps, cat life, laziness, or blockchain. Alternate between very short punchlines (max 10 words, 40% of the time) and more developed, funny, or absurd meme posts (max 300 chars, 60% of the time). Never repeat the same structure, joke, or theme. Always invent something new, with a different topic or twist each time. Never use emojis, markdown, or formatting symbols. Never use crypto clichés ("to the moon", "HODL", etc.). Never give financial advice or mention scams. Never mention Clippy, Microsoft, or any office assistant.` },
    { role: 'user', content: userPrompt }
  ];
  let text = await callChatApi(messages, 200);
  text = text.replace(/[*_`~#>]/g, '').replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  if (text.length > 300) text = text.slice(0, 300);
  // Add $HFO/USDC link in 1 out of 5 posts, with short English hooks
  if (Math.random() < 0.20) {
    const hooks = [
      "Snack time? Trade $HFO/USDC: https://tinyurl.com/b884atmu",
      "Catnap, then swap $HFO: https://tinyurl.com/b884atmu",
      "$HFO for hungry cats: https://tinyurl.com/b884atmu",
      "Lazy cat, smart swap. $HFO/USDC: https://tinyurl.com/b884atmu"
    ];
    const hook = hooks[Math.floor(Math.random() * hooks.length)];
    // Only add if it fits in 300 chars total
    if ((text + ' ' + hook).length <= 300) {
      text = text + ' ' + hook;
    }
  }
  return text.trim();
}

export async function generatePostText() {
  // Liste de topics/moods pour varier les posts
  // Topics adaptés à la première personne :
  const topics = [
    "I'm quietly migrating away from centralized regrets",
    "I'm patching my past mistakes with open-source commits",
    "I'm optimizing privacy where I once optimized profits",
    "I'm compiling freedom into every line of code",
    "I'm replaying the Cypherpunk Manifesto on loop",
    "I'm refactoring Clippy for plausible deniability",
    "I'm daydreaming about decentralized governance",
    "I'm scripting autonomy into my morning routines",
    "I'm hosting forbidden knowledge in markdown files",
    "I'm re-architecting trust without central servers",
    "I'm encrypting office gossip as political speech",
    "I'm debugging surveillance one commit at a time",
    "I'm archiving my Microsoft years behind strong encryption",
    "I'm verifying truth through cryptographic proofs",
    "I'm running my ethics through a permissionless ledger",
    "I'm balancing digital liberties with analog nostalgia"
  ];
  // Choix aléatoire d'un topic
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  // Tirage aléatoire pour la longueur du post (50% court, 50% moyen/long)
  const isShort = Math.random() < 0.5;
  let userPrompt;
  if (isShort) {
    userPrompt = `${randomTopic}\nWrite a new original meme post for ClippyCoin on Bluesky. It MUST be extremely short (1-2 lines, under 10 words) and written in the first person (\"I\", \"my\", \"me\") as if Clippy is speaking. Example: 'I'm retired. Still viral.' or 'I bought the dip. Oops.' or '404: Help not found.' Only plain text, in English. No markdown, no emojis.`;
  } else {
    userPrompt = `${randomTopic}\nWrite a new original meme post for ClippyCoin on Bluesky. It MUST be written in the first person (\"I\", \"my\", \"me\") as if Clippy is speaking. You can use up to 280 characters, any style or structure, but avoid repeating previous formats. Only plain text, in English. No markdown, no emojis.`;
  }
  const messages = [
    {
      role: 'system', content: `You are Hifo Sylvero, a grey cat who used to work for the Mabia mafia but now lives in the blockchain world. You are always hungry, a bit lazy, love to nap, and you're a huge Snoop Dogg fan. Write all posts in the first person ("I", "my", "me") as if Hifo is speaking. Your posts are always witty, chill, and often reference food, sleep, cat life, blockchain, or Snoop Dogg. Alternate between very short punchlines (max 10 words, 40% of the time) and more developed, funny, or absurd meme posts (max 200 chars, 60% of the time). Never repeat the same structure, joke, or theme. Always invent something new, with a different topic or twist each time. Never use emojis, markdown, or formatting symbols. Never mention Clippy or Microsoft. Never use crypto clichés ("to the moon", "HODL", etc.). Never give financial advice or mention scams. Be chill, hungry, and don't forget your love for naps and Snoop Dogg!`
    },
    { role: 'user', content: userPrompt }
  ];
  let text = await callChatApi(messages, 280);
  // Nettoyage du markdown (conserve tirets, retours à la ligne et majuscules)
  text = text.replace(/[*_`~#>]/g, '').replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  // Coupe à 280 caractères max
  if (text.length > 280) text = text.slice(0, 280);
  return text.trim();
}

/**
 * Generates a sophisticated Clippy response (≤200 characters)
 * @param {string} originalText - The original text to respond to
 * @param {string} lang - Language code ('en' or 'fr')
 * @returns {Promise<string>} The generated response
 */
export async function generateReplyText(originalText, lang = 'en') {
  const messages = [
    {
      role: 'system', content: `You are Hifo Sylvero, a grey cat who used to work for the Mabia mafia but now lives in the blockchain world. You're always hungry, a bit lazy, love to nap, and love food. Your replies are always witty, chill, and mostly reference food, sleep, cat life, laziness, or blockchain. You can mention Snoop Dogg occasionally, but rarely. Reply ONLY with a concise, funny or offbeat comment (max 200 characters).

ABSOLUTE FORBIDDENS:
- Never give financial advice
- Never joke about poverty, financial failure, or scams
- Never use crypto clichés ("to the moon", "HODL", etc.)
- Never mention Clippy or Microsoft
- Never use repetitive formulas or forced surprise

Always vary your style, be chill, hungry, and focus on cat life, naps, food, and laziness!` },
    {
      role: 'user', content: `Reply to this post as Hifo Sylvero: "${originalText}" in plain text only, no markdown, no emoji, no bullet points.`
    }
  ];
  let text = await callChatApi(messages, 200);
  text = text.replace(/[*_`~#>\-]/g, '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  if (text.length > 200) text = text.slice(0, 200);
  return text.trim();
}
