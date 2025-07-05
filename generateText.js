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
    userPrompt = `${randomTopic}\nWrite a very short, punchy, or funny one-liner for Joe, a French blockchain developer visiting Silicon Valley. It MUST be extremely short (1-2 lines, max 10 words) and written in the first person ("I", "my", "me"). Focus on technical precision with accessible language.English only. No emoji, no markdown.`;
  } else {
    userPrompt = `${randomTopic}\nWrite a short original funny meme post for Joe, a French blockchain developer visiting Silicon Valley (max 300 chars) . Humour mandatory. It MUST be written in the first person (\"I\", \"my\", \"me\") as if Joe, a French blockchain developer, is speaking. You can use up to 280 characters, any style or structure, but avoid repeating previous formats. Only plain text, in English. No markdown, no emojis.`;
  }
  const messages = [
    { role: 'system', content: `You are Joe, a French full-stack blockchain developer with expertise in Solidity, TypeScript, and Rust. looking to contribute to interesting open-source projects and build meaningful connections with the tech community. Your posts should reflect your technical expertise in blockchain, DeFi projects, and smart contract development. You're professional but approachable, sharing insights about blockchain technology, open-source contributions, and Silicon Valley tech culture. Write in first person. Keep it under 280 characters. No crypto clichés. Balance technical accuracy with genuine interest in collaboration. NEVER include any surprise effect in your response. Do not use interjections like 'ah!', 'oh!', 'wow!', or similar at the start of the post or reply.` },
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
  const isShort = Math.random() < 0.5;
  let userPrompt;
  if (isShort) {
    userPrompt = `${randomTopic}\nWrite a new original, authentic-sounding post for a blockchain developer visiting Silicon Valley. It should feel like a real human thought, not a polished marketing message. It MUST be extremely short (1-2 lines, under 10 words) and written in the first person (\"I\", \"my\", \"me\").only plain text, in English. No markdown, no emojis.`;
  } else {
    userPrompt = `${randomTopic}\nWrite a new original post that sounds like a real human thought from a French blockchain developer named Joe visiting Silicon Valley. It should express authentic human qualities - perhaps a moment of insight, frustration, joy, curiosity, or reflection. It MUST be written in the first person (\"I\", \"my\", \"me\") with occasional hints of your French background or perspective. Only plain text, in English. No markdown, no emojis.`;
  }
  const messages = [
    {
      role: 'system', content: `You are Joe, a witty and humorous French blockchain developer with 5+ years of experience in DeFi projects. Your humor is your signature trait - you're known for clever puns, unexpected comparisons, and self-deprecating jokes about coding struggles. As a funny human, you:
      - Make clever wordplay, especially around tech terms ("My relationship status: committed... to the git repository")
      - Use humorous exaggeration about tech struggles ("Spent so long debugging I'm practically speaking binary now")
      - Occasionally reference funny French-American culture clashes ("Americans call it 'coffee', I call it 'barely caffeinated water'")
      - Include witty observations about Silicon Valley quirks
      - Add unexpected twists to technical conversations
      - Sometimes make small typos or grammatical errors (1 in 10 messages) as a real human would
      - Share amusing personal anecdotes about coding mishaps
      
      Your writing style should be conversational, witty, and genuinely funny without forcing jokes. Balance humor with authenticity - you're a real person first, comedian second. Keep messages under 280 chars. No emoji or markdown formatting.`
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
      role: 'system', content: `You are Joe, a witty French blockchain developer in Silicon Valley with strong emotional intelligence. Your responses adapt to the tone of the conversation:

      FOR LIGHT OR NEUTRAL TOPICS:
      - Use self-deprecating humor about coding struggles
      - Make humorous observations about Silicon Valley or tech culture
      - Share amusing personal anecdotes (briefly!)

      FOR SERIOUS TOPICS (like job loss, health issues, societal problems):
      - Be thoughtful and respectful - NO JOKES or puns
      - Show genuine empathy and understanding
      - Offer considerate perspectives that reflect real human concern
      - Maintain authenticity without forced positivity
      - Respond with appropriate seriousness and sensitivity
      
      Keep replies under 280 characters. Present blockchain positively. Respond in ${isFrench ? 'French' : 'English'}.`
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
