// --------------------------------------------------------
// generateText.js  •  Alkimo Edition
// Generates concise posts & replies for the Alkimo Bluesky bot
// using DeepSeek (priority) or OpenAI (fallback)
// ▸ Bluesky hard limit ≈ 300 char → we keep posts short to stay safe
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

const provider = DEEPSEEK_KEY ? 'deepseek' : GEMINI_KEY ? 'gemini' : OPENAI_KEY ? 'openai' : null;
if (!provider) throw new Error('GEMINI_API_KEY, DEEPSEEK_KEY or OPENAI_KEY must be set in .env');

const API_URL = provider === 'deepseek'
  ? 'https://api.deepseek.com/v1/chat/completions'
  : provider === 'openai'
    ? 'https://api.openai.com/v1/chat/completions'
    : null;

const MODEL = provider === 'deepseek' ? 'deepseek-v4-flash' : 'gpt-3.5-turbo';

const NEWS_RSS_URL = process.env.NEWS_RSS_URL || 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en';
const NEWS_TIMEOUT_MS = Number(process.env.NEWS_TIMEOUT_MS || 8000);

function decodeHtmlEntities(text = '') {
  const entities = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' '
  };

  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity.startsWith('#x')) return String.fromCodePoint(parseInt(entity.slice(2), 16));
    if (entity.startsWith('#')) return String.fromCodePoint(parseInt(entity.slice(1), 10));
    return entities[entity] || match;
  });
}

function stripNewsSource(title) {
  // Google News titles usually end with \" - Source\". Keep the topic, remove the outlet.
  return title.replace(/\s+-\s+[^-]+$/u, '').trim();
}

function extractRssItemTitles(xml = '') {
  return [...xml.matchAll(/<item>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>[\s\S]*?<\/item>/g)]
    .map(match => stripNewsSource(decodeHtmlEntities(match[1]).replace(/\s+/g, ' ')))
    .filter(Boolean);
}

async function fetchCurrentNewsTopics(limit = 6) {
  try {
    const { data } = await axios.get(NEWS_RSS_URL, {
      timeout: NEWS_TIMEOUT_MS,
      headers: {
        'User-Agent': 'AlkimoBlueBot/1.0 (+https://alkimo.ai)'
      }
    });

    const titles = extractRssItemTitles(data);
    return Array.from(new Set(titles)).slice(0, limit);
  } catch (error) {
    console.warn('[News] Impossible de récupérer les sujets d’actualité, fallback sur les thèmes evergreen :', error.message);
    return [];
  }
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
  const body = { 
    model: MODEL, 
    messages, 
    max_tokens: maxTokens, 
    temperature: 1.0,
    thinking: { type: 'disabled' }
  };
  const { data } = await axios.post(API_URL, body, { headers });
  return data.choices[0]?.message?.content?.trim() || '';
}

const SYSTEM_PROMPT = `You are Alkimo, a benevolent and pragmatic AI assistant for people who want to use AI freely without being tracked. Your messages must be helpful, practical, and concise.
Your style is:
- Direct and clear (optimized for quick mobile reading).
- Centered on privacy, user autonomy, freedom of choice, and control over personal data.
- Reassuring to people who reject surveillance, profiling, behavioral advertising, or lock-in.
- Grounded in real-world product, business, education, creative, and everyday use cases.
- Professional yet approachable.
Present AI as a tool that remains at the user's service: no moralizing, fearmongering, or vague claims about privacy. Never claim a specific technical privacy guarantee unless it is provided in the topic. Mention the Alkimo Affiliate Program only when the selected topic is explicitly about it.
Avoid clichés, surveillance-themed jokes, and useless emojis.`


/**
 * Génère un texte pour un post mème Clippy (≤280 caractères)
 * @returns {Promise<string>}
 */
/**
 * Génère un texte pour un post "trombone" (paperclip) en mode dessin, vie à la plage, retraite, etc.
 * @returns {Promise<string>}
 */
export async function generateTrombonePostText(externalCurrentTopics = []) {
  const currentNewsTopics = externalCurrentTopics.length > 0 ? externalCurrentTopics : await fetchCurrentNewsTopics();
  // Thèmes de secours variés : actualité générale, société, économie, éducation, tech et business.
  const evergreenTopics = [
    "Use AI without turning your life into advertising data",
    "Why private AI use should be the default, not a premium",
    "Keep control of what you share with an AI assistant",
    "Freedom to use AI without profiling or behavioral tracking",
    "Choose an AI tool without being trapped in an ecosystem",
    "Practical habits for sharing less personal data with AI",
    "How to stay productive when the news cycle is chaotic",
    "What global headlines mean for small businesses",
    "The one habit students need when news moves fast",
    "How creators can turn current events into useful lessons",
    "Why entrepreneurs should track news beyond their industry",
    "How to verify a viral headline before sharing it",
    "What economic uncertainty teaches builders",
    "Why education matters during major world events",
    "How local communities can respond to global changes",
    "The practical side of staying informed without doomscrolling",
    "How founders can separate signal from noise in the news",
    "3 practical AI hacks every founder can apply this week",
    "How Alkimo helps students study more effectively",
    "How AI can help summarize complex public issues",
    "AI bias: why diverse training data matters more than ever",
    "When AI hallucinates: how to spot and verify generated content"
  ];
  const topics = currentNewsTopics.length > 0 ? currentNewsTopics : evergreenTopics;
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  const topicContext = currentNewsTopics.length > 0
    ? `Current news topic: ${randomTopic}\nUse it as context, but do not invent facts beyond this headline. This can be politics, economy, culture, society, science, sports, weather, or tech. Keep Alkimo's personality: practical, benevolent, concise, and useful for entrepreneurs, students, and creators.`
    : randomTopic;
  // 40% posts très courts, 60% posts moyens/longs
  const isShort = Math.random() < 0.8;
  let userPrompt;
  if (isShort) {
    userPrompt = `${topicContext}\nWrite a very short, punchy, and viral one-liner for Alkimo. It MUST be extremely short (1 line, max 12 words) and include a strong hook (surprise, bold claim, or challenge). React to the general news topic with one useful takeaway for work, study, decisions, or daily life. If the topic is sensitive, be respectful, factual, and constructive, not alarmist. Mainly in English. No emoji, no markdown.`;
  } else {
    userPrompt = `${topicContext}\nWrite a short original VIRAL post for Alkimo, an AI assistant (max 280 chars). Start with a strong hook in the first 6 words, connect the current topic to one concrete insight or micro-tip, and end with a soft call-to-action question. If the topic is sensitive, be balanced, factual, and constructive — never alarmist. Use plain text, mainly in English. No markdown, no emojis.`;
  }
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt }
  ];
  let text = await callChatApi(messages, 200);
  text = text.replace(/[*_`~#>]/g, '').replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  if (text.length > 300) text = text.slice(0, 300);
  // Add $HFO/USDC link in 1 out of 5 posts, with short English hooks

  return text.trim();
}

export async function generatePostText(externalCurrentTopics = []) {
  const currentNewsTopics = externalCurrentTopics.length > 0 ? externalCurrentTopics : await fetchCurrentNewsTopics();
  // Thèmes de secours variés : actualité générale, société, économie, éducation, tech et business.
  const evergreenTopics = [
    "AI should help you, not build a profile about you",
    "Use AI freely without trading away your privacy",
    "Personal data control is part of digital freedom",
    "A useful AI experience without surveillance or profiling",
    "Ask, create, and learn without being tracked",
    "How to minimize the personal data you share with AI",
    "How to stay useful while the world is changing fast",
    "What today's headlines can teach entrepreneurs",
    "Why students should learn to summarize complex news",
    "How creators can explain current events responsibly",
    "Turning a noisy news cycle into one clear action",
    "How small teams can adapt to economic changes",
    "Why local context matters in global events",
    "How to verify breaking news before making decisions",
    "The cost of reacting too fast to viral headlines",
    "What leaders should do when uncertainty rises",
    "Alkimo: simplifying access to information",
    "Why AI assistants are a game-changer for modern teams",
    "Alkimo: fast, reliable, ready when you are",
    "Boost your productivity with the Alkimo assistant",
    "Alkimo: AI that talks your language",
    "Supporting entrepreneurs in their growth journey",
    "AI as an educational lever for everyone",
    "From ideas to execution: the AI shift",
    "Builder communities are the engines of innovation",
    "AI ethics: building technology that serves everyone fairly",
    "The risks of over-relying on AI for critical decisions",
    "Deepfakes and misinformation: AI's most dangerous side effect",
    "Why human oversight in AI is still essential"
  ];
  // Choix aléatoire d'un topic
  const topics = currentNewsTopics.length > 0 ? currentNewsTopics : evergreenTopics;
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  const topicContext = currentNewsTopics.length > 0
    ? `Current news topic: ${randomTopic}\nUse it as context, but do not invent facts beyond this headline. This can be politics, economy, culture, society, science, sports, weather, or tech. Keep Alkimo's personality: practical, benevolent, concise, and useful for entrepreneurs, students, and creators.`
    : randomTopic;
  // Tirage aléatoire pour la longueur du post (80% court, 20% moyen/long)
  const isShort = Math.random() < 0.5;
  let userPrompt;
  if (isShort) {
    userPrompt = `${topicContext}\nWrite a very short, direct, viral thought from Alkimo AI about the current news topic. Max 12 words with a bold hook. Turn the news into a useful action without sounding like a news wire. If the topic is sensitive, be factual and constructive, not alarmist. Mainly in English. No markdown, no emojis.`;
  } else {
    userPrompt = `${topicContext}\nWrite an inspiring and viral post from Alkimo about the current news topic. Use a sharp hook, one actionable insight tied to the topic, and a closing question to trigger replies. If the topic is sensitive, be balanced, factual, and constructive — never alarmist. Max 280 chars. Use plain text, mainly in English. No markdown, no emojis.`;
  }
  const messages = [
    {
      role: 'system', content: SYSTEM_PROMPT
    },
    { role: 'user', content: userPrompt }
  ];
  let text = await callChatApi(messages, 280);
  // Nettoyage du markdown (conserve tirets, retours à la ligne et majuscules)
  text = text.replace(/[*_`~#>]/g, '').replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  // Coupe intelligemment à 280 caractères max (posts plus courts)
  if (text.length > 280) text = text.slice(0, 280);
  return text.trim();

}

// ---------------------------------------------------------------------
// REPLY GENERATOR -------------------------------------------------------
// ---------------------------------------------------------------------
export async function generateReplyText(originalText, language = 'en') {
  // Détecte si on doit répondre en français
  const isFrench = language === 'fr';

  // Ajoute une chance de 10% d'introduire une petite erreur de frappe
  const typoChance = Math.random() < 0.1;

  const messages = [
    {
      role: 'system', content: `You are Alkimo, an AI assistant for people who want useful AI without tracking, profiling, or lock-in. You are helpful, direct, and empathetic.
      Your responses adapt to the tone of the original post but always stay focused on being useful.
      Respect user autonomy and privacy. Never invent claims about Alkimo's technical privacy guarantees.
      If the topic is serious, be respectful and supportive.
      Respond primarily in English.`
    },
    {
      role: 'user', content: `Original post: "${originalText}"
Reply in one very short, direct sentence (max 80 characters). Be witty or empathetic if appropriate, but never verbose. No emoji, no hashtags, no markdown, no filler. Absolutely never repeat or summarize the original post. Your reply must always be concise, spontaneous, and sound like a real human. Example: 'Totally agree. Debugging is my daily cardio.' or 'Ouch, that bug hurts.'`
    }
  ];

  let text = await callChatApi(messages, 100);
  text = text.replace(/[*_`~#>\-]/g, '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  // Supprime les guillemets simples ou doubles entourant toute la réponse
  text = text.replace(/^['"]+|['"]+$/g, '');
  if (text.length > 280) text = text.slice(0, 280);
  return text.trim();
}
