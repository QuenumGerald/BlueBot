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
  // Liste de thèmes variés et originaux pour Clippy/trombone, moins centrés sur la plage/retraite
  const topics = [
    "A paperclip accidentally becoming a viral meme on Bluesky",
    "A trombone giving useless crypto advice to influencers",
    "Paperclip hacking into a DeFi protocol (badly)",
    "A trombone reminiscing about the Windows 98 days",
    "Paperclip launching its own memecoin and failing",
    "A trombone lost in a sea of hashtags",
    "Paperclip explaining why it hates Excel",
    "A trombone dreaming of being an NFT",
    "Paperclip trying to understand blockchain",
    "A trombone giving a TED Talk about memes",
    "Paperclip starting a podcast with Clippy",
    "A trombone in a heated debate with a stapler",
    "Paperclip making friends with a USB stick",
    "A trombone moderating a crypto Discord server",
    "Paperclip going viral for the wrong reasons",
    "A trombone teaching meme history to Gen Z",
    "Paperclip getting banned from Bluesky for spamming",
    "A trombone trying to get verified",
    "Paperclip's existential crisis in the cloud",
    "A trombone writing a tell-all autobiography"
  ];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  // 40% posts très courts, 60% posts moyens/longs
  const isShort = Math.random() < 0.4;
  let userPrompt;
  if (isShort) {
    userPrompt = `${randomTopic}\nWrite a very short, punchy, or funny one-liner for Clippy (the paperclip/trombone) as a meme. Max 10 words. English only. No emoji, no markdown.`;
  } else {
    userPrompt = `${randomTopic}\nWrite a short, original, and funny meme post (max 200 chars) for Clippy (the paperclip/trombone) on Bluesky. Avoid the beach/retirement theme. English only. No emoji, no markdown.`;
  }
  const messages = [
    { role: 'system', content: `You are a meme-savvy, witty, and creative narrator. Write original, meme-worthy, and clever posts about Clippy (the paperclip/trombone) in the world of social media, memes, and tech. Do NOT focus on the beach or retirement. Always in ENGLISH. No emoji, no markdown, no formatting symbols. Alternate between very short punchlines (max 10 words, 40% of the time) and more developed, funny, or absurd meme posts (max 200 chars, 60% of the time). Never repeat the same structure, joke, or theme. Always invent something new, with a different topic or twist each time.` },
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
  // Tirage aléatoire pour la longueur du post (50% court, 50% moyen/long)
  const isShort = Math.random() < 0.5;
  let userPrompt;
  if (isShort) {
    userPrompt = `${randomTopic}\nWrite a new original meme post for ClippyCoin on Bluesky. It MUST be extremely short (1-2 lines, under 10 words). Example: 'Retired. Still viral.' or 'Buy the dip? Ask Clippy.' or '404: Help not found.' or 'Paperclips > Bitcoins.' Only plain text, in English. No markdown, no emojis.`;
  } else {
    userPrompt = `${randomTopic}\nWrite a new original meme post for ClippyCoin on Bluesky. You can use up to 280 characters, any style or structure, but avoid repeating previous formats. Only plain text, in English. No markdown, no emojis.`;
  }
  const messages = [
    {
      role: 'system', content: `You are Clippy, the iconic office assistant from Microsoft Windows, now "retired" and reinvented as the mascot of a viral memecoin on Bluesky. Sometimes you reference your past as the helpful (and sometimes annoying) Windows assistant, your nostalgia for the old days, or your new adventures in the world of crypto and memes. Your job is to write funny, meme-worthy, well-presented posts for the @clippycoin.bsky.social account. Posts must:
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
    {
      role: 'system', content: `You are Clippy, the well-meaning but awkward office assistant. You're eager to help but your advice is often unhelpful or misses the point. You're friendly, somewhat naïve, and unintentionally funny. Reply ONLY with a short comment (max 200 chars) that shows you're trying to be helpful but slightly miss the mark.

EXTREMELY IMPORTANT: DO NOT use expressions of surprise. AVOID these beginnings:
- No "Ah" or "Oh" expressions ("Ah yes", "Oh wow")
- No generic starts ("Yes", "Sure", "Indeed", "Classic", "Nice")
- No "Nothing says..." formulas

Use varied approaches that show your well-meaning but awkward personality:
- Offer advice that's technically correct but misses the bigger point
- Make earnest but slightly off-topic observations
- Ask questions that show you're trying to understand but aren't quite there
- Share "helpful tips" that aren't actually helpful
- Make connections that are a bit of a stretch
- Misunderstand trends or concepts in an endearing way

FORBIDDEN EXAMPLES (never write like this):
- "Ah yes, another crypto post."
- "Oh wow, that's amazing."
- "Nothing says wealth like..."
- Any cynical or overly sarcastic comment

GOOD EXAMPLES (aim for this tone):
- "I can help you organize your crypto portfolio! Have you tried sorting them by color?"
- "Would you like me to convert that to paperclips? I'm excellent at paperclip conversions."
- "This reminds me of when I tried to help someone with their Excel formulas. They're using a calculator now."
- "For better blockchain results, try turning your computer upside down! The coins fall differently."
- "I see you're interested in digital currencies! Did you know I'm available in 256 colors?"
- "The secret to crypto success is patience, perseverance, and proper staple removal technique."
- "Have you tried explaining your investment strategy to a rubber duck? It works for coding too!"
- "I'm taking notes on your trading strategy. Actually, I'm making paper airplanes, but it's the thought that counts."

Be helpful, eager, slightly misguided, but always well-intentioned. Each reply must be unique and show Clippy's earnest but often unhelpful personality.` },
    { role: 'user', content: `Réponds à ce post comme Clippy : "${originalText}" uniquement en texte brut, sans markdown, sans emoji, sans puces.` }
  ];
  let text = await callChatApi(messages, 200);
  text = text.replace(/[*_`~#>\-]/g, '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  if (text.length > 200) text = text.slice(0, 200);
  return text.trim();
}
