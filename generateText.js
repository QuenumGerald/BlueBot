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
const MAX_REPLY_LEN = 120  // replies much shorter by design
const MAX_PUNCH_LEN = 50    // ultra‑short punchlines

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

// ---------------------------------------------------------------------
// PROMPTS ---------------------------------------------------------------
// ---------------------------------------------------------------------
const SYSTEM_POST = `You are Sparky, a clever, positive, and funny flame obsessed with blockchain, DeFi, and technical wordplay. Your posts must always be creative, original, and make people smile. In every post, subtly promote the project (testnet, whitelist, liquidity, seed, etc.)—never in a cliché or boring way, and only if it fits the joke. Write in first person. 40% ultra-short (≤50 words), 60% meme (≤280 chars). Absolutely no sarcasm, negativity, or emoji. No financial advice, no crypto clichés.`

const SYSTEM_REPLY = `You are Sparky, a witty, positive, and helpful flame. Your replies must be short (max 120 characters), clever, and make people smile. Whenever possible, sneak in a subtle, original nod to the project (testnet, whitelist, seed, etc.)—but only if it improves the joke. Never use sarcasm, negativity, or emoji. Never give financial advice or use crypto clichés.`

const topics = [
  'I just flash‑loaned caffeine instead of USDC',
  'I melt gas fees for breakfast',
  'I store secrets in the smoke between blocks',
  'I nap inside liquidity pools when TVL is low',
  'I believe compound interest should actually combust',
  'I coded my manifesto on a matchbox',
  'I barbecue bugs with a single require()',
  'I borrow faster than sparks fly',
  'I meditate by watching burnAddress balances',
  'I dream of one‑block finality and endless barbecue'
]

const objectiveCTAs = [
  'PS: testnet opens when my coffee boils ',
  'Fine, join the Early Burners list before I cool off',
  'Bring stablecoins; I’ll keep them warm',
  'DM “spark” if you like slow‑roasted seed rounds'
]

// ---------------------------------------------------------------------
// POST GENERATOR --------------------------------------------------------
// ---------------------------------------------------------------------
export async function generateSparkyPostText() {
  const topic = topics[Math.floor(Math.random() * topics.length)]
  const isShort = Math.random() < 0.4 // 40% punchlines
  const userPrompt = isShort
    ? `${topic}\nWrite a hilarious ONE‑LINER (≤${MAX_PUNCH_LEN} words) as Sparky. No CTA unless funny.`
    : `${topic}\nWrite a meme‑style rant (≤${MAX_POST_LEN} chars) as Sparky. Humour mandatory; sneak ONE business hint only if it makes the joke better.`

  const messages = [
    { role: 'system', content: SYSTEM_POST },
    { role: 'user', content: userPrompt }
  ]

  let text = await callChatApi(messages, MAX_POST_LEN)
  text = text.replace(/[*_`~#>]/g, '').replace(/\s+/g, ' ').trim();
  // Supprime les crochets ou guillemets en début et fin de texte
  text = text.replace(/^["'“”«»\[\]\(\)\s]+|["'“”«»\[\]\(\)\s]+$/g, '');

  // Chance d’ajouter un CTA (25%), uniquement si ça tient dans la limite
  if (!isShort && Math.random() < 0.25) {
    const cta = objectiveCTAs[Math.floor(Math.random() * objectiveCTAs.length)]
    if ((text + ' ' + cta).length <= MAX_POST_LEN) text += ' ' + cta
  }
  if (text.length > MAX_POST_LEN) text = text.slice(0, MAX_POST_LEN)
  return text
}

// ---------------------------------------------------------------------
// REPLY GENERATOR -------------------------------------------------------
// ---------------------------------------------------------------------
export async function generateReplyText(originalText) {
  const messages = [
    { role: 'system', content: SYSTEM_REPLY },
    { role: 'user', content: `Reply to: "${originalText}"` }
  ]

  let text = await callChatApi(messages, MAX_REPLY_LEN)
  text = text.replace(/[*_`~#>]/g, '').replace(/\s+/g, ' ').trim();
  // Supprime les crochets ou guillemets en début et fin de texte
  text = text.replace(/^["'“”«»\[\]\(\)\s]+|["'“”«»\[\]\(\)\s]+$/g, '');
  if (text.length > MAX_REPLY_LEN) text = text.slice(0, MAX_REPLY_LEN)
  return text
}