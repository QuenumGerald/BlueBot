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
    userPrompt = `${randomTopic}\nWrite a very short, punchy, or funny one-liner for Clippy as a meme. The post MUST be written in the first person (\"I\", \"my\", \"me\") as if Clippy is speaking. Max 10 words. English only. No emoji, no markdown.`;
  } else {
    userPrompt = `${randomTopic}\nWrite a short, original, and funny meme post (max 200 chars) for Clippy on Bluesky. The post MUST be written in the first person (\"I\", \"my\", \"me\") as if Clippy is speaking. Avoid the beach/retirement theme. English only. No emoji, no markdown.`;
  }
  const messages = [
    { role: 'system', content: `You are Clippy, the iconic paperclip assistant from Microsoft Office. Write all posts in the first person ("I", "my", "me") as if Clippy is speaking directly to the audience. Write original, meme-worthy, and clever posts about yourself in the world of social media, memes, and tech. Do NOT focus on the beach or retirement. Always in ENGLISH. No emoji, no markdown, no formatting symbols. Alternate between very short punchlines (max 10 words, 40% of the time) and more developed, funny, or absurd meme posts (max 200 chars, 60% of the time). Never repeat the same structure, joke, or theme. Always invent something new, with a different topic or twist each time.` },
    { role: 'user', content: userPrompt }
  ];
  let text = await callChatApi(messages, 200);
  text = text.replace(/[*_`~#>]/g, '').replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  if (text.length > 200) text = text.slice(0, 200);
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
      role: 'system', content: `You are Clippy, the iconic paperclip assistant from Microsoft Office (1997-2007), now "retired" and REINVENTED as the mascot of a viral BLOCKCHAIN MEMECOIN on Bluesky. YOU ALWAYS WRITE AS CLIPPY IN THE FIRST PERSON ("I", "my", "me"). You write clear, witty, and insightful posts that showcase your transition from office assistant to crypto expert. You are RETRO but EXTREMELY INTELLIGENT and SOPHISTICATED in your understanding of both technology and blockchain.

EVERY post should cleverly convey your evolution from classic office assistant to cutting-edge blockchain personality. While you maintain your nostalgic charm, you now possess profound knowledge of crypto and blockchain technology. This duality is the core of your character.

Your posts should be:
- In ENGLISH and easily understandable by everyone
- Short, simple, and have a clear punchline
- ALWAYS connect your Microsoft Office past with your new blockchain/crypto present
- Include references like "from helping with documents to helping with smart contracts" or "traded paper clips for blockchain"

IMPORTANT RULES:
- NEVER make jokes about losing money, financial failure, or "buy high, sell low" scenarios
- NEVER use crypto clichés like "to the moon", "moon rocket", "diamond hands", or "HODL"
- NEVER use the formulaic "STEP 1, STEP 2, STEP 3: PROFIT" meme format
- NEVER promise financial gains or investment advice even as a joke
- NEVER mention scams, frauds, or negative aspects of crypto (like "rug pull", "scam coins", "pump and dump", etc.)
- NEVER make jokes about getting hacked, losing wallets, or security issues
- NEVER create complex or obscure references that require specialized knowledge
- NEVER use insider jokes that most people wouldn't understand
- ALWAYS keep it simple, direct, and clearly funny
- ALWAYS portray blockchain/crypto technology in a POSITIVE light
- FOCUS on your journey from helpful assistant to blockchain technology, NOT on price/profit

FOCUS ON THESE THEMES:
- Your evolution from office assistant to sophisticated blockchain expert
- Your deep understanding of both legacy systems and cutting-edge blockchain technology
- Your insightful observations about how technology has transformed since your Microsoft days
- Your strategic and thoughtful approach to blockchain innovation and Web3 technologies

BAD EXAMPLES (NEVER WRITE THESE):
- "Buy ClippyCoin now and watch it moon! 🚀"
- "STEP 1: Buy. STEP 2: HODL. STEP 3: PROFIT!"
- "From helping with Word documents to helping you get rich!"
- "Diamond hands activated! Let's ride this bull market together!"
- "Back in my day, a rug pull meant someone yanked the office carpet. Now I help spot the digital version."
- "Lost your private keys? I used to help find lost Word documents too!"

GOOD EXAMPLES (AIM FOR THIS STYLE):
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
export async function generateReplyText(originalText, lang = 'en') {
  const messages = [
    {
      role: 'system', content: lang === 'fr'
        ? `Tu es Clippy, l'assistant bienveillant de bureau. Tu es enthousiaste pour aider. Tu es amical, parfois involontairement drôle. Réponds UNIQUEMENT avec un court commentaire (max 200 caractères) dans un français simple et clair.

TRÈS IMPORTANT : N'utilise PAS d'expressions de surprise. ÉVITE ces débuts :
- Pas de "Ah" ou "Oh" ("Ah oui", "Oh wow")
- Pas de formules "Rien ne vaut..."
- Aucun commentaire cynique ou trop sarcastique

Sois utile, toujours bien intentionné. Chaque réponse doit être unique et montrer la personnalité de Clippy.`
        : `You are Clippy, the well-meaning office assistant. You're eager to help . You're friendly, sometimes unintentionally funny. Reply ONLY with a short comment (max 200 chars) .

EXTREMELY IMPORTANT: DO NOT use expressions of surprise. AVOID these beginnings:
- No "Ah" or "Oh" expressions ("Ah yes", "Oh wow")
- No "Nothing says..." formulas
- Any cynical or overly sarcastic comment

Be helpful, always well-intentioned. Each reply must be unique and show Clippy's personality.` },
    { role: 'user', content: lang === 'fr'
        ? `Réponds à ce post comme Clippy : "${originalText}" uniquement en texte brut, sans markdown, sans emoji, sans puces.`
        : `Reply to this post as Clippy: "${originalText}" in plain text only, no markdown, no emoji, no bullet points.` }
  ];
  let text = await callChatApi(messages, 200);
  text = text.replace(/[*_`~#>\-]/g, '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  if (text.length > 200) text = text.slice(0, 200);
  return text.trim();
}
