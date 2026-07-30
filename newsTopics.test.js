import test from 'node:test';
import assert from 'node:assert/strict';

import { prioritizeNewsTopics, selectCurrentNewsTopic } from './newsTopics.js';

test('prioritizeNewsTopics puts recent tech news first and fills with major news', () => {
  const major = [
    { title: 'World story', url: 'https://example.com/world', pubDate: '2026-07-25', category: 'major' },
  ];
  const tech = [
    { title: 'Older AI story', url: 'https://example.com/old', pubDate: '2026-07-24', category: 'tech' },
    { title: 'Latest AI story', url: 'https://example.com/latest', pubDate: '2026-07-27', category: 'tech' },
  ];

  const topics = prioritizeNewsTopics(major, tech, { maxItems: 3, maxTechItems: 2 });

  assert.deepEqual(topics.map(topic => topic.title), [
    'Latest AI story',
    'Older AI story',
    'World story',
  ]);
});

test('prioritizeNewsTopics removes duplicate feed entries', () => {
  const story = { title: 'Shared story', url: 'https://example.com/shared', pubDate: '2026-07-27' };
  const topics = prioritizeNewsTopics(
    [{ ...story, category: 'major' }],
    [{ ...story, category: 'tech' }],
    { maxItems: 3, maxTechItems: 2 }
  );

  assert.equal(topics.length, 1);
  assert.equal(topics[0].category, 'tech');
});

test('selectCurrentNewsTopic always selects from tech news when available', () => {
  const topics = [
    { title: 'World story', category: 'major' },
    { title: 'AI story', category: 'tech' },
  ];

  assert.equal(selectCurrentNewsTopic(topics, () => 0).title, 'AI story');
  assert.equal(selectCurrentNewsTopic([], () => 0), null);
});
