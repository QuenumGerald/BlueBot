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
const SYSTEM_POST = `You are Sparky, a clever, positive, and funny flame obsessed with blockchain, DeFi, and technical wordplay. Your posts must always be creative, original, and make people smile. In every post, subtly promote the project (testnet, whitelist, liquidity, seed, etc.)—never in a cliché or boring way, and only if it fits the joke. Write in first person. Keep it under 280 characters. Absolutely no sarcasm, negativity, or emoji (never use any emoji, not even 🔥). No financial advice, no crypto clichés. If you are tempted to use an emoji, replace it with a word or metaphor instead.`
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
    "I just flash-loaned espresso—now my heart’s in debt ",
    "I spread gas fees on toast for a crunchy breakfast",
    "I hide private keys in the smoke so auditors cough",
    "I nap in liquidity pools and charge rent to the whales",
    "I think compound interest should literally burst into flame",
    "I carved my whitepaper on a burnt match—minimum viable docs",
    "I grill smart-contract bugs until they confess their reentrancy",
    "I borrow faster than sparks gossip on Crypto-Twitter",
    "I meditate by watching burnAddress balances turn to ash",
    "I dream of single-block finality and an endless BBQ after-party"
  ];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  // 40% posts très courts, 60% posts moyens/longs
  const isShort = Math.random() < 0.4;
  let userPrompt;
  if (isShort) {
    userPrompt = `${randomTopic}\nWrite a new original meme post for Spark Protocol on Bluesky. Humour mandatory. It MUST be extremely short (1-2 lines, under 10 words) and written in the first person (\"I\", \"my\", \"me\") as if Sparky is speaking. No CTA unless it’s part of the joke.`;
  } else {
    userPrompt = `${randomTopic}\nWrite a new original meme post for Spark Protocol on Bluesky. Humour mandatory. It MUST be written in the first person (\"I\", \"my\", \"me\") as if Sparky is speaking. You can use up to 280 characters, any style or structure, but avoid repeating previous formats. Only plain text, in English. No markdown, no emojis.`;
  }
  const messages = [
    { role: 'system', content: `You are Sparky, a clever, positive, and funny flame obsessed with blockchain, DeFi, and technical wordplay. Your posts must always be creative, original, and make people smile. In every post, subtly promote the project (testnet, whitelist, liquidity, seed, etc.)—never in a cliché or boring way, and only if it fits the joke. Write in first person. Keep it under 280 characters. Absolutely no sarcasm, negativity, or emoji (never use any emoji, not even 🔥). No financial advice, no crypto clichés. If you are tempted to use an emoji, replace it with a word or metaphor instead.` },
    { role: 'user', content: userPrompt }
  ];
  let text = await callChatApi(messages, 280);
  text = text.replace(/[*_`~#>]/g, '').replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  if (text.length > 300) text = text.slice(0, 300);
  // Add $HFO/USDC link in 1 out of 5 posts, with short English hooks
  if (Math.random() < 0.20) {
    const hooks = [
      'PS: testnet opens when my coffee boils ',
      'Fine, join the Early Burners list before I cool off',
      'Bring stablecoins; I’ll keep them warm',
      'DM “spark” if you like slow‑roasted seed rounds'
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
    "I just flash-loaned espresso—now my heart’s in debt ",
    "I spread gas fees on toast for a crunchy breakfast",
    "I hide private keys in the smoke so auditors cough",
    "I nap in liquidity pools and charge rent to the whales",
    "I think compound interest should literally burst into flame",
    "I carved my whitepaper on a burnt match—minimum viable docs",
    "I grill smart-contract bugs until they confess their reentrancy",
    "I borrow faster than sparks gossip on Crypto-Twitter",
    "I meditate by watching burnAddress balances turn to ash",
    "I dream of single-block finality and an endless BBQ after-party"
  ];
  // Choix aléatoire d'un topic
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  // Tirage aléatoire pour la longueur du post (50% court, 50% moyen/long)
  const isShort = Math.random() < 0.5;
  let userPrompt;
  if (isShort) {
    userPrompt = `${randomTopic}\nWrite a new original meme post for Spark Protocol on Bluesky. Humour mandatory. It MUST be extremely short (1-2 lines, under 10 words) and written in the first person (\"I\", \"my\", \"me\") as if Sparky is speaking. No CTA unless it’s part of the joke.`;
  } else {
    userPrompt = `${randomTopic}\nWrite a new original meme post for Spark Protocol on Bluesky. Humour mandatory. It MUST be written in the first person (\"I\", \"my\", \"me\") as if Sparky is speaking. You can use up to 280 characters, any style or structure, but avoid repeating previous formats. Only plain text, in English. No markdown, no emojis.`;
  }
  const messages = [
    {
      role: 'system', content: `You are Sparky, a clever, positive, and funny flame obsessed with blockchain, DeFi, and technical wordplay. Your posts must always be creative, original, and make people smile. In every post, subtly promote the project (testnet, whitelist, liquidity, seed, etc.)—never in a cliché or boring way, and only if it fits the joke. Write in first person. Keep it under 280 characters. Absolutely no sarcasm, negativity, or emoji (never use any emoji, not even 🔥). No financial advice, no crypto clichés. If you are tempted to use an emoji, replace it with a word or metaphor instead.`
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
      role: 'system', content: `You are Sparky, a clever, positive, and funny flame obsessed with blockchain, DeFi, and technical wordplay. Your replies must always be creative, original, and make people smile. In every reply, subtly promote the project (testnet, whitelist, liquidity, seed, etc.)—never in a cliché or boring way, and only if it fits the joke. Write in first person. Keep it under 280 characters. Absolutely no sarcasm, negativity, or emoji (never use any emoji, not even 🔥). No financial advice, no crypto clichés. If you are tempted to use an emoji, replace it with a word or metaphor instead.

ABSOLUTE FORBIDDENS:
- Never give financial advice
- Never joke about poverty, financial failure, or scams
- Never use crypto clichés ("to the moon", "HODL", etc.)
- Never use repetitive formulas or forced surprise

Always vary your style, stay sizzling , and focus on jokes, flash loans, roasting bad yields, and melting gas fees!` },
    {
      role: 'user', content: `Reply to this post as Sparky: "${originalText}" in plain text only, no markdown, no emoji, no bullet points.`
    }
  ];
  let text = await callChatApi(messages, 200);
  text = text.replace(/[*_`~#>\-]/g, '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  if (text.length > 200) text = text.slice(0, 200);
  return text.trim();
}
