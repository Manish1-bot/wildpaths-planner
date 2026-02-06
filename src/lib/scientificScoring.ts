/**
 * Scientific Tree Impact Scoring Engine
 * 
 * Transparent scoring with exact formula as specified:
 * - Distance: 30% (0-30 points)
 * - Species Sensitivity: 25% (0-25 points)  
 * - Age Factor: 20% (0-20 points)
 * - Health Status: 15% (0-15 points)
 * - Ecological Role: 10% (0-10 points)
 * 
 * Total: 0-100 points
 */

export interface TreeScoreInput {
  id: string;
  species: string;
  age_years: number;
  health_stars: 1 | 2 | 3 | 4 | 5;
  distance_to_development_m: number;
  has_birds_nest?: boolean;
  has_flowers_fruits?: boolean;
  provides_shade?: boolean;
  height_meters?: number;
  dbh_cm?: number;
  canopy_diameter_m?: number;
}

export interface ScoreBreakdown {
  distance: number;
  species: number;
  age: number;
  health: number;
  ecological: number;
}

export interface TreeImpactScore {
  tree_id: string;
  total_score: number;
  breakdown: ScoreBreakdown;
  category: string;
  category_code: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'NEGLIGIBLE';
  category_color: string;
  recommendation: string;
  compensation_value: number;
}

// Species sensitivity scores (0-25 points)
const SPECIES_SENSITIVITY: Record<string, number> = {
  // Heritage/Religious Trees
  'Banyan': 25,
  'Peepal': 25,
  'Bodhi': 25,
  
  // High-value/Protected
  'Sandalwood': 20,
  'Teak': 18,
  'Rosewood': 18,
  'Sal': 17,
  
  // Medicinal/High Ecological Value
  'Neem': 15,
  'Jamun': 15,
  'Arjun': 14,
  'Amla': 14,
  'Ashoka': 13,
  
  // Common Fruit Trees
  'Mango': 10,
  'Jackfruit': 10,
  'Tamarind': 10,
  
  // Common Trees
  'Coconut': 8,
  'Gulmohar': 8,
  'Rain Tree': 7,
  'Eucalyptus': 5,
  
  // Default
  'Unknown': 5,
  'Other': 5,
};

// Health star to points mapping (0-15)
const HEALTH_STAR_POINTS: Record<number, number> = {
  5: 15, // Excellent
  4: 12, // Good
  3: 9,  // Fair
  2: 6,  // Poor
  1: 3,  // Very Poor
};

/**
 * Calculate distance factor (0-30 points)
 * Trees closer to development get higher impact scores
 */
function calculateDistanceScore(distanceM: number): number {
  if (distanceM < 10) return 30;
  if (distanceM < 30) return 20;
  if (distanceM < 50) return 10;
  return 5;
}

/**
 * Calculate age factor (0-20 points)
 */
function calculateAgeScore(ageYears: number): number {
  if (ageYears > 100) return 20; // Heritage tree
  if (ageYears > 50) return 15;  // Mature tree
  if (ageYears > 20) return 10;  // Adult tree
  if (ageYears > 5) return 5;    // Young tree
  return 2;                       // Sapling
}

/**
 * Calculate species sensitivity score (0-25 points)
 */
function calculateSpeciesScore(species: string): number {
  // Try exact match first
  const exactMatch = SPECIES_SENSITIVITY[species];
  if (exactMatch !== undefined) return exactMatch;
  
  // Try case-insensitive match
  const lowerSpecies = species.toLowerCase();
  for (const [key, value] of Object.entries(SPECIES_SENSITIVITY)) {
    if (key.toLowerCase() === lowerSpecies) return value;
    if (lowerSpecies.includes(key.toLowerCase())) return value;
  }
  
  return 10; // Default middle value
}

/**
 * Calculate ecological role score (0-10 points)
 */
function calculateEcologicalScore(tree: TreeScoreInput): number {
  let score = 0;
  if (tree.has_birds_nest) score += 4;
  if (tree.has_flowers_fruits) score += 3;
  if (tree.provides_shade) score += 3;
  return score;
}

/**
 * Get impact category based on total score
 */
function getImpactCategory(score: number): { 
  category: string; 
  code: TreeImpactScore['category_code']; 
  color: string;
} {
  if (score >= 80) {
    return { 
      category: 'CRITICAL - Immediate protection required', 
      code: 'CRITICAL',
      color: '#dc2626' // red-600
    };
  }
  if (score >= 60) {
    return { 
      category: 'HIGH - Significant impact expected', 
      code: 'HIGH',
      color: '#ea580c' // orange-600
    };
  }
  if (score >= 40) {
    return { 
      category: 'MODERATE - Mitigation measures needed', 
      code: 'MODERATE',
      color: '#ca8a04' // yellow-600
    };
  }
  if (score >= 20) {
    return { 
      category: 'LOW - Minimal impact', 
      code: 'LOW',
      color: '#65a30d' // lime-600
    };
  }
  return { 
    category: 'NEGLIGIBLE - No significant impact', 
    code: 'NEGLIGIBLE',
    color: '#16a34a' // green-600
  };
}

/**
 * Generate recommendation based on category
 */
function generateRecommendation(code: TreeImpactScore['category_code'], tree: TreeScoreInput): string {
  switch (code) {
    case 'CRITICAL':
      return `RELOCATE IMMEDIATELY - ${tree.species} (${tree.age_years}y) requires urgent transplantation or 10:1 compensation planting.`;
    case 'HIGH':
      return `PROTECT - Install root barrier, restrict construction within ${Math.ceil((tree.canopy_diameter_m || 5) * 1.5)}m radius. Monthly monitoring required.`;
    case 'MODERATE':
      return `MONITOR - Implement standard protective measures. Quarterly health assessments recommended.`;
    case 'LOW':
      return `STANDARD CARE - Follow best practices for construction near trees.`;
    case 'NEGLIGIBLE':
      return `NO ACTION REQUIRED - Tree is outside significant impact zone.`;
  }
}

/**
 * Calculate compensation value in INR
 */
function calculateCompensation(tree: TreeScoreInput, score: number): number {
  const baseValue = 5000; // Base compensation per tree
  const ageMultiplier = tree.age_years > 100 ? 10 : tree.age_years > 50 ? 5 : tree.age_years > 20 ? 2 : 1;
  const speciesMultiplier = (calculateSpeciesScore(tree.species) / 25) * 2 + 1;
  const impactMultiplier = score / 50;
  const heightMultiplier = (tree.height_meters || 10) / 10;
  
  return Math.round(baseValue * ageMultiplier * speciesMultiplier * impactMultiplier * heightMultiplier);
}

/**
 * Main scoring function - calculates impact score with full breakdown
 */
export function calculateTreeImpactScore(tree: TreeScoreInput): TreeImpactScore {
  const breakdown: ScoreBreakdown = {
    distance: calculateDistanceScore(tree.distance_to_development_m),
    species: calculateSpeciesScore(tree.species),
    age: calculateAgeScore(tree.age_years),
    health: HEALTH_STAR_POINTS[tree.health_stars] || 9,
    ecological: calculateEcologicalScore(tree),
  };
  
  const total_score = breakdown.distance + breakdown.species + breakdown.age + breakdown.health + breakdown.ecological;
  const { category, code, color } = getImpactCategory(total_score);
  
  return {
    tree_id: tree.id,
    total_score,
    breakdown,
    category,
    category_code: code,
    category_color: color,
    recommendation: generateRecommendation(code, tree),
    compensation_value: calculateCompensation(tree, total_score),
  };
}

/**
 * Batch scoring for multiple trees
 */
export function calculateBatchImpactScores(trees: TreeScoreInput[]): {
  scores: TreeImpactScore[];
  summary: {
    total: number;
    critical: number;
    high: number;
    moderate: number;
    low: number;
    negligible: number;
    total_compensation: number;
    avg_score: number;
  };
} {
  const scores = trees.map(calculateTreeImpactScore);
  
  const summary = {
    total: scores.length,
    critical: scores.filter(s => s.category_code === 'CRITICAL').length,
    high: scores.filter(s => s.category_code === 'HIGH').length,
    moderate: scores.filter(s => s.category_code === 'MODERATE').length,
    low: scores.filter(s => s.category_code === 'LOW').length,
    negligible: scores.filter(s => s.category_code === 'NEGLIGIBLE').length,
    total_compensation: scores.reduce((sum, s) => sum + s.compensation_value, 0),
    avg_score: scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s.total_score, 0) / scores.length) : 0,
  };
  
  return { scores, summary };
}

/**
 * Get score breakdown as formatted string for display
 */
export function formatScoreBreakdown(breakdown: ScoreBreakdown): string {
  return `Distance: ${breakdown.distance}/30 | Species: ${breakdown.species}/25 | Age: ${breakdown.age}/20 | Health: ${breakdown.health}/15 | Ecological: ${breakdown.ecological}/10`;
}
