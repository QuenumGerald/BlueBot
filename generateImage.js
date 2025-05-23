// generateImage.js
// Génère une image mème de Clippy via l’API Hugging Face et retourne un Buffer

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const { HUGGINGFACE_TOKEN } = process.env;

if (!HUGGINGFACE_TOKEN) {
  throw new Error('HUGGINGFACE_TOKEN doit être défini dans le fichier .env');
}

/**
 * Génère une image de Clippy via l’API Hugging Face Stable Diffusion 2.
 * @param {string} prompt - Le prompt textuel pour l’image
 * @returns {Promise<Buffer>} - Buffer contenant l’image générée
 */
/**
 * Génère une image de Clippy via l’API Hugging Face (modèle configurable)
 * @param {string} prompt - Le prompt textuel pour l’image
 * @param {string} [model] - Le modèle à utiliser (optionnel)
 * @returns {Promise<Buffer>} - Buffer contenant l’image générée (PNG)
 */
export async function generateClippyImage(prompt, model = 'black-forest-labs/FLUX.1-dev') {
  const url = `https://api-inference.huggingface.co/models/${model}`;
  try {
    const response = await axios.post(
      url,
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_TOKEN}`,
          Accept: 'image/png',
        },
        responseType: 'arraybuffer',
      }
    );
    return Buffer.from(response.data);
  } catch (error) {
    console.error('Erreur lors de la génération de l’image via Hugging Face:', error?.response?.data || error.message);
    throw error;
  }
}
