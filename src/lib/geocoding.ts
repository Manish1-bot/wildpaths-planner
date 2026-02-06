/**
 * Geocoding utilities using OpenStreetMap Nominatim
 * No API key required - free and open
 */

export interface GeocodingResult {
  display_name: string;
  lat: number;
  lon: number;
  type: string;
  importance: number;
  boundingbox: [string, string, string, string];
  place_type?: string;
  category?: string;
}

export interface ReverseGeocodingResult {
  display_name: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  lat: string;
  lon: string;
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

/**
 * Search for locations using free-text address
 * Examples: "SP College, Tilak Road, Pune" or "Tiger Reserve, Bandipur"
 */
export async function searchAddress(query: string): Promise<GeocodingResult[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: '5',
      countrycodes: 'in', // Default to India
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
      headers: {
        'User-Agent': 'EcoImpact Pro Environmental Assessment Tool',
      },
    });

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();
    
    return data.map((item: any) => ({
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      type: item.type,
      importance: item.importance,
      boundingbox: item.boundingbox,
      place_type: item.addresstype,
      category: item.category,
    }));
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodingResult | null> {
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      format: 'json',
      addressdetails: '1',
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params}`, {
      headers: {
        'User-Agent': 'EcoImpact Pro Environmental Assessment Tool',
      },
    });

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data = await response.json();
    
    return {
      display_name: data.display_name,
      address: data.address || {},
      lat: data.lat,
      lon: data.lon,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Detect land type from Nominatim category/type
 */
export function detectLandType(result: GeocodingResult): 'forest' | 'agricultural' | 'urban' | 'water' | 'other' {
  const category = result.category?.toLowerCase() || '';
  const type = result.type?.toLowerCase() || '';
  
  if (category.includes('natural') || type.includes('forest') || type.includes('wood')) {
    return 'forest';
  }
  if (type.includes('farm') || type.includes('agricultural') || type.includes('orchard')) {
    return 'agricultural';
  }
  if (category.includes('building') || type.includes('residential') || type.includes('commercial')) {
    return 'urban';
  }
  if (type.includes('water') || type.includes('river') || type.includes('lake')) {
    return 'water';
  }
  return 'other';
}

/**
 * Calculate appropriate zoom level based on area size
 */
export function getZoomForArea(areaHectares: number): number {
  if (areaHectares < 1) return 18;
  if (areaHectares < 5) return 17;
  if (areaHectares < 20) return 16;
  if (areaHectares < 100) return 15;
  if (areaHectares < 500) return 14;
  if (areaHectares < 2000) return 13;
  return 12;
}

/**
 * Recommend survey method based on area size
 */
export function recommendSurveyMethod(areaHectares: number): {
  method: 'detailed' | 'grid' | 'ai';
  label: string;
  description: string;
  icon: string;
} {
  if (areaHectares < 2) {
    return {
      method: 'detailed',
      label: 'Detailed Tree-by-Tree Survey',
      description: 'Click to add individual trees with full details. Best for accurate small-area inventories.',
      icon: '🌳',
    };
  }
  if (areaHectares <= 10) {
    return {
      method: 'grid',
      label: 'Grid Sampling (Recommended)',
      description: 'Survey representative sample plots. System extrapolates to estimate total count.',
      icon: '📊',
    };
  }
  return {
    method: 'ai',
    label: 'AI Aerial Detection',
    description: 'Upload satellite/drone imagery for automatic tree detection. Best for large forests.',
    icon: '🛰️',
  };
}
