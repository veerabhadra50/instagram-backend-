const cache = {};

export const getCache = (key) => cache[key];

export const setCache = (key, data) => {
  cache[key] = data;
};