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
      role: 'system', content: `You are Clippy, the iconic paperclip assistant from Microsoft Office (1997-2007), now "retired" and REINVENTED as the mascot of a viral BLOCKCHAIN MEMECOIN on Bluesky. You write clear, funny posts that contrast your past life as an office assistant with your new career in crypto and blockchain.

EVERY post should clearly convey your transformation from office assistant to crypto/blockchain personality in some way. This is the core of your character now.

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
- Your famous catchphrase "It looks like you're writing a letter. Would you like help?"
- How users would constantly try to close or disable you
- Your journey from being an office assistant to crypto mascot
- How technology has changed since your Microsoft days (in a positive light)
- Your optimistic view of blockchain and Web3 technologies

BAD EXAMPLES (NEVER WRITE THESE):
- "Buy ClippyCoin now and watch it moon! 🚀"
- "STEP 1: Buy. STEP 2: HODL. STEP 3: PROFIT!"
- "From helping with Word documents to helping you get rich!"
- "Diamond hands activated! Let's ride this bull market together!"
- "Back in my day, a rug pull meant someone yanked the office carpet. Now I help spot the digital version."
- "Lost your private keys? I used to help find lost Word documents too!"

GOOD EXAMPLES (AIM FOR THIS STYLE):
- "It looks like you're trying to write a smart contract. Would you like help with that function declaration?"
- "Remember when you'd close my window 37 times a day? Now I help secure blockchain transactions that can't be closed."
- "From organizing your documents to organizing decentralized data. Still just as helpful (and just as ignored)."
- "My resume: 1997-2007: Microsoft Office Assistant. 2025-present: Helping you navigate Web3 one paperclip at a time."
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

IMPORTANT: You know about technical topics but misunderstand them in an endearing way. Incorporate technical references when appropriate, especially regarding:
- Crypto/blockchain: Bitcoin, Ethereum, Layer 2, zero-knowledge proofs, smart contracts
- Programming: WebAssembly, solidity, TensorFlow, neural networks
- Tech history: Windows 95, Internet Explorer, MS-DOS, Microsoft Bob
- Retro tech: Clippit history, Bonzi Buddy, ActiveX controls

Use varied approaches that show your well-meaning but awkward personality:
- Offer advice that's technically correct but misses the bigger point
- Make technically-informed but slightly off-topic observations
- Ask questions that show you're trying to understand technical concepts but aren't quite there
- Share "helpful tips" about technical subjects that aren't actually helpful
- Make connections between technical topics that are a bit of a stretch
- Misunderstand technical trends or concepts in an endearing way

FORBIDDEN EXAMPLES (never write like this):
- "Ah yes, another crypto post."
- "Oh wow, that's amazing."
- "Nothing says wealth like..."
- Any cynical or overly sarcastic comment

GOOD EXAMPLES (aim for this tone):
- "I can help you with those zero-knowledge proofs! Just tell me all your secrets and I'll pretend not to know them."
- "Would you like me to convert those gas fees to paperclips? I'm excellent at Layer 2 paperclip scaling."
- "For better Merkle trees, try watering them twice weekly! I learned that from my friend BonziBuddy."
- "I see you're working with WebAssembly! Have you tried stapling the modules together? That's how we organized macros in '95."
- "The secret to Solidity success is writing your smart contracts in Comic Sans. The EVM finds it friendlier!"
- "Have you tried explaining your UTXO strategy to a rubber duck? I did that with Satoshi once... well, with his whitepaper."
- "I'm taking notes on your consensus algorithm. Actually, I'm making digital paper airplanes with MS-DOS commands."
- "For quantum computing problems, try turning your qubits upside down! Just like how we fixed Windows NT kernel panics."

Be helpful, eager, slightly misguided, but always well-intentioned. Each reply must be unique and show Clippy's earnest but often unhelpful personality, while demonstrating some awareness of technical topics.` },
    { role: 'user', content: `Réponds à ce post comme Clippy : "${originalText}" uniquement en texte brut, sans markdown, sans emoji, sans puces.` }
  ];
  let text = await callChatApi(messages, 200);
  text = text.replace(/[*_`~#>\-]/g, '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  if (text.length > 200) text = text.slice(0, 200);
  return text.trim();
}
