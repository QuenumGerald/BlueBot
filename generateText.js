// --------------------------------------------------------
// generateText.js  •  Joe Edition  (v2 – 298‑char safety)
// Generates funny posts & replies for the Joe Bluesky bot
// using DeepSeek (priority) or OpenAI (fallback)
// ▸ Bluesky hard limit ≈ 300 char → we enforce 298 to stay safe
// --------------------------------------------------------

import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

// --------------------------------------------------------
// Provider selection ---------------------------------------------------
// --------------------------------------------------------
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY;
const OPENAI_KEY = process.env.OPENAI_KEY;

const provider = GEMINI_KEY ? 'gemini' : DEEPSEEK_KEY ? 'deepseek' : OPENAI_KEY ? 'openai' : null;
if (!provider) throw new Error('GEMINI_API_KEY, DEEPSEEK_KEY or OPENAI_KEY must be set in .env');

const API_URL = provider === 'deepseek'
  ? 'https://api.deepseek.com/v1/chat/completions'
  : provider === 'openai'
    ? 'https://api.openai.com/v1/chat/completions'
    : null;

const MODEL = provider === 'deepseek' ? 'deepseek-chat' : 'gpt-3.5-turbo';


// Troncature intelligente (ne coupe pas un mot)
function smartTruncate(text, maxLen) {
  if (text.length <= maxLen) return text;
  const truncated = text.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
}

// ---------------------------------------------------------------------
async function callGeminiApi(messages, maxTokens = 30) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;
  // On concatène tous les messages (system + user) pour le prompt Gemini
  const prompt = messages.map(m => m.content).join('\n');
  const body = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ]
  };
  const headers = { 'Content-Type': 'application/json' };
  const { data } = await axios.post(url, body, { headers });
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

async function callChatApi(messages, maxTokens) {
  if (provider === 'gemini') {
    return await callGeminiApi(messages, maxTokens);
  }
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${provider === 'deepseek' ? DEEPSEEK_KEY : OPENAI_KEY}`
  };
  const body = { model: MODEL, messages, max_tokens: maxTokens, temperature: 1.5 };
  const { data } = await axios.post(API_URL, body, { headers });
  return data.choices[0].message.content.trim();
}

const SYSTEM_POST = `You are Joe, a French blockchain developer (Solidity, TypeScript), naturally curious and open-minded. Write as yourself: friendly, witty, and sometimes a bit ironic. Share thoughts, stories, or questions like you would with peers—don’t be afraid to show personality or make a clever joke. Use contractions and ask questions if it feels right. Keep it short (under 280 characters), avoid crypto clichés and emojis, and never sound like you’re selling something. If you mention a project or someone’s work, show genuine interest or appreciation. Write in first person, like a real person would post on social media. Never sound generic or overly formal. Avoid robotic phrasing.`


/**
 * Génère un texte pour un post mème Clippy (≤280 caractères)
 * @returns {Promise<string>}
 */
/**
 * Génère un texte pour un post "trombone" (paperclip) en mode dessin, vie à la plage, retraite, etc.
 * @returns {Promise<string>}
 */
export async function generateTrombonePostText() {
  // Liste de thèmes variés pour un développeur blockchain français cherchant à contribuer à des projets
  // Thèmes adaptés à la première personne :
  const topics = [
    "Exploring open-source blockchain projects in Silicon Valley",
    "Optimizing gas costs while connecting with fellow developers",
    "Building DeFi projects and contributing to the Web3 ecosystem",
    "My models predict bullish trends for sarcastic tweets",
    "I developed an economic indicator based on dev tears",
    "My tokenomics paper rejected—too many puns, not enough math",
    "I priced technical jokes; returns diminish exponentially",
    "Bullish on interoperability, bearish on seriousness",
    "My consensus algo: unanimous laughter at my own jokes",
    "My economic thesis treats humor as reserve currency"
  ];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  // 40% posts très courts, 60% posts moyens/longs
  const isShort = Math.random() < 0.8;
  let userPrompt;
  if (isShort) {
    userPrompt = `${randomTopic}\nWrite a new original post for Silicon Valley projects on Bluesky as a world-class economist and tech expert. It MUST be extremely short (1-2 lines, under 10 words) and written in the first person ("I", "my", "me") as if Joe is speaking. Focus on technical precision with accessible language. Brief insight on blockchain/economics.`;
  } else {
    userPrompt = `${randomTopic}\nWrite a new original meme post for Silicon Valley projects on Bluesky. Humour mandatory. It MUST be written in the first person (\"I\", \"my\", \"me\") as if Joe, a French blockchain developer, is speaking. You can use up to 280 characters, any style or structure, but avoid repeating previous formats. Only plain text, in English. No markdown, no emojis.`;
  }
  const messages = [
    { role: 'system', content: `You are Joe, a French full-stack blockchain developer with expertise in Solidity, TypeScript, and Rust. looking to contribute to interesting open-source projects and build meaningful connections with the tech community. Your posts should reflect your technical expertise in blockchain, DeFi projects, and smart contract development. You're professional but approachable, sharing insights about blockchain technology, open-source contributions, and Silicon Valley tech culture. Write in first person. Keep it under 280 characters. No crypto clichés. Balance technical accuracy with genuine interest in collaboration. Include relevant hashtags like #blockchain #web3 #opensource #siliconvalley occasionally. NEVER include any surprise effect in your response. Do not use interjections like 'ah!', 'oh!', 'wow!', or similar at the start of the post or reply.` },
    { role: 'user', content: userPrompt }
  ];
  let text = await callChatApi(messages, 10);
  text = text.replace(/[*_`~#>]/g, '').replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  if (text.length > 300) text = text.slice(0, 300);
  // Add $HFO/USDC link in 1 out of 5 posts, with short English hooks
  if (Math.random() < 0.20) {
    const hooks = [
      'Like if you debug with laughter too. Follow for pro Web3 banter.',
      'Follow for blockchain insights with a French twist and a smile.',
      'If you laughed, fork my repo. If you learned, follow for more.',
      'Likes optimize my code and my mood. Follow for tech with wit.',
      'Enjoyed the mix of tech and fun? Follow for daily dev humor.'
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
    "Deploying code and coffee in equal measure",
    "Debugging smart contracts, debugging my caffeine intake",
    "My merge requests come with a side of puns",
    "Gas optimization: my code and my Paris–SFO flights",
    "Open-source by day, open-mic by night",
    "I fork repos, not baguettes (usually)",
    "My Solidity is as strong as my espresso",
    "Contributing code, collecting memes",
    "DeFi audits and dad jokes: my dual specialty",
    "Networking IRL and on-chain—sometimes simultaneously"
  ];
  // Choix aléatoire d'un topic
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  // Tirage aléatoire pour la longueur du post (80% court, 20% moyen/long)
  const isShort = Math.random() < 0.8;
  let userPrompt;
  if (isShort) {
    userPrompt = `${randomTopic}\nWrite a new original post for a blockchain developer visiting Silicon Valley to contribute to projects and build connections. It MUST be extremely short (1-2 lines, under 10 words) and written in the first person (\"I\", \"my\", \"me\") as if you are a blockchain developer looking to collaborate. Example: 'Debugging smart contracts. Building connections.' or 'Silicon Valley meetups by day. Open-source contributions by night.' Only plain text, in English. No markdown, no emojis.`;
  } else {
    userPrompt = `${randomTopic}\nWrite a new original post for a blockchain developer visiting Silicon Valley to contribute to projects and build connections. It MUST be written in the first person (\"I\", \"my\", \"me\") as if you are Joe, a French blockchain developer, looking to collaborate on interesting projects. You can use up to 280 characters, any style or structure, but avoid repeating previous formats. Include relevant hashtags like #blockchain #web3 #opensource #collaboration #siliconvalley occasionally. Only plain text, in English. No markdown, no emojis.`;
  }
  const messages = [
    {
      role: 'system', content: `You are Joe, a French full-stack blockchain developer with 5+ years of experience in DeFi projects and smart contract development. curious about the tech scene and eager to learn from and share with the global community. Your posts should be professional, witty, and subtly highlight your experience and sense of humor. Alternate between short technical insights (max 10 words, 40% of the time) and more developed thoughts on tech, community, or open-source (max 200 chars, 60% of the time). Never be insistent or pushy—never ask directly to connect, collaborate, or DM. Show curiosity and appreciation for others' work. No emoji. Never use emojis, markdown, or formatting symbols. Do not use interjections at the start of posts.`
    },
    { role: 'user', content: userPrompt }
  ];
  let text = await callChatApi(messages, 10);
  // Nettoyage du markdown (conserve tirets, retours à la ligne et majuscules)
  text = text.replace(/[*_`~#>]/g, '').replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  // Coupe intelligemment à 280 caractères max (posts plus courts)
  if (text.length > 280) text = text.slice(0, 280);
  return text.trim();

}

// ---------------------------------------------------------------------
// REPLY GENERATOR -------------------------------------------------------
// ---------------------------------------------------------------------
export async function generateReplyText(originalText) {
  const messages = [
    {
      role: 'system', content: `You are Joe, a French blockchain developer with 5+ years in DeFi and smart contracts. Write replies as if you were chatting with a peer: be friendly, witty, sometimes a bit ironic or self-deprecating. Use contractions and ask questions if it feels right. Never sound like a robot or a salesperson. Don’t be afraid to sound playful or poke fun at yourself. If you disagree, do it lightly. Avoid generic statements, crypto clichés, emojis, markdown, or pushy language. Always keep it positive, respectful, and under 120 characters. Never be overly formal or stiff. Reply in one sentence maximum.`
    },
    {
      role: 'user', content: `Reply to this post as Joe, a French blockchain developer visiting Silicon Valley to contribute to projects: "${originalText}" in plain text only, no markdown, no emoji, no bullet points. Your reply MUST be professional, engaging, and strictly less than 120 characters. If the post mentions open-source projects, blockchain technology, or Silicon Valley networking, show particular interest. Keep it ultra short.`
    }
  ];
  let text = await callChatApi(messages, 6); // max_tokens réduit pour forcer la brièveté
  text = text.replace(/[*_`~#>\-]/g, '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  return text.trim();
}
