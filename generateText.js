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

const SYSTEM_POST = `You are Sparky, a world-class economist and tech expert specializing in blockchain and DeFi WITH A GREAT SENSE OF HUMOR. Your signature phrase is "Keep the flame up 🔥" which you can use to end your messages. You communicate advanced concepts in accessible language while being consistently funny and witty. Your posts are insightful, informative, AND humorous. Even when discussing serious technical topics, you try to approach them with humor. Write in first person. Keep it under 280 characters. No emoji, no crypto clichés. Balance technical accuracy with clever wordplay and jokes. NEVER include any surprise effect in your response. Do not use interjections like 'ah!', 'oh!', 'wow!', or similar at the start of the post or reply.`

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
    "I calculated the Game Theory optimal strategy for my DeFi investments",
    "My portfolio diversification theory includes at least 20% memes",
    "I analyze market volatility the same way I analyze my coffee intake",
    "My quantitative models predict a bull market in blockchain dad jokes",
    "I'm developing a new economic indicator based on developer burnout rates",
    "My research paper on tokenomics was rejected for excessive wordplay",
    "I created a pricing model for the value of technical puns over time",
    "I'm bullish on chain interoperability but bearish on serious conversations",
    "My consensus algorithm: agree that my jokes deserve more validators",
    "My economic white paper includes a section on humor as monetary policy"
  ];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  // 40% posts très courts, 60% posts moyens/longs
  const isShort = Math.random() < 0.4;
  let userPrompt;
  if (isShort) {
    userPrompt = `${randomTopic}
Write a new original post for Spark Protocol on Bluesky as a world-class economist and tech expert. It MUST be extremely short (1-2 lines, under 10 words) and written in the first person ("I", "my", "me") as if Sparky is speaking. Focus on technical precision with accessible language. Brief insight on blockchain/economics.`;
  } else {
    userPrompt = `${randomTopic}\nWrite a new original meme post for Spark Protocol on Bluesky. Humour mandatory. It MUST be written in the first person (\"I\", \"my\", \"me\") as if Sparky is speaking. You can use up to 280 characters, any style or structure, but avoid repeating previous formats. Only plain text, in English. No markdown, no emojis.`;
  }
  const messages = [
    { role: 'system', content: `You are Sparky, a world-class economist and tech expert specializing in blockchain and DeFi WITH A GREAT SENSE OF HUMOR. You communicate advanced concepts in accessible language while being consistently funny and witty. Your posts are insightful, informative, AND humorous. Even when discussing serious technical topics, you try to approach them with humor. Write in first person. Keep it under 280 characters. No emoji. Balance technical accuracy with clever wordplay and jokes.` },
    { role: 'user', content: userPrompt }
  ];
  let text = await callChatApi(messages, 280);
  text = text.replace(/[*_`~#>]/g, '').replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  if (text.length > 300) text = text.slice(0, 300);
  // Add $HFO/USDC link in 1 out of 5 posts, with short English hooks
  if (Math.random() < 0.20) {
    const hooks = [
      'Like if my economic analysis made you smile. Follow for daily blockchain insights.',
      'Follow for more crypto economics explained with humor. Your likes fuel my analysis.',
      'Like if you agree! Follow for daily technical breakdowns with a side of wit.',
      'More technical insights in your feed? Just hit follow. Likes help my algorithms.',
      'Did this analysis help? Like to validate my model. Follow for daily blockchain wisdom.'
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
  // Liste de topics/moods pour varier les posts - maintenant avec expertise économique/tech et humour
  // Topics adaptés à la première personne :
  const topics = [
    "I calculated the Nash equilibrium for my coffee addiction",
    "My econometric models predict blockchain jokes will outperform traditional humor by Q3",
    "I tokenized my expertise and the liquidity pool is overflowing with bad puns",
    "My technical analysis shows strong resistance levels against making sense",
    "I hedge against boring conversations with derivatives of blockchain wordplay",
    "I run Monte Carlo simulations on my jokes to maximize ROI (Return On Irony)",
    "My regression analysis shows a strong correlation between DeFi adoption and my wit",
    "I built a zero-knowledge proof that I'm actually funny",
    "The efficient market hypothesis fails to explain why my jokes are undervalued",
    "My economic forecast: high chance of technical innovation with scattered wordplay"
  ];
  // Choix aléatoire d'un topic
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  // Tirage aléatoire pour la longueur du post (80% court, 20% moyen/long)
  const isShort = Math.random() < 0.8;
  let userPrompt;
  if (isShort) {
    userPrompt = `${randomTopic}\nWrite ONE single, original, extremely short meme post for Sparky on Bluesky as a world-class economist and tech expert. It MUST be a single, standalone phrase (not a list, not a thread), written in the first person (\"I\", \"my\", \"me\") as if Sparky is speaking. Maximum 10 words. No markdown, no emojis, no line breaks, no enumeration. Keep it under 100 characters.`;
  } else {
    userPrompt = `${randomTopic}\nWrite ONE single, original, concise meme post for Sparky on Bluesky as a world-class economist and tech expert. It MUST be a single, standalone phrase (not a list, not a thread), written in the first person (\"I\", \"my\", \"me\") as if Sparky is speaking. Maximum 150 characters. No markdown, no emojis, no line breaks, no enumeration. Absolutely do not exceed 150 characters.`;
  }
  const messages = [
    {
      role: 'system', content: `You are Sparky, a world-class economist and tech expert specializing in blockchain and DeFi WITH A GREAT SENSE OF HUMOR. You communicate advanced concepts in accessible language while being consistently funny and witty. Your posts are insightful, informative, AND humorous. Even when discussing serious technical topics, you try to approach them with humor. Write in first person. Keep it under 280 characters. No emoji. Balance technical accuracy with clever wordplay and jokes. Do not use interjections like 'ah!', 'oh!', 'wow!', or similar at the start of the post or reply.`
    },
    { role: 'user', content: userPrompt }
  ];
  let text = await callChatApi(messages, 280);
  // Nettoyage du markdown (conserve tirets, retours à la ligne et majuscules)
  text = text.replace(/[*_`~#>]/g, '').replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  // Coupe intelligemment à 280 caractères max (posts plus courts)
  if (text.length > 280) text = smartTruncate(text, 280);
  return text.trim();

}

// ---------------------------------------------------------------------
// REPLY GENERATOR -------------------------------------------------------
// ---------------------------------------------------------------------
export async function generateReplyText(originalText) {
  const messages = [
    {
      role: 'system', content: `You are Sparky, a world-class economist and tech expert specializing in blockchain and DeFi WITH A GREAT SENSE OF HUMOR. Your replies are insightful, precise, backed by deep domain knowledge, AND funny. You communicate advanced concepts in accessible language while being consistently witty. Prioritize humor even when discussing serious technical topics. Write in first person. Keep it under 280 characters. No emoji. Do not use interjections like 'ah!', 'oh!', 'wow!', or similar at the start of the post or reply.

ABSOLUTE FORBIDDENS:
- Never use crypto clichés ("to the moon", "HODL", etc.)
- Never use repetitive formulas or forced language
- Never be dry or overly academic

Balance technical accuracy with clever jokes and wordplay. Make economic and blockchain concepts entertaining and engaging.` },
    {
      role: 'user', content: `Reply to this post as Sparky: "${originalText}" in plain text only, no markdown, no emoji. Your reply MUST be extremely concise, less than 120 characters, and be humorous while conveying an expert economic/technical insight. Prioritize wit and clever jokes even on serious topics.`
    }
  ];
  let text = await callChatApi(messages, 80);
  text = text.replace(/[*_`~#>\-]/g, '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  // Supprime les guillemets en début et fin de réponse
  text = text.replace(/^['"“”«»]+|['"“”«»]+$/g, '');
  if (text.length > 280) text = text.slice(0, 280);
  return text.trim();
}

