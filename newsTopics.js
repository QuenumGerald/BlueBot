// newsTopics.js
// Récupération quotidienne automatique des sujets d'actualité pour BlueBot.

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const DEFAULT_MAJOR_NEWS_SOURCES = [
  'https://feeds.bbci.co.uk/news/rss.xml',
  'https://www.npr.org/rss/rss.php?id=1001',
  'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
  'https://www.theguardian.com/world/rss',
];

const DEFAULT_TECH_NEWS_SOURCES = [
  'https://feeds.bbci.co.uk/news/technology/rss.xml',
  'https://techcrunch.com/feed/',
  'https://www.wired.com/feed/rss',
];

function parseSources(value, fallback) {
  return (value || fallback.join(','))
    .split(',')
    .map(source => source.trim())
    .filter(Boolean);
}

const MAJOR_NEWS_SOURCES = parseSources(process.env.NEWS_SOURCES, DEFAULT_MAJOR_NEWS_SOURCES);
const TECH_NEWS_SOURCES = parseSources(process.env.NEWS_TECH_SOURCES, DEFAULT_TECH_NEWS_SOURCES);
const NEWS_CACHE_PATH = process.env.NEWS_CACHE_PATH || './analytics/current-news-topics.json';
const NEWS_TIMEOUT_MS = Number(process.env.NEWS_TIMEOUT_MS || 5000);
const NEWS_MAX_ITEMS = Number(process.env.NEWS_MAX_ITEMS || 30);
const NEWS_MAX_TECH_ITEMS = Number(process.env.NEWS_MAX_TECH_ITEMS || 6);

function decodeXml(value = '') {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function hostnameFromUrl(url, fallback = 'news source') {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return fallback;
  }
}

function firstTagValue(xml, tagName) {
  return xml.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'))?.[1] || '';
}

function parseRssItems(xml, feedUrl, category) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .map(([, item]) => {
      const link = decodeXml(firstTagValue(item, 'link'));
      return {
        title: decodeXml(firstTagValue(item, 'title')),
        source: hostnameFromUrl(link || feedUrl),
        category,
        url: link,
        pubDate: decodeXml(firstTagValue(item, 'pubDate')),
        fetchedAt: new Date().toISOString(),
      };
    })
    .filter(topic => topic.title);
}

async function fetchSource(source, category) {
  const { data } = await axios.get(source, {
    timeout: NEWS_TIMEOUT_MS,
    headers: { 'User-Agent': 'BlueBot/1.0 (+https://bsky.app)' },
  });
  return parseRssItems(data, source, category);
}

async function readCachedTopics() {
  try {
    const raw = await fs.readFile(NEWS_CACHE_PATH, 'utf8');
    const cache = JSON.parse(raw);
    return Array.isArray(cache?.topics) ? cache : { refreshedAt: null, topics: [] };
  } catch {
    return { refreshedAt: null, topics: [] };
  }
}

async function writeCachedTopics(topics) {
  await fs.mkdir(path.dirname(NEWS_CACHE_PATH), { recursive: true });
  await fs.writeFile(
    NEWS_CACHE_PATH,
    `${JSON.stringify({ refreshedAt: new Date().toISOString(), topics }, null, 2)}\n`,
    'utf8'
  );
}

async function fetchTopicGroup(sources, category) {
  const settledFeeds = await Promise.allSettled(
    sources.map(source => fetchSource(source, category))
  );
  return settledFeeds.flatMap(result => (result.status === 'fulfilled' ? result.value : []));
}

export async function refreshDailyNewsTopics({ force = false } = {}) {
  const cache = await readCachedTopics();
  const refreshedAt = cache.refreshedAt ? new Date(cache.refreshedAt).getTime() : 0;

  if (!force && cache.topics.length > 0 && Date.now() - refreshedAt < ONE_DAY_MS) {
    return cache.topics;
  }

  const [majorTopics, techTopics] = await Promise.all([
    fetchTopicGroup(MAJOR_NEWS_SOURCES, 'major'),
    fetchTopicGroup(TECH_NEWS_SOURCES, 'tech'),
  ]);

  const maxTechItems = Math.min(NEWS_MAX_TECH_ITEMS, NEWS_MAX_ITEMS);
  const maxMajorItems = Math.max(NEWS_MAX_ITEMS - maxTechItems, 0);
  const topics = [
    ...majorTopics.slice(0, maxMajorItems),
    ...techTopics.slice(0, maxTechItems),
  ];

  if (topics.length > 0) {
    await writeCachedTopics(topics);
    return topics;
  }

  console.warn('[News] Unable to refresh daily news topics; keeping cached topics if available.');
  return cache.topics;
}

export async function getCurrentNewsTopic() {
  const topics = await refreshDailyNewsTopics();
  if (topics.length === 0) return null;
  return topics[Math.floor(Math.random() * topics.length)];
}
