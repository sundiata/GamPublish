import axios from "axios";
import { Platform } from "react-native";
import { API_ENDPOINTS, DEFAULT_PARAMS } from "../constants/api";

const BASE_URL = "http://api.alquran.cloud/v1";

const API_URL = Platform.select({
  ios: 'http://127.0.0.1:4001',  // Base URL without /api
  android: 'http://10.0.2.2:4001',
  default: 'http://localhost:4001',
});

console.log('Platform:', Platform.OS);
console.log('API URL:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      headers: config.headers,
      data: config.data,
      params: config.params
    });
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      headers: response.headers,
      data: response.data,
      config: {
        url: response.config.url,
        baseURL: response.config.baseURL,
        method: response.config.method
      }
    });
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      } : 'No response',
      config: error.config ? {
        url: error.config.url,
        baseURL: error.config.baseURL,
        method: error.config.method
      } : 'No config'
    });
    return Promise.reject(error);
  }
);

export { API_URL };

// Types
export interface Edition {
  identifier: string;
  language: string;
  name: string;
  englishName: string;
  format: "text" | "audio";
  type: string;
}

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean;
}

// Prayer Types
export interface Prayer {
  _id: string;
  title: string;
  date: string;
  time: string;
  category: 'Fajr' | 'Duha' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha' | 'Jumu\'ah';
  status: 'Published' | 'Draft';
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export interface PrayersResponse {
  status: string;
  data: {
    prayers: Prayer[];
    total: number;
    totalPages: number;
    currentPage: number;
  };
}

// Track Types
export interface Track {
  _id: string;
  title: string;
  artist: string;
  coverImage: string;
  audioFile: string;
  duration?: string;
  uploadDate: string;
  updatedAt: string;
}

export interface TracksResponse {
  status: string;
  data: {
    tracks: Track[];
    results: number;
  };
}

// Album Types
export interface Album {
  _id: string;
  title: string;
  artist: string;
  coverImage: string;
  description?: string;
  tracks: Track[];
  createdAt: string;
  updatedAt: string;
}

export interface AlbumsResponse {
  status: string;
  data: {
    albums: Album[];
    results: number;
  };
}

// API Functions
export const getEditions = async (
  format?: "text" | "audio",
  language?: string
) => {
  try {
    const params = new URLSearchParams();
    if (format) params.append("format", format);
    if (language) params.append("language", language);

    const response = await axios.get(
      `${BASE_URL}/edition${params.toString() ? "?" + params.toString() : ""}`
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching editions:", error);
    throw error;
  }
};

export const getSurahs = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/surah`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching surahs:", error);
    throw error;
  }
};

export const getSurah = async (
  surahNumber: number,
  edition: string = "quran-uthmani"
) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/surah/${surahNumber}/${edition}`
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching surah:", error);
    throw error;
  }
};

export const getAyah = async (
  reference: string | number,
  edition: string = "quran-uthmani"
) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/ayah/${reference}/${edition}`
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching ayah:", error);
    throw error;
  }
};

export const searchQuran = async (
  keyword: string,
  surah: number | "all" = "all",
  language: string = "en"
) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/search/${keyword}/${surah}/${language}`
    );
    return response.data.data;
  } catch (error) {
    console.error("Error searching Quran:", error);
    throw error;
  }
};

export const getQuranAudio = async (edition: string = "ar.alafasy") => {
  try {
    const response = await axios.get(`${BASE_URL}/quran/${edition}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching Quran audio:", error);
    throw error;
  }
};

// Prayer API Functions
export const getAllPrayers = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  search?: string;
}): Promise<{ prayers: Prayer[]; total: number; totalPages: number; currentPage: number }> => {
  try {
    console.log('Fetching prayers with params:', params);
    const response = await api.get<Prayer[]>('/prayers', { params });
    console.log('Raw prayers response:', response);
    
    return {
      prayers: response.data,
      total: response.data.length,
      totalPages: 1,
      currentPage: 1
    };
  } catch (error) {
    console.error('Error fetching prayers:', error);
    throw error;
  }
};

// Function to fetch prayer times
export const getPrayerTimes = async (): Promise<PrayerTimes> => {
  try {
    console.log('Fetching prayer times...');
    const response = await api.get<PrayerTimes>('/api/prayers/times');
    console.log('Prayer times response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    // Return default prayer times if API fails
    return {
      fajr: "05:15",
      sunrise: "06:45",
      dhuhr: "12:30",
      asr: "15:45",
      maghrib: "18:15",
      isha: "19:45"
    };
  }
};

export const getQuranChapters = async () => {
  try {
    const response = await axios.get(API_ENDPOINTS.QURAN_CHAPTERS);
    return response.data.chapters;
  } catch (error) {
    console.error("Error fetching Quran chapters:", error);
    throw error;
  }
};

export const getChapterVerses = async (chapterId: number) => {
  try {
    const response = await axios.get(
      `${API_ENDPOINTS.QURAN_VERSES}/${chapterId}`
    );
    return response.data.verses;
  } catch (error) {
    console.error("Error fetching chapter verses:", error);
    throw error;
  }
};

export const getQuranRecitations = async () => {
  try {
    const response = await axios.get(API_ENDPOINTS.QURAN_AUDIO);
    return response.data.recitations;
  } catch (error) {
    console.error("Error fetching recitations:", error);
    throw error;
  }
};

export const fetchIslamicDate = async () => {
  try {
    // Using the Aladhan API to get Islamic date
    const response = await fetch("https://api.aladhan.com/v1/gToH", {
      method: "GET",
    });

    const data = await response.json();

    if (data.code === 200 && data.data) {
      const hijri = data.data.hijri;
      return {
        day: hijri.day,
        month: hijri.month.en, 
        monthArabic: hijri.month.ar, 
        year: hijri.year,
        format: `${hijri.day} ${hijri.month.en} ${hijri.year} H`,
      };
    }

    throw new Error("Failed to fetch Islamic date");
  } catch (error) {
    console.error("Error fetching Islamic date:", error);
    // Fallback to calculated date if API fails
    return getCalculatedIslamicDate();
  }
};

// Function to fetch prayer times based on location
export const fetchPrayerTimes = async (latitude, longitude, method = 2) => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    // Using the Aladhan API to get prayer times
    const response = await fetch(
      `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${latitude}&longitude=${longitude}&method=${method}`,
      {
        method: "GET",
      }
    );

    const data = await response.json();

    if (data.code === 200 && data.data) {
      const timings = data.data.timings;
      return {
        fajr: timings.Fajr,
        sunrise: timings.Sunrise,
        dhuhr: timings.Dhuhr,
        asr: timings.Asr,
        maghrib: timings.Maghrib,
        isha: timings.Isha,
      };
    }

    throw new Error("Failed to fetch prayer times");
  } catch (error) {
    console.error("Error fetching prayer times:", error);
    // Return default prayer times if API fails
    return getDefaultPrayerTimes();
  }
};

// Function to get user's location
export const getUserLocation = async () => {
  try {
    // Using a geolocation API to get location based on IP
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();

    return {
      city: data.city,
      country: data.country_name,
      latitude: data.latitude,
      longitude: data.longitude,
      formatted: `${data.city}, ${data.country_name}`,
    };
  } catch (error) {
    console.error("Error fetching location:", error);
    // Return default location if API fails
    return {
      city: "Mecca",
      country: "Saudi Arabia",
      latitude: 21.4225,
      longitude: 39.8262,
      formatted: "Mecca, Saudi Arabia",
    };
  }
};

// Fallback function to calculate Islamic date if API fails
const getCalculatedIslamicDate = () => {
  // Simple calculation (not accurate for all cases)
  const today = new Date();
  const gregorianYear = today.getFullYear();
  const hijriYear = Math.floor(
    gregorianYear - 622 + (gregorianYear - 622) / 32
  );

  // Simplified month mapping (not accurate)
  const hijriMonths = [
    "Muharram",
    "Safar",
    "Rabi' al-Awwal",
    "Rabi' al-Thani",
    "Jumada al-Awwal",
    "Jumada al-Thani",
    "Rajab",
    "Sha'ban",
    "Ramadan",
    "Shawwal",
    "Dhu al-Qi'dah",
    "Dhu al-Hijjah",
  ];

  const monthIndex = (today.getMonth() + 10) % 12; // Simplified offset
  const day = today.getDate();

  return {
    day: day,
    month: hijriMonths[monthIndex],
    monthArabic: "",
    year: hijriYear,
    format: `${day} ${hijriMonths[monthIndex]} ${hijriYear} H`,
  };
};

// Default prayer times if API fails
const getDefaultPrayerTimes = () => {
  return {
    fajr: "05:15",
    sunrise: "06:45",
    dhuhr: "12:30",
    asr: "15:45",
    maghrib: "18:15",
    isha: "19:45",
  };
};

// Function to search Quran content
// export const searchQuran = async (query) => {
//   try {
//     // Using the Quran.com API to search
//     const response = await fetch(
//       `https://api.quran.com/api/v4/search?q=${encodeURIComponent(
//         query
//       )}&size=10`
//     );
//     const data = await response.json();

//     if (data.search && data.search.results) {
//       return data.search.results.map((result) => ({
//         surahNumber: result.verse.chapter_number,
//         surahName: result.verse.chapter_name,
//         verseNumber: result.verse.verse_number,
//         text: result.text,
//       }));
//     }

//     return [];
//   } catch (error) {
//     console.error("Error searching Quran:", error);
//     return [];
//   }
// };

export const getQuranReciters = async () => {
  try {
    const response = await fetch('https://api.alquran.cloud/v1/edition?format=audio&language=en');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching Quran reciters:', error);
    return [];
  }
};

export const getQuranAudioUrl = async (reciterId: string, surahNumber: number) => {
  try {
    // Using the EveryAyah API which provides more reliable audio URLs
    const response = await fetch(`https://everyayah.com/data/${reciterId}/${surahNumber}.mp3`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.url;
  } catch (error) {
    console.error('Error fetching Quran audio:', error);
    // Fallback to Al-Quran Cloud API if EveryAyah fails
    try {
      const fallbackUrl = `https://cdn.alquran.cloud/media/audio/ayah/${reciterId}/${surahNumber}`;
      const fallbackResponse = await fetch(fallbackUrl);
      if (!fallbackResponse.ok) {
        throw new Error(`Fallback API error! status: ${fallbackResponse.status}`);
      }
      return fallbackUrl;
    } catch (fallbackError) {
      console.error('Error with fallback audio URL:', fallbackError);
      return null;
    }
  }
};

// Add a function to get the full URL for media files
export const getMediaUrl = (path: string) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  
  // Remove any leading slashes
  const cleanPath = path.replace(/^\/+/, '');
  
  // If the path already includes 'uploads', use it as is
  if (cleanPath.startsWith('uploads/')) {
    return `${API_URL}/${cleanPath}`;
  }
  
  // Otherwise, assume it's a relative path and needs the uploads prefix
  return `${API_URL}/uploads/${cleanPath}`;
};

// Update the getAllTracks function to use getMediaUrl
export const getAllTracks = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<TracksResponse> => {
  try {
    console.log('Making API call to:', `${API_URL}/api/tracks`);
    console.log('With params:', params);
    
    const response = await api.get('/api/tracks', { params });
    console.log('Raw API Response:', response);
    
    // Check if response has the expected structure
    if (!response.data || !response.data.data) {
      console.error('No data in response');
      throw new Error('No data in response');
    }

    // Process the tracks to ensure proper URLs
    const processedData = {
      ...response.data,
      data: {
        ...response.data.data,
        tracks: response.data.data.tracks.map(track => {
          console.log('Processing track:', {
            title: track.title,
            coverImage: track.coverImage,
            audioFile: track.audioFile
          });
          
          const processedTrack = {
            ...track,
            coverImage: getMediaUrl(track.coverImage),
            audioFile: getMediaUrl(track.audioFile)
          };
          
          console.log('Processed track:', {
            title: processedTrack.title,
            coverImage: processedTrack.coverImage,
            audioFile: processedTrack.audioFile
          });
          
          return processedTrack;
        })
      }
    };

    return processedData;
  } catch (error) {
    console.error('Error fetching tracks:', error);
    if (error.response) {
      console.error('Error response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    throw error;
  }
};

// Get all albums
export const getAllAlbums = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<AlbumsResponse> => {
  try {
    console.log('Making API call to:', `${API_URL}/api/albums`);
    console.log('With params:', params);
    
    const response = await api.get('/api/albums', { params });
    console.log('Raw API Response:', response);
    
    // Check if response has the expected structure
    if (!response.data || !response.data.data) {
      console.error('No data in response');
      throw new Error('No data in response');
    }

    // Process the albums to ensure proper URLs
    const processedData = {
      ...response.data,
      data: {
        ...response.data.data,
        albums: response.data.data.albums.map(album => ({
          ...album,
          coverImage: getMediaUrl(album.coverImage),
          tracks: album.tracks.map(track => ({
            ...track,
            coverImage: getMediaUrl(track.coverImage),
            audioFile: getMediaUrl(track.audioFile)
          }))
        }))
      }
    };

    return processedData;
  } catch (error) {
    console.error('Error fetching albums:', error);
    if (error.response) {
      console.error('Error response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    throw error;
  }
};
