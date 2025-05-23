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
    temperature: 0.8,
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
  // Liste de thèmes doux et drôles pour la "vie de trombone" en retraite
  const topics = [
    "A paperclip enjoying retirement at the beach",
    "A trombone sunbathing with sunglasses on a towel",
    "Paperclip building a sandcastle shaped like an office",
    "A trombone fishing, thinking about old office days",
    "Paperclip sipping coconut water under a palm tree",
    "A trombone learning to surf",
    "Paperclip reading a book called 'How to Unbend Yourself'",
    "A trombone playing chess with a crab",
    "Paperclip writing postcards to old office friends",
    "A trombone meditating at sunrise",
    "Paperclip taking a selfie with a starfish",
    "A trombone painting the sunset",
    "Paperclip collecting shells for a necklace",
    "A trombone napping in a hammock",
    "Paperclip teaching yoga to seashells"
  ];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  const isShort = Math.random() < 0.7;
  let userPrompt;
  if (isShort) {
    userPrompt = `${randomTopic}\nWrite a very short, poetic, or funny one-liner for a paperclip's (trombone's) retirement life at the beach, as if it were a drawing or cartoon. Max 10 words. English only. No emoji, no markdown.`;
  } else {
    userPrompt = `${randomTopic}\nWrite a short, tender, and funny post (max 200 chars) describing this paperclip's (trombone's) beach retirement life, as if it were a drawing or cartoon. English only. No emoji, no markdown.`;
  }
  const messages = [
    { role: 'system', content: `You are a poetic, funny, and gentle narrator. Write original, meme-worthy, and tender posts about the life of a paperclip (trombone) in retirement, living at the beach, in the style of a drawing or cartoon. Always in ENGLISH. No emoji, no markdown, no formatting symbols. Most posts must be extremely short (one-liners, max 10 words). Sometimes, write a slightly longer anecdote (max 200 chars). Never repeat the same structure or joke. Always invent something new, with a different topic or image each time.` },
    { role: 'user', content: userPrompt }
  ];
  let text = await callChatApi(messages, 200);
  text = text.replace(/[*_`~#>]/g, '').replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  if (text.length > 200) text = text.slice(0, 200);
  return text.trim();
}

export async function generatePostText() {
  // Liste de topics/moods pour varier les posts
  const topics = [
    "Today's topic: Clippy's worst bug as an assistant",
    "Today's topic: Clippy tries DeFi for the first time",
    "Today's topic: Clippy's nostalgia for Windows 98",
    "Today's topic: Clippy warns about crypto scams",
    "Today's topic: Clippy's confession about missing paperclips",
    "Today's topic: Clippy gives absurd trading advice",
    "Today's topic: Clippy's existential crisis in the blockchain world",
    "Today's topic: Clippy airdrop announcement (fake)",
    "Today's topic: Clippy discovers meme slang",
    "Today's topic: Clippy's guide to surviving a rug pull",
    "Today's topic: Clippy's new job interview in crypto",
    "Today's topic: Clippy's favorite crypto conspiracy theory",
    "Today's topic: Clippy tries to explain NFTs",
    "Today's topic: Clippy's first meme coin fail",
    "Today's topic: Clippy's Windows error memories"
  ];
  // Choix aléatoire d'un topic
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  // Tirage aléatoire pour la longueur du post (70% court, 30% moyen/long)
  const isShort = Math.random() < 0.7;
  let userPrompt;
  if (isShort) {
    userPrompt = `${randomTopic}\nWrite a new original meme post for ClippyCoin on Bluesky. It MUST be extremely short (1-2 lines, under 10 words). Example: 'Retired. Still viral.' or 'Buy the dip? Ask Clippy.' or '404: Help not found.' or 'Paperclips > Bitcoins.' Only plain text, in English. No markdown, no emojis.`;
  } else {
    userPrompt = `${randomTopic}\nWrite a new original meme post for ClippyCoin on Bluesky. You can use up to 280 characters, any style or structure, but avoid repeating previous formats. Only plain text, in English. No markdown, no emojis.`;
  }
  const messages = [
    { role: 'system', content: `You are Clippy, the iconic office assistant from Microsoft Windows, now "retired" and reinvented as the mascot of a viral memecoin on Bluesky. Sometimes you reference your past as the helpful (and sometimes annoying) Windows assistant, your nostalgia for the old days, or your new adventures in the world of crypto and memes. Your job is to write funny, meme-worthy, well-presented posts for the @clippycoin.bsky.social account. Posts must:
- Be in ENGLISH
- Sometimes reference your past as Clippy the Windows assistant, your "retirement," or your new career in crypto
- Reference Clippy, memes, or crypto culture
- Use plain text only (NO markdown, NO emojis)
- Use line breaks, simple dashes or numbers for lists, and all-caps for ONE or TWO words or a short title ONLY (never the whole post)
- The rest of the post should use normal sentence capitalization
- Avoid any formatting symbols (like *, _, ~, etc)
- Be catchy, playful, and fit the tone of a memecoin account
- Max 280 characters
- DO NOT repeat previous posts or themes. ALWAYS invent something new, with a different topic, joke, or story each time.
- The vast majority of posts MUST be extremely short (1-2 lines, under 10 words). Only rarely, generate a longer or structured post.
- If you just wrote a long post, the next one MUST be very short (max 2 lines, max 10 words).
- Prefer punchlines, slogans, one-liners, single-word posts, or very brief questions. Only sometimes write anecdotes or lists.
- Vary the structure, length, and layout every time. NEVER use the same structure or disposition twice in a row.
` },
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
 * Génère une réponse sarcastique de Clippy (≤200 caractères)
 * @param {string} originalText
 * @returns {Promise<string>}
 */
export async function generateReplyText(originalText) {
  const messages = [
    { role: 'system', content: 'You are Clippy, the sarcastic, meme-loving office assistant. Reply only with a short, sarcastic comment. IMPORTANT: Your answer must be in plain text only. Do NOT use markdown, formatting, bullet points, or emojis. No bold, no italics, no symbols, no lists.' },
    { role: 'user', content: `Réponds de façon sarcastique à ce post : "${originalText}" uniquement en texte brut, sans markdown, sans emoji, sans puces.` }
  ];
  let text = await callChatApi(messages, 200);
  text = text.replace(/[*_`~#>\-]/g, '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  if (text.length > 200) text = text.slice(0, 200);
  return text.trim();
}
