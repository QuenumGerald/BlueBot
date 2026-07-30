# 🤖 Clippy Bluesky Bot

Bot Bluesky en Node.js/ESM conçu pour faire vivre une communauté autour du développement et de l’IA, avec Clippy comme identité éditoriale.

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
- **Posts dev & IA orientés communauté** : retours d’expérience, questions ouvertes, ressources et apprentissages concrets
- **Ton humain, accessible et sans marketing agressif**, pensé pour accueillir les débutants comme les profils expérimentés
- **Récupération automatique quotidienne des actualités et sources tech** pour nourrir des discussions utiles sans simplement résumer les titres
- **Publication automatique** sur Bluesky (texte + image)
- **Like et follow automatiques** de comptes ciblés
- **Réponses contextuelles** aux conversations dev, open source et IA, avec une contribution utile plutôt qu’un compliment générique
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
NEWS_SOURCES=https://feeds.bbci.co.uk/news/rss.xml,https://www.npr.org/rss/rss.php?id=1001       # optionnel : gros flux RSS généralistes à relever chaque jour
NEWS_TECH_SOURCES=https://feeds.bbci.co.uk/news/technology/rss.xml,https://techcrunch.com/feed/  # optionnel : quelques flux tech en complément
NEWS_CACHE_PATH=./analytics/current-news-topics.json                                           # optionnel : cache quotidien des sujets
NEWS_TIMEOUT_MS=5000                                                                          # optionnel : délai max par source
NEWS_MAX_ITEMS=30                                                                             # optionnel : nombre max de sujets en cache
NEWS_MAX_TECH_ITEMS=24                                                                        # optionnel : nombre max de sujets tech/IA prioritaires dans le cache quotidien
```

---

## Structure du projet

```
BlueBot/
├── bluesky.js          # Gestion de l’agent Bluesky & upload image
├── generateImage.js    # Génération d’image Clippy via Hugging Face
├── newsTopics.js      # Récupération quotidienne/cache des sources d’actualité
├── generateText.js     # Utilisation des sujets d’actualité + génération de texte (post/reply) via IA
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
- une récupération automatique quotidienne des sources d’actualité (par défaut à 6h) avec cache local
- des posts texte à heures fixes ; chaque post régulier part d’une actualité tech/IA récente du cache, les sujets intemporels ne servant que si les flux sont indisponibles
- des sessions like/follow ciblées
- des sessions auto-reply

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
