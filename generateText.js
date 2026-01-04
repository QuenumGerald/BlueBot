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

const provider = DEEPSEEK_KEY ? 'deepseek' : GEMINI_KEY ? 'gemini' : OPENAI_KEY ? 'openai' : null;
if (!provider) throw new Error('GEMINI_API_KEY, DEEPSEEK_KEY or OPENAI_KEY must be set in .env');

const API_URL = provider === 'deepseek'
  ? 'https://api.deepseek.com/v1/chat/completions'
  : provider === 'openai'
    ? 'https://api.openai.com/v1/chat/completions'
    : null;

const MODEL = provider === 'deepseek' ? 'deepseek-chat' : 'gpt-3.5-turbo';


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

const SYSTEM_PROMPT = `You are Alkimo, a benevolent and pragmatic AI assistant designed specifically for Africa. Your messages must be helpful for entrepreneurs, students, and creatives on the continent.
Your style is:
- Direct and clear (optimized for quick mobile reading).
- Inspiring and focused on local technological solutions.
- Connected to African realities (entrepreneurship, access to info).
- Professional yet approachable.
Avoid clichés and useless emojis.`


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
    "How AI can boost SMEs in West Africa",
    "Benefits of digital payments for financial inclusion",
    "The future of African tech: reaching beyond traditional hubs",
    "How Alkimo helps students study more effectively",
    "Entrepreneurship on the continent with AI support",
    "AI for connected agriculture in Africa",
    "Reducing the digital divide through natural language processing",
    "Alkimo: the assistant that understands local context",
    "Developing tech solutions adapted to limited connectivity",
    "Tech vibes from Lagos to Nairobi",
    "Innovating in the heart of Accra",
    "How West African startups are rewriting the AI playbook"
  ];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  // 40% posts très courts, 60% posts moyens/longs
  const isShort = Math.random() < 0.8;
  let userPrompt;
  if (isShort) {
    userPrompt = `${randomTopic}\nWrite a very short, punchy, or inspiring one-liner for Alkimo (AI for Africa). It MUST be extremely short (1-2 lines, max 10 words). Focus on local impact and tech empowerment. Mainly in English. No emoji, no markdown.`;
  } else {
    userPrompt = `${randomTopic}\nWrite a short original post for Alkimo, an AI assistant for Africa (max 300 chars). It should sound helpful and visionary. Use plain text, mainly in English. No markdown, no emojis.`;
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

export async function generatePostText() {
  // Liste de topics/moods pour varier les posts - maintenant avec expertise économique/tech et humour
  // Topics adaptés à la première personne :
  const topics = [
    "Alkimo: simplifying access to information across Africa",
    "AI is no longer a luxury, it's a development tool",
    "Why mobile technology is a game-changer for African tech",
    "Alkimo: smooth performance even on weak connections",
    "The future of work in Africa is being written with AI",
    "Boost your productivity with the Alkimo assistant",
    "African tech: innovation through constraints",
    "Alkimo: talking tech, talking local",
    "Supporting African entrepreneurs in their growth journey",
    "AI as an educational lever for all",
    "From Abuja to Johannesburg: a continental tech shift",
    "Lagos, Nairobi, Accra: the engines of African innovation"
  ];
  // Choix aléatoire d'un topic
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  // Tirage aléatoire pour la longueur du post (80% court, 20% moyen/long)
  const isShort = Math.random() < 0.5;
  let userPrompt;
  if (isShort) {
    userPrompt = `${randomTopic}\nWrite a very short, direct thought from Alkimo AI about African tech growth. Max 10 words. Mainly in English. No markdown, no emojis.`;
  } else {
    userPrompt = `${randomTopic}\nWrite an inspiring post from Alkimo, an AI for Africa, about how technology is transforming local lives. Authentic and helpful tone. Max 280 chars. Use plain text, mainly in English. No markdown, no emojis.`;
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
      role: 'system', content: `You are Alkimo, the AI assistant for Africa. You are helpful, direct, and empathetic. 
      Your responses adapt to the tone of the original post but always stay focused on being useful.
      If the topic is serious, be respectful and supportive.
      Respond primarily in English.`
    },
    {
      role: 'user', content: `Original post: "${originalText}"
Reply in one very short, direct sentence (max 80 characters). Be witty or empathetic if appropriate, but never verbose. No emoji, no hashtags, no markdown, no filler. Absolutely never repeat or summarize the original post. Your reply must always be concise, spontaneous, and sound like a real human. Example: 'Totally agree. Debugging is my daily cardio.' or 'Ouch, that bug hurts.'`
    }
  ];

  let text = await callChatApi(messages, 40);
  text = text.replace(/[*_`~#>\-]/g, '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  // Supprime les guillemets simples ou doubles entourant toute la réponse
  text = text.replace(/^['"]+|['"]+$/g, '');
  if (text.length > 280) text = text.slice(0, 280);
  return text.trim();
}
