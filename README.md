# 🤖 Clippy Bluesky Bot

Bot Bluesky complet en Node.js/ESM pour générer, poster, liker, suivre et répondre automatiquement avec des memes IA de Clippy !

## Sommaire
- [Fonctionnalités](#fonctionnalités)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration (.env)](#configuration-env)
- [Structure du projet](#structure-du-projet)
- [Utilisation](#utilisation)
- [Automatisation & Scheduler](#automatisation--scheduler)
- [FAQ](#faq)
- [Crédits](#crédits)

---

## Fonctionnalités
- **Génération d’images memes Clippy** via l’API Hugging Face (Stable Diffusion)
- **Génération de textes posts et replies** via DeepSeek ou OpenAI (GPT)
- **Publication automatique** sur Bluesky (texte + image)
- **Like et follow automatiques** de comptes ciblés
- **Réponses automatiques** aux posts #CLIPPY
- **Orchestration complète** via un scheduler programmable (`blazerjob`)

---

## Prérequis
- Node.js **v18+** (ES Modules support natif)
- Un compte [Bluesky](https://bsky.social/)
- Un compte [Hugging Face](https://huggingface.co/) (token API gratuit possible)
- Un compte [DeepSeek](https://deepseek.com/) ou [OpenAI](https://platform.openai.com/)

---

## Installation

1. **Clone le repo ou copie le dossier**
2. Va dans le dossier du projet :
   ```bash
   cd BlueBot
   ```
3. **Installe les dépendances :**
   ```bash
   npm install
   ```

---

## Configuration (.env)

Copie `.env.example` en `.env` et renseigne tes clés :
```bash
cp .env.example .env
```

Remplis les variables :
```
BLUESKY_HANDLE=ton.handle.bsky.social
BLUESKY_PASSWORD=ton_mot_de_passe
HUGGINGFACE_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DEEPSEEK_KEY=ds_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # ou OPENAI_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Structure du projet

```
BlueBot/
├── bluesky.js          # Gestion de l’agent Bluesky & upload image
├── generateImage.js    # Génération d’image Clippy via Hugging Face
├── generateText.js     # Génération de texte (post/reply) via IA
├── postImage.js        # Publication d’un post Clippy (texte + image)
├── likeAndFollow.js    # Like & follow automatiques
├── autoReply.js        # Réponses automatiques aux posts #CLIPPY
├── scheduler.js        # Orchestration des tâches planifiées
├── .env                # Tes clés privées (à ne pas versionner)
├── .env.example        # Exemple de configuration
├── package.json        # Dépendances & scripts
└── README.md           # Ce fichier
```

---

## Utilisation

### Lancer manuellement une tâche
- **Poster un meme Clippy :**
  ```js
  import { postClippyImage } from './postImage.js';
  await postClippyImage();
  ```
- **Like & follow :**
  ```js
  import { likeAndFollow } from './likeAndFollow.js';
  await likeAndFollow();
  ```
- **Réponse automatique :**
  ```js
  import { autoReply } from './autoReply.js';
  await autoReply();
  ```

### Lancer le scheduler (automatisation)
```bash
npm start
# ou
node scheduler.js
```

Le scheduler planifie automatiquement :
- 3 posts Clippy par jour (9h, 15h, 21h)
- 1 session like/follow à 10h
- 1 session auto-reply à 12h

---

## Automatisation & Scheduler

Le fichier `scheduler.js` utilise [`blazerjob`](https://www.npmjs.com/package/blazerjob) pour planifier et persister les tâches :
- **Persistence** : l’état des jobs est stocké dans `clippy-jobs.db` (SQLite)
- **Cron syntaxe** : planification à heure fixe
- **Redémarrage automatique** : les jobs reprennent même après un crash ou reboot

---

## FAQ

**Q : L’API Hugging Face est-elle gratuite ?**
- Oui, dans la limite des quotas gratuits (voir [usage](https://huggingface.co/settings/usage)).

**Q : Puis-je utiliser DeepSeek ou OpenAI ?**
- Oui, le bot choisit DeepSeek si la clé est présente, sinon OpenAI.

**Q : Comment personnaliser les handles ou URIs à liker/follow ?**
- Modifie les tableaux dans `likeAndFollow.js`.

**Q : Comment changer le hashtag ciblé pour l’auto-reply ?**
- Modifie le paramètre `hashtag` dans `autoReply.js`.

**Q : Le projet est-il compatible TypeScript ?**
- Oui, mais il est écrit en JS natif. Tu peux migrer facilement si besoin.

---

## Crédits
- Basé sur [@atproto/api](https://github.com/bluesky-social/atproto), [axios](https://github.com/axios/axios), [dotenv](https://github.com/motdotla/dotenv), [blazerjob](https://www.npmjs.com/package/blazerjob)
- Génération IA : [Hugging Face](https://huggingface.co/), [DeepSeek](https://deepseek.com/), [OpenAI](https://platform.openai.com/)
- Idée et orchestration : [Clippy, le bot qui ne meurt jamais]

---

**Pour toute question ou contribution, ouvre une issue ou contacte le mainteneur !**