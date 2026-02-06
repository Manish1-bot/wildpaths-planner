/**
 * Scientific Tree Impact Calculation Engine
 * 
 * Impact Score Formula:
 *   Impact Score = (Distance Factor × 30%) + (Root Damage × 25%) + 
 *                  (Shadow Loss × 20%) + (Species Sensitivity × 15%) + (Tree Health × 10%)
 * 
 * Compensation Value Formula:
 *   Tree Value = (Carbon Value × Age) + (Oxygen Production × 10 years) + 
 *                (Biodiversity Score × Local Rarity) + (Aesthetic Value × Location Factor)
 */

import * as turf from '@turf/turf';

export interface TreeData {
  id: string;
  coordinates: [number, number];
  species?: string;
  height_meters?: number;
  canopy_diameter_meters?: number;
  trunk_diameter_cm?: number;
  age_years?: number;
  health_status?: string;
  vulnerability_index?: number;
  carbon_stored_kg?: number;
  biodiversity_score?: number;
}

export interface DevelopmentFeature {
  type: 'polygon' | 'linestring';
  coordinates: number[][] | number[][][];
}

export interface ImpactParams {
  bufferMeters: number;
  rootZoneMultiplier: number;
  season: 'summer' | 'winter' | 'monsoon';
  sunAngleDegrees?: number;
  weights: {
    distance: number;
    rootDamage: number;
    shadowLoss: number;
    speciesSensitivity: number;
    treeHealth: number;
  };
}

export interface TreeImpactResult {
  treeId: string;
  impactScore: number;
  category: 'direct_removal' | 'high_impact' | 'medium_impact' | 'low_impact' | 'safe';
  distanceFactor: number;
  rootDamage: number;
  shadowLoss: number;
  speciesSensitivity: number;
  healthFactor: number;
  distanceToDevM: number;
  compensationValue: number;
  recommendation: string;
}

export interface AnalysisResults {
  totalTrees: number;
  affectedTrees: number;
  safeTrees: number;
  directRemoval: number;
  highImpact: number;
  mediumImpact: number;
  lowImpact: number;
  impactPercentage: number;
  totalCompensation: number;
  bySpecies: Record<string, { total: number; affected: number; safe: number }>;
  byHealth: Record<string, { total: number; affected: number }>;
  bySize: Record<string, { total: number; affected: number }>;
  treeResults: TreeImpactResult[];
}

const DEFAULT_PARAMS: ImpactParams = {
  bufferMeters: 100,
  rootZoneMultiplier: 1.5,
  season: 'summer',
  sunAngleDegrees: 60,
  weights: {
    distance: 0.30,
    rootDamage: 0.25,
    shadowLoss: 0.20,
    speciesSensitivity: 0.15,
    treeHealth: 0.10,
  },
};

/**
 * Calculate distance factor (0-100)
 * Trees closer to development get higher scores
 */
function calculateDistanceFactor(distanceM: number, bufferM: number): number {
  if (distanceM <= 0) return 100;
  if (distanceM >= bufferM) return 0;
  return Math.round((1 - distanceM / bufferM) * 100);
}

/**
 * Calculate root zone damage (0-100)
 * Based on canopy diameter × multiplier
 */
function calculateRootDamage(
  distanceM: number, 
  canopyDiameterM: number, 
  multiplier: number
): number {
  const rootZoneRadius = (canopyDiameterM / 2) * multiplier;
  if (distanceM <= 0) return 100;
  if (distanceM >= rootZoneRadius) return 0;
  return Math.round((1 - distanceM / rootZoneRadius) * 100);
}

/**
 * Calculate shadow loss based on tree height and sun angle
 */
function calculateShadowLoss(
  distanceM: number,
  heightM: number,
  sunAngleDegrees: number,
  season: 'summer' | 'winter' | 'monsoon'
): number {
  // Shadow length = height / tan(sun angle)
  const shadowLength = heightM / Math.tan((sunAngleDegrees * Math.PI) / 180);
  
  // Season adjustment
  const seasonMultiplier = season === 'winter' ? 1.5 : season === 'summer' ? 0.8 : 1.0;
  const effectiveShadowLength = shadowLength * seasonMultiplier;
  
  if (distanceM >= effectiveShadowLength) return 0;
  return Math.round((1 - distanceM / effectiveShadowLength) * 100);
}

/**
 * Convert health status to numeric factor
 */
function getHealthFactor(healthStatus?: string): number {
  switch (healthStatus?.toLowerCase()) {
    case 'excellent': return 90;
    case 'good': return 70;
    case 'fair': return 50;
    case 'poor': return 30;
    case 'dead': return 10;
    default: return 50;
  }
}

/**
 * Get species sensitivity (1-10 scale converted to 0-100)
 */
function getSpeciesSensitivity(vulnerabilityIndex?: number): number {
  return (vulnerabilityIndex || 5) * 10;
}

/**
 * Calculate tree compensation value in currency units
 */
function calculateCompensationValue(tree: TreeData): number {
  const age = tree.age_years || 20;
  const carbonRate = 20; // kg per year default
  const oxygenRate = 80; // kg per year default
  const biodiversityScore = tree.biodiversity_score || 5;
  const localRarityFactor = (tree.vulnerability_index || 5) / 5;
  const heightFactor = (tree.height_meters || 10) / 10;
  const aestheticValue = 1000; // Base aesthetic value
  const locationFactor = 1.2; // Urban premium
  
  // Currency value per unit
  const carbonValuePerKg = 0.5;
  const oxygenValuePerKg = 0.2;
  const biodiversityMultiplier = 500;
  
  const carbonValue = (tree.carbon_stored_kg || carbonRate * age) * carbonValuePerKg;
  const oxygenValue = oxygenRate * 10 * oxygenValuePerKg;
  const biodiversityValue = biodiversityScore * localRarityFactor * biodiversityMultiplier;
  const aestheticTotal = aestheticValue * heightFactor * locationFactor;
  
  return Math.round(carbonValue + oxygenValue + biodiversityValue + aestheticTotal);
}

/**
 * Get impact category based on score
 */
function getImpactCategory(score: number, distanceM: number): TreeImpactResult['category'] {
  if (distanceM <= 5) return 'direct_removal';
  if (score >= 80) return 'high_impact';
  if (score >= 50) return 'medium_impact';
  if (score >= 20) return 'low_impact';
  return 'safe';
}

/**
 * Generate recommendation based on impact
 */
function generateRecommendation(category: TreeImpactResult['category'], tree: TreeData): string {
  switch (category) {
    case 'direct_removal':
      return `TRANSPLANT (priority) - ${tree.species || 'Tree'} requires immediate relocation or compensation planting.`;
    case 'high_impact':
      return `PROTECTION REQUIRED - Install root barrier and restrict construction within ${Math.round((tree.canopy_diameter_meters || 5) * 1.5)}m radius.`;
    case 'medium_impact':
      return `MONITOR - Implement protective measures during construction. Monthly health assessments required.`;
    case 'low_impact':
      return `STANDARD PROTECTION - Follow best practices for construction near trees.`;
    default:
      return `NO ACTION - Tree is outside impact zone.`;
  }
}

/**
 * Main impact analysis function
 */
export function calculateTreeImpact(
  trees: TreeData[],
  developmentGeoJSON: GeoJSON.FeatureCollection,
  params: Partial<ImpactParams> = {}
): AnalysisResults {
  const config: ImpactParams = { ...DEFAULT_PARAMS, ...params };
  
  // Create buffered development zone
  const bufferedDev = turf.buffer(developmentGeoJSON, config.bufferMeters / 1000, { units: 'kilometers' });
  
  const results: TreeImpactResult[] = [];
  const bySpecies: Record<string, { total: number; affected: number; safe: number }> = {};
  const byHealth: Record<string, { total: number; affected: number }> = {};
  const bySize: Record<string, { total: number; affected: number }> = {};
  
  let directRemoval = 0;
  let highImpact = 0;
  let mediumImpact = 0;
  let lowImpact = 0;
  let safeTrees = 0;
  let totalCompensation = 0;
  
  for (const tree of trees) {
    const treePoint = turf.point(tree.coordinates);
    
    // Calculate distance to nearest development feature
    let minDistance = Infinity;
    turf.featureEach(developmentGeoJSON, (feature) => {
      const distance = turf.pointToLineDistance(treePoint, feature as any, { units: 'meters' });
      if (distance < minDistance) minDistance = distance;
    });
    
    // Calculate individual factors
    const distanceFactor = calculateDistanceFactor(minDistance, config.bufferMeters);
    const rootDamage = calculateRootDamage(
      minDistance, 
      tree.canopy_diameter_meters || 5, 
      config.rootZoneMultiplier
    );
    const shadowLoss = calculateShadowLoss(
      minDistance,
      tree.height_meters || 10,
      config.sunAngleDegrees || 60,
      config.season
    );
    const speciesSensitivity = getSpeciesSensitivity(tree.vulnerability_index);
    const healthFactor = getHealthFactor(tree.health_status);
    
    // Calculate weighted impact score
    const impactScore = Math.round(
      distanceFactor * config.weights.distance +
      rootDamage * config.weights.rootDamage +
      shadowLoss * config.weights.shadowLoss +
      speciesSensitivity * config.weights.speciesSensitivity +
      (100 - healthFactor) * config.weights.treeHealth // Unhealthy trees are more at risk
    );
    
    const category = getImpactCategory(impactScore, minDistance);
    const compensationValue = calculateCompensationValue(tree);
    const recommendation = generateRecommendation(category, tree);
    
    results.push({
      treeId: tree.id,
      impactScore,
      category,
      distanceFactor,
      rootDamage,
      shadowLoss,
      speciesSensitivity,
      healthFactor,
      distanceToDevM: Math.round(minDistance),
      compensationValue,
      recommendation,
    });
    
    // Update category counts
    switch (category) {
      case 'direct_removal': directRemoval++; break;
      case 'high_impact': highImpact++; break;
      case 'medium_impact': mediumImpact++; break;
      case 'low_impact': lowImpact++; break;
      case 'safe': safeTrees++; break;
    }
    
    // Track by species
    const species = tree.species || 'Unknown';
    if (!bySpecies[species]) bySpecies[species] = { total: 0, affected: 0, safe: 0 };
    bySpecies[species].total++;
    if (category !== 'safe') {
      bySpecies[species].affected++;
      totalCompensation += compensationValue;
    } else {
      bySpecies[species].safe++;
    }
    
    // Track by health
    const health = tree.health_status || 'Unknown';
    if (!byHealth[health]) byHealth[health] = { total: 0, affected: 0 };
    byHealth[health].total++;
    if (category !== 'safe') byHealth[health].affected++;
    
    // Track by size
    const sizeCategory = getSizeCategory(tree.trunk_diameter_cm || 20);
    if (!bySize[sizeCategory]) bySize[sizeCategory] = { total: 0, affected: 0 };
    bySize[sizeCategory].total++;
    if (category !== 'safe') bySize[sizeCategory].affected++;
  }
  
  const affectedTrees = directRemoval + highImpact + mediumImpact + lowImpact;
  
  return {
    totalTrees: trees.length,
    affectedTrees,
    safeTrees,
    directRemoval,
    highImpact,
    mediumImpact,
    lowImpact,
    impactPercentage: trees.length > 0 ? Math.round((affectedTrees / trees.length) * 100 * 10) / 10 : 0,
    totalCompensation,
    bySpecies,
    byHealth,
    bySize,
    treeResults: results,
  };
}

function getSizeCategory(dbhCm: number): string {
  if (dbhCm < 30) return 'Small (<30cm)';
  if (dbhCm < 60) return 'Medium (30-60cm)';
  if (dbhCm < 100) return 'Large (60-100cm)';
  return 'Giant (>100cm)';
}

/**
 * Generate mitigation recommendations based on analysis
 */
export function generateMitigationPlan(results: AnalysisResults): {
  measures: Array<{
    type: string;
    priority: string;
    description: string;
    estimatedCost: number;
    affectedTrees: number;
    timelineWeeks: number;
  }>;
  totalCost: number;
  timelineMonths: number;
} {
  const measures = [];
  let totalCost = 0;
  
  if (results.directRemoval > 0) {
    const cost = results.directRemoval * 5000; // Cost per transplant
    measures.push({
      type: 'transplant',
      priority: 'critical',
      description: `Transplant ${results.directRemoval} trees to alternative locations`,
      estimatedCost: cost,
      affectedTrees: results.directRemoval,
      timelineWeeks: Math.ceil(results.directRemoval / 5),
    });
    totalCost += cost;
  }
  
  if (results.highImpact > 0) {
    const cost = results.highImpact * 2000;
    measures.push({
      type: 'protection',
      priority: 'high',
      description: `Install root barriers and exclusion zones for ${results.highImpact} high-impact trees`,
      estimatedCost: cost,
      affectedTrees: results.highImpact,
      timelineWeeks: Math.ceil(results.highImpact / 10),
    });
    totalCost += cost;
  }
  
  if (results.mediumImpact > 0) {
    const cost = results.mediumImpact * 500;
    measures.push({
      type: 'monitoring',
      priority: 'medium',
      description: `Monthly health monitoring for ${results.mediumImpact} medium-impact trees`,
      estimatedCost: cost,
      affectedTrees: results.mediumImpact,
      timelineWeeks: 4,
    });
    totalCost += cost;
  }
  
  // Compensation planting
  const compensationTrees = Math.ceil(results.directRemoval * 3);
  if (compensationTrees > 0) {
    const cost = compensationTrees * 1500;
    measures.push({
      type: 'replacement',
      priority: 'high',
      description: `Plant ${compensationTrees} replacement trees (3:1 ratio)`,
      estimatedCost: cost,
      affectedTrees: compensationTrees,
      timelineWeeks: 8,
    });
    totalCost += cost;
  }
  
  const totalWeeks = measures.reduce((max, m) => Math.max(max, m.timelineWeeks), 0);
  
  return {
    measures,
    totalCost,
    timelineMonths: Math.ceil(totalWeeks / 4),
  };
}
