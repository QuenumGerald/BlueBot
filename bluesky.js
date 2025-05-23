// bluesky.js
// Module d'intégration Bluesky pour Node.js utilisant @atproto/api
// Expose deux fonctions : initBluesky et uploadImageToBluesky

import { BskyAgent } from '@atproto/api';
import dotenv from 'dotenv';

// Charge les variables d'environnement depuis le fichier .env
dotenv.config();

const { BLUESKY_HANDLE, BLUESKY_PASSWORD } = process.env;

// Vérification des variables d'environnement nécessaires
if (!BLUESKY_HANDLE || !BLUESKY_PASSWORD) {
  throw new Error('BLUESKY_HANDLE et BLUESKY_PASSWORD doivent être définis dans le fichier .env');
}

// Initialise un agent Bluesky pointant sur https://bsky.social
const agent = new BskyAgent({ service: 'https://bsky.social' });
export { agent };


/**
 * Initialise et authentifie l'agent Bluesky.
 * À appeler avant toute opération nécessitant une authentification.
 */
export async function initBluesky() {
  await agent.login({
    identifier: BLUESKY_HANDLE,
    password: BLUESKY_PASSWORD,
  });
}

/**
 * Upload une image PNG sur Bluesky et retourne l'ID du blob.
 * @param {Buffer} buffer - Buffer contenant l'image PNG
 * @returns {Promise<string>} - L'identifiant du blob uploadé
 */
export async function uploadImageToBluesky(buffer) {
  // Upload du blob image (PNG) via l'API Bluesky
  const blobResult = await agent.uploadBlob(buffer, { encoding: 'image/png' });
  // Retourne l'objet blob complet (pas juste l'ID)
  return blobResult.data.blob;
}
