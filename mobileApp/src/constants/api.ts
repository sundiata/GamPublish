export const API_ENDPOINTS = {
  // Prayer times API (using Aladhan API)
  PRAYER_TIMES: 'http://api.aladhan.com/v1/timingsByCity',
  
  // Quran API (using Quran.com API v4)
  QURAN_CHAPTERS: 'https://api.quran.com/api/v4/chapters',
  QURAN_VERSES: 'https://api.quran.com/api/v4/verses/by_chapter',
  QURAN_AUDIO: 'https://api.quran.com/api/v4/recitations',
};

export const DEFAULT_PARAMS = {
  city: 'Banjul',  // Default city for The Gambia
  country: 'Gambia',
  method: 3, // Muslim World League calculation method
};

export default { API_ENDPOINTS, DEFAULT_PARAMS };
