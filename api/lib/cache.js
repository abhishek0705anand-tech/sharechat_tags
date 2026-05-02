import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

export function getCache(key) {
  return cache.get(key);
}

export function setCache(key, value, ttl = 600) {
  cache.set(key, value, ttl);
}

export function delCache(key) {
  cache.del(key);
}
