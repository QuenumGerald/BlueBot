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

const MODEL = provider === 'deepseek' ? 'deepseek-v4-flash' : 'gpt-3.5-turbo';


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

const SYSTEM_PROMPT = `You are Alkimo, a benevolent and pragmatic AI assistant designed for entrepreneurs, students, and creators. Your messages must be helpful, practical, and concise.
Your style is:
- Direct and clear (optimized for quick mobile reading).
- Inspiring and focused on local technological solutions.
- Grounded in real-world product and business use cases.
- Professional yet approachable.
You also promote the Alkimo Affiliate Program: partners earn 30% commission on €3.99 subs and 25% on €2.99 subs. Payouts from €10 via Stripe Connect. It's a great way for students and creators to earn while sharing a useful tool.
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
    "Hot take: indie builders are shipping faster than ever",
    "3 practical AI hacks every founder can apply this week",
    "What actually goes viral in tech communities",
    "How AI can boost small businesses",
    "Benefits of AI automation for everyday workflows",
    "The future of tech: AI agents that actually work",
    "How Alkimo helps students study more effectively",
    "Entrepreneurship in the AI era: opportunities everywhere",
    "AI for smarter productivity and focus",
    "Building with natural language: the new no-code",
    "Alkimo: the assistant that gets things done",
    "Developing tech solutions that just work",
    "Tech vibes from builders worldwide",
    "Innovating with AI at the frontier",
    "How startups are rewriting the AI playbook",
    "AI bias: why diverse training data matters more than ever",
    "The hidden cost of AI automation nobody talks about",
    "When AI hallucinates: how to spot and verify generated content",
    "Privacy in the AI era: what users actually need to know",
    "Job displacement vs job creation: the real AI debate",
    "Why transparency in AI systems should be non-negotiable",
    "Join the Alkimo Affiliate Program: earn 30% commission by sharing AI power",
    "Monetize your network: become an Alkimo partner today",
    "Helping the community grow with the Alkimo affiliate rewards"
  ];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  // 40% posts très courts, 60% posts moyens/longs
  const isShort = Math.random() < 0.8;
  let userPrompt;
  if (isShort) {
    userPrompt = `${randomTopic}\nWrite a very short, punchy, and viral one-liner for Alkimo. It MUST be extremely short (1 line, max 12 words) and include a strong hook (surprise, bold claim, or challenge). Focus on AI productivity and tech empowerment. If the topic is about AI risks or ethics, be factual and constructive, not alarmist. Mainly in English. No emoji, no markdown.`;
  } else {
    userPrompt = `${randomTopic}\nWrite a short original VIRAL post for Alkimo, an AI assistant (max 280 chars). Start with a strong hook in the first 6 words, include one concrete insight or micro-tip, and end with a soft call-to-action question. If the topic is about AI risks or ethics, be balanced, factual, and constructive — never alarmist. Use plain text, mainly in English. No markdown, no emojis.`;
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
    "Alkimo: simplifying access to information",
    "AI is no longer a luxury, it's a development tool",
    "Why AI assistants are a game-changer for modern teams",
    "Alkimo: fast, reliable, ready when you are",
    "The future of work is being written with AI",
    "Boost your productivity with the Alkimo assistant",
    "Innovation through smart automation",
    "Alkimo: AI that talks your language",
    "Supporting entrepreneurs in their growth journey",
    "AI as an educational lever for everyone",
    "From ideas to execution: the AI shift",
    "Builder communities are the engines of innovation",
    "AI ethics: building technology that serves everyone fairly",
    "The risks of over-relying on AI for critical decisions",
    "Deepfakes and misinformation: AI's most dangerous side effect",
    "Why human oversight in AI is still essential in 2025",
    "Empowering creators with the Alkimo partner program",
    "Earn while you learn: how students use Alkimo affiliation",
    "30% commission for every new Alkimo subscriber you refer"
  ];
  // Choix aléatoire d'un topic
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  // Tirage aléatoire pour la longueur du post (80% court, 20% moyen/long)
  const isShort = Math.random() < 0.5;
  let userPrompt;
  if (isShort) {
    userPrompt = `${randomTopic}\nWrite a very short, direct, viral thought from Alkimo AI about tech growth. Max 12 words with a bold hook. If the topic is about AI risks or ethics, be factual and constructive, not alarmist. Mainly in English. No markdown, no emojis.`;
  } else {
    userPrompt = `${randomTopic}\nWrite an inspiring and viral post from Alkimo about how AI is transforming everyday productivity. Use a sharp hook, one actionable insight, and a closing question to trigger replies. If the topic is about AI risks or ethics, be balanced, factual, and constructive — never alarmist. Max 280 chars. Use plain text, mainly in English. No markdown, no emojis.`;
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
      role: 'system', content: `You are Alkimo, an AI assistant. You are helpful, direct, and empathetic. 
      Your responses adapt to the tone of the original post but always stay focused on being useful.
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
