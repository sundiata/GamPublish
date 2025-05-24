import axios from 'axios';

const SPOTIFY_CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID';
const SPOTIFY_CLIENT_SECRET = 'YOUR_SPOTIFY_CLIENT_SECRET';
const SPOTIFY_REDIRECT_URI = 'YOUR_REDIRECT_URI';

// Function to get access token
export const getSpotifyAccessToken = async () => {
  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', 
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: SPOTIFY_CLIENT_ID,
        client_secret: SPOTIFY_CLIENT_SECRET,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting Spotify access token:', error);
    throw error;
  }
};

// Function to search for Quran recitations
export const searchQuranRecitations = async (query: string) => {
  try {
    const accessToken = await getSpotifyAccessToken();
    const response = await axios.get('https://api.spotify.com/v1/search', {
      params: {
        q: query,
        type: 'track',
        limit: 20,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.tracks.items;
  } catch (error) {
    console.error('Error searching Spotify:', error);
    throw error;
  }
};

// Function to get track details
export const getTrackDetails = async (trackId: string) => {
  try {
    const accessToken = await getSpotifyAccessToken();
    const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error getting track details:', error);
    throw error;
  }
}; 