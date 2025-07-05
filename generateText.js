// --------------------------------------------------------
// generateText.js  •  Sparky Edition  (v2 – 298‑char safety)
// Generates funny posts & replies for the Sparky Bluesky bot
// using DeepSeek (priority) or OpenAI (fallback)
// ▸ Bluesky hard limit ≈ 300 char → we enforce 298 to stay safe
// --------------------------------------------------------

import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

// --------------------------------------------------------
// Provider selection ---------------------------------------------------
// --------------------------------------------------------
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY
const OPENAI_KEY = process.env.OPENAI_KEY
const provider = DEEPSEEK_KEY ? 'deepseek' : OPENAI_KEY ? 'openai' : null
if (!provider) throw new Error('DEEPSEEK_KEY or OPENAI_KEY must be set in .env')

const API_URL = provider === 'deepseek'
  ? 'https://api.deepseek.com/v1/chat/completions'
  : 'https://api.openai.com/v1/chat/completions'

const MODEL = provider === 'deepseek' ? 'deepseek-chat' : 'gpt-3.5-turbo'

// Global constants -----------------------------------------------------
const MAX_POST_LEN = 280   // posts are now strictly capped at 280 chars
const MAX_REPLY_LEN = 220  // replies can be longer but still concise
const MAX_PUNCH_LEN = 50    // ultra‑short punchlines

// Troncature intelligente (ne coupe pas un mot)
function smartTruncate(text, maxLen) {
  if (text.length <= maxLen) return text;
  const truncated = text.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
}

// ---------------------------------------------------------------------
async function callChatApi(messages, maxTokens) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${provider === 'deepseek' ? DEEPSEEK_KEY : OPENAI_KEY}`
  }
  const body = { model: MODEL, messages, max_tokens: maxTokens, temperature: 1.5 }
  const { data } = await axios.post(API_URL, body, { headers })
  return data.choices[0].message.content.trim()
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
    userPrompt = `${randomTopic}\nWrite a new original meme post for Spark Protocol on Bluesky. Humour mandatory. It MUST be extremely short (1 line, under 10 words) and written in the first person (\"I\", \"my\", \"me\") as if Sparky is speaking. No CTA unless it’s part of the joke.Only plain text, in English. No markdown, no emojis.`;
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

  // Supprime les guillemets parasites en début/fin
  text = text.replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '');
  // Supprime les retours à la ligne
  text = text.replace(/\n+/g, ' ');
  // Ne garde que la première phrase (finissant par . ! ou ?)
  const match = text.match(/^[^.!?]+[.!?]/);
  if (match) {
    text = match[0];
  }
  // Coupe à 280 caractères max
  if (text.length > 280) text = text.slice(0, 280);
  return text.trim();

}

// ---------------------------------------------------------------------
// REPLY GENERATOR -------------------------------------------------------
// ---------------------------------------------------------------------
export async function generateReplyText(originalText) {
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

