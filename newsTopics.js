// newsTopics.js
// Récupération quotidienne automatique des sujets d'actualité pour BlueBot.

import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

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
const NEWS_MAX_TECH_ITEMS = Number(process.env.NEWS_MAX_TECH_ITEMS || 24);

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

function topicTimestamp(topic) {
  const timestamp = Date.parse(topic.pubDate);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function prioritizeNewsTopics(majorTopics, techTopics, {
  maxItems = NEWS_MAX_ITEMS,
  maxTechItems = NEWS_MAX_TECH_ITEMS,
} = {}) {
  const seen = new Set();
  const uniqueLatest = topics => topics
    .sort((a, b) => topicTimestamp(b) - topicTimestamp(a))
    .filter(topic => {
      const key = `${topic.title.toLowerCase()}|${topic.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  const techLimit = Math.min(maxTechItems, maxItems);
  const selectedTech = uniqueLatest([...techTopics]).slice(0, techLimit);
  const selectedMajor = uniqueLatest([...majorTopics]).slice(0, maxItems - selectedTech.length);
  return [...selectedTech, ...selectedMajor];
}

export function selectCurrentNewsTopic(topics, random = Math.random) {
  if (topics.length === 0) return null;
  const techTopics = topics.filter(topic => topic.category === 'tech');
  const pool = techTopics.length > 0 ? techTopics : topics;
  return pool[Math.floor(random() * pool.length)];
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

  const topics = prioritizeNewsTopics(majorTopics, techTopics);

  if (topics.length > 0) {
    await writeCachedTopics(topics);
    return topics;
  }

  console.warn('[News] Unable to refresh daily news topics; keeping cached topics if available.');
  return cache.topics;
}

export async function getCurrentNewsTopic(random = Math.random) {
  const topics = await refreshDailyNewsTopics();
  return selectCurrentNewsTopic(topics, random);
}
