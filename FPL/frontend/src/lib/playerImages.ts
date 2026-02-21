// lib/playerImages.ts

type PlayerImageData = {
  player_id: number;
  code: number;
  name: string;
  web_name: string;
  position: number;
  team_id: number;
  team_name: string;
  team_code: number;
  photo_id: string;
  selected_size: string;
  filename: string;
  url_used: string;
  season_path: string;
  found: boolean;
};

// Cache for the player images data
let playerImageMap: Map<number, PlayerImageData> | null = null;

// Load and cache player images data
async function loadPlayerImagesData(): Promise<Map<number, PlayerImageData>> {
  if (playerImageMap) {
    return playerImageMap;
  }

  try {
    const response = await fetch('/pl_images/players_map_best.json');
    if (!response.ok) {
      console.warn('Failed to load player images data');
      return new Map();
    }
    
    const playerImages: PlayerImageData[] = await response.json();
    
    // Create a lookup map for faster access
    playerImageMap = new Map<number, PlayerImageData>();
    playerImages.forEach(player => {
      if (player.found && player.filename) {
        playerImageMap!.set(player.player_id, player);
      }
    });
    
    return playerImageMap;
  } catch (error) {
    console.warn('Error loading player images data:', error);
    return new Map();
  }
}

export function getPlayerImageSources(playerId: number): string[] {
  // Return early if data hasn't loaded yet
  if (!playerImageMap) {
    // Initialize loading in the background but return empty for now
    loadPlayerImagesData();
    return [];
  }

  const playerData = playerImageMap.get(playerId);
  
  if (playerData && playerData.found && playerData.filename) {
    // Return multiple size options as fallbacks
    const sources = [];
    
    // Add high quality first
    if (playerData.selected_size === '250x250') {
      sources.push(`/pl_images/250x250/${playerData.filename}`);
    } else if (playerData.selected_size === '110x140') {
      sources.push(`/pl_images/110x140/${playerData.filename}`);
    }
    
    // Add fallback from other size directory
    const fallbackSize = playerData.selected_size === '250x250' ? '110x140' : '250x250';
    const fallbackFilename = playerData.filename;
    sources.push(`/pl_images/${fallbackSize}/${fallbackFilename}`);
    
    return sources;
  }
  
  return [];
}

export function hasPlayerImage(playerId: number): boolean {
  if (!playerImageMap) {
    loadPlayerImagesData();
    return false;
  }
  
  const playerData = playerImageMap.get(playerId);
  return playerData?.found === true && !!playerData.filename;
}

export async function getPlayerImageUrl(playerId: number, size: '250x250' | '110x140' = '250x250'): Promise<string | null> {
  const imageMap = await loadPlayerImagesData();
  const playerData = imageMap.get(playerId);
  
  if (playerData && playerData.found && playerData.filename) {
    // Use the most appropriate size available
    if (size === '250x250' && playerData.selected_size === '250x250') {
      return `/pl_images/250x250/${playerData.filename}`;
    } else if (size === '110x140' && playerData.selected_size === '110x140') {
      return `/pl_images/110x140/${playerData.filename}`;
    } else {
      // Fallback to any available size
      return `/pl_images/${playerData.selected_size}/${playerData.filename}`;
    }
  }
  
  return null;
}

// Initialize data loading
loadPlayerImagesData();

export default {
  getPlayerImageUrl,
  getPlayerImageSources,
  hasPlayerImage
};