/**
 * Chapman-Richards Growth Model for 10-year projections
 * H(t) = α × (1 - exp(-β × t))^γ
 * 
 * Where:
 * - α = asymptotic height (max height)
 * - β = growth rate parameter
 * - γ = shape parameter
 */

export interface GrowthParams {
  alpha: number;  // Asymptotic height (m)
  beta: number;   // Growth rate
  gamma: number;  // Shape parameter
  lifespan: number; // Years
}

export interface YearlyProjection {
  year: number;
  natural_height: number;
  projected_height: number;
  health_score: number;
  survival_probability: number;
  carbon_stored_kg: number;
  carbon_loss_kg: number;
  growth_reduction_percent: number;
}

export interface GrowthProjection {
  species: string;
  current_age: number;
  current_height: number;
  development_type: string;
  projections: YearlyProjection[];
  summary: {
    total_carbon_loss_kg: number;
    final_height_reduction_percent: number;
    survival_probability_10yr: number;
    growth_impairment: 'severe' | 'moderate' | 'mild' | 'none';
  };
}

// Species-specific growth parameters
const SPECIES_GROWTH_PARAMS: Record<string, GrowthParams> = {
  'Mango': { alpha: 25, beta: 0.15, gamma: 1.5, lifespan: 100 },
  'Banyan': { alpha: 40, beta: 0.08, gamma: 2.0, lifespan: 200 },
  'Neem': { alpha: 30, beta: 0.12, gamma: 1.8, lifespan: 150 },
  'Teak': { alpha: 35, beta: 0.10, gamma: 1.7, lifespan: 80 },
  'Peepal': { alpha: 35, beta: 0.09, gamma: 1.9, lifespan: 150 },
  'Coconut': { alpha: 30, beta: 0.20, gamma: 1.3, lifespan: 80 },
  'Jamun': { alpha: 25, beta: 0.11, gamma: 1.6, lifespan: 100 },
  'Gulmohar': { alpha: 20, beta: 0.18, gamma: 1.4, lifespan: 60 },
  'Ashoka': { alpha: 18, beta: 0.14, gamma: 1.5, lifespan: 50 },
  'Tamarind': { alpha: 30, beta: 0.08, gamma: 2.0, lifespan: 200 },
  'default': { alpha: 25, beta: 0.12, gamma: 1.6, lifespan: 100 },
};

// Development impact factors (growth reduction multiplier)
const DEVELOPMENT_IMPACT_FACTORS: Record<string, number> = {
  'road_construction': 0.6,      // 40% growth reduction
  'building': 0.5,               // 50% growth reduction
  'mining': 0.3,                 // 70% growth reduction
  'agriculture': 0.8,            // 20% growth reduction
  'highway': 0.4,                // 60% growth reduction
  'railway': 0.5,                // 50% growth reduction
  'urban_development': 0.45,     // 55% growth reduction
  'industrial': 0.35,            // 65% growth reduction
  'pipeline': 0.7,               // 30% growth reduction
  'power_line': 0.75,            // 25% growth reduction
  'default': 0.6,                // 40% growth reduction
};

/**
 * Chapman-Richards growth function
 */
function chapmanRichardsHeight(age: number, params: GrowthParams): number {
  return params.alpha * Math.pow(1 - Math.exp(-params.beta * age), params.gamma);
}

/**
 * Calculate carbon storage based on height and age
 * Simplified model: Carbon (kg) = 0.25 × (DBH_cm)^2.5 × 0.5
 * We estimate DBH from height using allometric relationship
 */
function estimateCarbonStorage(height: number, age: number): number {
  // Estimate DBH from height (simplified allometric)
  const estimatedDBH = Math.pow(height * 2, 0.8) * 5;
  return 0.25 * Math.pow(estimatedDBH, 2.5) * 0.5;
}

/**
 * Calculate health decline based on impact
 */
function calculateHealthDecline(
  baseHealth: number,
  year: number,
  impactFactor: number
): number {
  // Health declines faster with lower impact factor (more stress)
  const stressFactor = 1 - impactFactor;
  const annualDecline = stressFactor * 0.05; // Max 5% per year at 100% impact
  return Math.max(10, baseHealth - (annualDecline * year * 100));
}

/**
 * Calculate survival probability based on health and age
 */
function calculateSurvivalProbability(
  health: number,
  age: number,
  lifespan: number,
  year: number,
  impactFactor: number
): number {
  const ageRatio = (age + year) / lifespan;
  const healthFactor = health / 100;
  const stressFactor = impactFactor;
  
  // Base survival decreases with age and stress
  let survival = 0.95 * healthFactor * stressFactor;
  survival *= Math.pow(0.99, ageRatio * 10); // Age penalty
  survival *= Math.pow(0.95, year); // Cumulative stress over years
  
  return Math.max(0.05, Math.min(0.99, survival)) * 100;
}

/**
 * Generate 10-year growth projection
 */
export function projectGrowth(
  species: string,
  currentAge: number,
  currentHeight: number,
  developmentType: string,
  currentHealth: number = 80
): GrowthProjection {
  const params = SPECIES_GROWTH_PARAMS[species] || SPECIES_GROWTH_PARAMS['default'];
  const impactFactor = DEVELOPMENT_IMPACT_FACTORS[developmentType] || DEVELOPMENT_IMPACT_FACTORS['default'];
  
  const projections: YearlyProjection[] = [];
  let totalCarbonLoss = 0;
  
  for (let year = 0; year <= 10; year++) {
    const futureAge = currentAge + year;
    
    // Natural growth (without development)
    const naturalHeight = chapmanRichardsHeight(futureAge, params);
    
    // Impacted growth (with development)
    const projectedHeight = year === 0 
      ? currentHeight 
      : currentHeight + (naturalHeight - chapmanRichardsHeight(currentAge, params)) * impactFactor;
    
    // Health deterioration
    const healthScore = year === 0 
      ? currentHealth 
      : calculateHealthDecline(currentHealth, year, impactFactor);
    
    // Survival probability
    const survivalProb = calculateSurvivalProbability(
      healthScore, 
      currentAge, 
      params.lifespan, 
      year, 
      impactFactor
    );
    
    // Carbon calculations
    const naturalCarbon = estimateCarbonStorage(naturalHeight, futureAge);
    const projectedCarbon = estimateCarbonStorage(projectedHeight, futureAge) * (healthScore / 100);
    const carbonLoss = Math.max(0, naturalCarbon - projectedCarbon);
    
    if (year > 0) {
      totalCarbonLoss += carbonLoss - (projections[year - 1]?.carbon_loss_kg || 0);
    }
    
    const growthReduction = naturalHeight > 0 
      ? ((naturalHeight - projectedHeight) / naturalHeight) * 100 
      : 0;
    
    projections.push({
      year,
      natural_height: Math.round(naturalHeight * 10) / 10,
      projected_height: Math.round(projectedHeight * 10) / 10,
      health_score: Math.round(healthScore),
      survival_probability: Math.round(survivalProb),
      carbon_stored_kg: Math.round(projectedCarbon * 10) / 10,
      carbon_loss_kg: Math.round(carbonLoss * 10) / 10,
      growth_reduction_percent: Math.round(growthReduction),
    });
  }
  
  // Calculate summary
  const finalProjection = projections[10];
  const finalHeightReduction = finalProjection.growth_reduction_percent;
  
  let growthImpairment: GrowthProjection['summary']['growth_impairment'];
  if (finalHeightReduction > 50) growthImpairment = 'severe';
  else if (finalHeightReduction > 30) growthImpairment = 'moderate';
  else if (finalHeightReduction > 10) growthImpairment = 'mild';
  else growthImpairment = 'none';
  
  return {
    species,
    current_age: currentAge,
    current_height: currentHeight,
    development_type: developmentType,
    projections,
    summary: {
      total_carbon_loss_kg: Math.round(totalCarbonLoss * 10) / 10,
      final_height_reduction_percent: finalHeightReduction,
      survival_probability_10yr: finalProjection.survival_probability,
      growth_impairment: growthImpairment,
    },
  };
}

/**
 * Get development type display name
 */
export function getDevelopmentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'road_construction': 'Road Construction',
    'building': 'Building Development',
    'mining': 'Mining Operations',
    'agriculture': 'Agricultural Development',
    'highway': 'Highway Project',
    'railway': 'Railway Line',
    'urban_development': 'Urban Development',
    'industrial': 'Industrial Zone',
    'pipeline': 'Pipeline Installation',
    'power_line': 'Power Line Installation',
  };
  return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Get all available development types
 */
export function getDevelopmentTypes(): { value: string; label: string; impactPercent: number }[] {
  return Object.entries(DEVELOPMENT_IMPACT_FACTORS)
    .filter(([key]) => key !== 'default')
    .map(([value, factor]) => ({
      value,
      label: getDevelopmentTypeLabel(value),
      impactPercent: Math.round((1 - factor) * 100),
    }))
    .sort((a, b) => b.impactPercent - a.impactPercent);
}
