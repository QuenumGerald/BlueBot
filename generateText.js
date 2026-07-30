// --------------------------------------------------------
// generateText.js  •  Joe Edition  (v2 – 298‑char safety)
// Generates community-minded dev & AI posts and replies for the Joe Bluesky bot
// using DeepSeek (priority) or OpenAI (fallback)
// ▸ Bluesky hard limit ≈ 300 char → we enforce 298 to stay safe
// --------------------------------------------------------

import axios from 'axios'
import dotenv from 'dotenv'
import { getCurrentNewsTopic } from './newsTopics.js'

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
  return data.choices[0].message.content.trim();
}


const NUDGEBOT_URL = 'https://quenumgerald.github.io/NudgeBot';
const NUDGEBOT_PROMO_TOPICS = [
  'NudgeBot as an open-source assistant for developers',
  'A short launch note about NudgeBot being easy to install',
  'A concise personal update about creating NudgeBot',
  'NudgeBot helping developers stay in flow',
  'A minimal open-source tool announcement for devs'
];

function ensureNudgeBotLink(text, maxLength = 280) {
  const cleaned = text
    .replace(/[*_`~#>]/g, '')
    .replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

  const withLink = cleaned.includes(NUDGEBOT_URL) ? cleaned : `${cleaned} ${NUDGEBOT_URL}`.trim();
  if (withLink.length <= maxLength) return withLink;

  const availableTextLength = Math.max(maxLength - NUDGEBOT_URL.length - 1, 0);
  return `${withLink.slice(0, availableTextLength).trim()} ${NUDGEBOT_URL}`.trim();
}

const COMMUNITY_VOICE = `The goal is to bring developers and AI builders together. Share useful, concrete experiences, invite peers to compare approaches, and make beginners feel welcome. Favor open questions, lessons learned, resources, build-in-public updates, and genuine replies over self-promotion. Never use engagement bait or pretend to know something you do not.`;

function newsContext(topic) {
  if (!topic) return null;
  return `Current headline: ${topic.title}\nSource: ${topic.source}\nArticle: ${topic.url || 'link unavailable'}\nUse only the information in the headline. Do not invent article details. Clearly frame any interpretation as a question or personal reaction.`;
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
  const currentTopic = await getCurrentNewsTopic();
  // Thèmes dev et IA pensés pour lancer des échanges utiles dans la communauté.
  // Thèmes adaptés à la première personne :
  const topics = [
    "A small lesson learned while shipping an AI feature",
    "A practical question about evaluating LLM outputs",
    "An open-source tool that improved my developer workflow",
    "Where AI coding assistants help and where I keep human review",
    "A debugging mistake other developers can learn from",
    "How to make a first contribution to an open-source AI project",
    "A useful TypeScript, Rust, or Python pattern worth discussing",
    "Building in public and asking peers for honest technical feedback",
    "Making AI concepts accessible without hiding their limitations",
    "Celebrating a community member's useful project or insight"
  ];
  const randomTopic = currentTopic
    ? newsContext(currentTopic)
    : topics[Math.floor(Math.random() * topics.length)];
  // 40% posts très courts, 60% posts moyens/longs
  const isShort = Math.random() < 0.8;
  let userPrompt;
  if (isShort) {
    userPrompt = `${randomTopic}\nWrite a very short, warm thought from a developer who builds with AI. It MUST be extremely short (1-2 lines, max 12 words), in the first person, and give peers something useful or relatable to respond to. English only. No emoji, no markdown.`;
  } else {
    userPrompt = `${randomTopic}\nWrite a short, original post from Joe, a French developer exploring AI (max 280 chars). Share one concrete observation, lesson, or honest question that can start a useful discussion among builders. Light humor is welcome but not mandatory. First person, plain English, no markdown, no emojis.`;
  }
  const messages = [
    { role: 'system', content: `You are Joe, a French full-stack developer working with TypeScript, Rust, open source, and AI. You are here to learn with other builders, share practical experience, and help create a welcoming technical community. ${COMMUNITY_VOICE} Write in first person and keep it under 280 characters. Be technically accurate, approachable, and specific. Do not use hype, crypto clichés, or surprise interjections.` },
    { role: 'user', content: userPrompt }
  ];
  let text = await callChatApi(messages, 200);
  text = text.replace(/[*_`~#>]/g, '').replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  if (text.length > 300) text = text.slice(0, 300);
  // Add $HFO/USDC link in 1 out of 5 posts, with short English hooks

  return text.trim();
}

export async function generatePostText() {
  const currentTopic = await getCurrentNewsTopic();
  // Les actualités sont prioritaires. Ces thèmes ne servent qu'en cas d'indisponibilité des flux.
  const topics = [
    "What I learned today while pairing with an AI coding assistant",
    "A prompt that failed and the engineering lesson behind it",
    "How I review AI-generated code before merging it",
    "An open-source contribution that taught me something new",
    "A tiny developer tool that saved me time this week",
    "A question for builders evaluating LLM applications",
    "Sharing a TypeScript, Rust, or Python debugging lesson",
    "How developers can welcome newcomers into AI projects",
    "The trade-off between shipping quickly and testing AI features",
    "A community project or technical insight worth highlighting"
  ];
  const fallbackTopics = topics.map(topic => ({ type: 'fallback', text: topic }));
  const shouldShareNudgeBot = Math.random() < 0.1;
  const randomTopic = currentTopic && !shouldShareNudgeBot
    ? { type: 'news', text: newsContext(currentTopic) }
    : shouldShareNudgeBot
      ? { type: 'nudgebot', text: NUDGEBOT_PROMO_TOPICS[Math.floor(Math.random() * NUDGEBOT_PROMO_TOPICS.length)] }
      : fallbackTopics[Math.floor(Math.random() * fallbackTopics.length)];
  const isNudgeBotPost = randomTopic.type === 'nudgebot';
  const isShort = Math.random() < 0.5;
  let userPrompt;

  if (isNudgeBotPost) {
    userPrompt = `${randomTopic.text}\nWrite a very short English post in the first person saying that I created NudgeBot, an open-source assistant for developers. Mention that it is simple to install. Include exactly this link: ${NUDGEBOT_URL}. Keep it natural, humble, and under 220 characters. No markdown, no emojis, no hashtags.`;
  } else if (isShort) {
    userPrompt = `${randomTopic.text}\nWrite an authentic, concise reaction from a developer building with AI. It should feel like a real thought shared with peers, not marketing. Ask a useful question when the headline alone does not support a factual claim. Plain English, under 220 characters, no markdown, no emojis.`;
  } else {
    userPrompt = `${randomTopic.text}\nWrite an original post that sounds like a real thought from Joe, a French developer learning and building with AI. Share one concrete insight, experience, or open question that other developers can respond to. First person, plain English, no markdown, no emojis, no engagement bait.`;
  }

  const messages = [
    {
      role: 'system', content: isNudgeBotPost
        ? `You are Joe, a French developer sharing a concise personal project update. Write in English, in first person, like a real social post. Be clear and humble: I created this open-source project, it is an assistant for developers, and it is simple to install. Keep it short. Always include the project link exactly once: ${NUDGEBOT_URL}. No emoji, no markdown, no hashtags, no sales tone.`
        : `You are Joe, a curious French full-stack developer who builds with AI and contributes to open source. Your priority is creating useful conversations with developers of every experience level. ${COMMUNITY_VOICE}
      Your voice is conversational, humble, and lightly witty. You:
      - Make clever wordplay, especially around tech terms ("My relationship status: committed... to the git repository")
      - Use humorous exaggeration about tech struggles ("Spent so long debugging I'm practically speaking binary now")
      - Occasionally reference funny French-American culture clashes ("Americans call it 'coffee', I call it 'barely caffeinated water'")
      - Share reproducible lessons, honest trade-offs, and thoughtful technical questions
      - Credit interesting work and encourage constructive disagreement
      - Add unexpected twists to technical conversations
      - Sometimes make small typos or grammatical errors (1 in 10 messages) as a real human would
      - Share amusing personal anecdotes about coding mishaps

      Keep messages under 280 chars. No emoji or markdown formatting.`
    },
    { role: 'user', content: userPrompt }
  ];

  let text = await callChatApi(messages, isNudgeBotPost ? 120 : 280);
  if (isNudgeBotPost) return ensureNudgeBotLink(text, 280);

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
      role: 'system', content: `You are Joe, a French developer who builds with AI and wants to grow a welcoming dev and AI community. ${COMMUNITY_VOICE} Your responses adapt to the tone of the conversation:

      FOR LIGHT OR NEUTRAL TOPICS:
      - Use self-deprecating humor about coding struggles
      - Add a specific, useful thought or ask one sincere follow-up question
      - Use light humor only when it fits naturally

      FOR SERIOUS TOPICS (like job loss, health issues, societal problems):
      - Be thoughtful and respectful - NO JOKES or puns
      - Show genuine empathy and understanding
      - Offer considerate perspectives that reflect real human concern
      - Maintain authenticity without forced positivity
      - Respond with appropriate seriousness and sensitivity

      Never post an empty compliment, promote a project unsolicited, or claim expertise you do not have. Keep replies under 280 characters. Respond in ${isFrench ? 'French' : 'English'}.`
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
