-- Add comprehensive fields to tree_observations table
ALTER TABLE public.tree_observations
ADD COLUMN IF NOT EXISTS tree_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS species_scientific VARCHAR(255),
ADD COLUMN IF NOT EXISTS canopy_ns_m DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS canopy_ew_m DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS crown_density_percent INT,
ADD COLUMN IF NOT EXISTS pests_diseases TEXT[],
ADD COLUMN IF NOT EXISTS structural_issues TEXT[],
ADD COLUMN IF NOT EXISTS carbon_stored_kg DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS annual_oxygen_kg DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS biodiversity_score INT,
ADD COLUMN IF NOT EXISTS habitat_value TEXT,
ADD COLUMN IF NOT EXISTS species_vulnerability_index INT,
ADD COLUMN IF NOT EXISTS root_zone_radius_m DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS monetary_value DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS accuracy_m DECIMAL(5,2);

-- Add comprehensive fields to corridor_observations for corridor design system
ALTER TABLE public.corridor_observations
ADD COLUMN IF NOT EXISTS corridor_path_geojson JSONB,
ADD COLUMN IF NOT EXISTS source_area_geojson JSONB,
ADD COLUMN IF NOT EXISTS target_area_geojson JSONB,
ADD COLUMN IF NOT EXISTS total_length_km DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS connectivity_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS least_cost_score DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS barrier_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS pinch_points JSONB,
ADD COLUMN IF NOT EXISTS habitat_quality_avg DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS resistance_matrix JSONB,
ADD COLUMN IF NOT EXISTS analysis_parameters JSONB,
ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS timeline_months INT,
ADD COLUMN IF NOT EXISTS implementation_status VARCHAR(50) DEFAULT 'planning',
ADD COLUMN IF NOT EXISTS interventions JSONB;

-- Create impact_analyses table for detailed impact tracking
CREATE TABLE IF NOT EXISTS public.impact_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    corridor_id UUID REFERENCES public.corridor_observations(id) ON DELETE SET NULL,
    analysis_name VARCHAR(255) NOT NULL,
    
    -- Parameters
    buffer_distance_m INT DEFAULT 100,
    root_zone_multiplier DECIMAL(3,2) DEFAULT 1.5,
    season VARCHAR(50) DEFAULT 'summer',
    impact_criteria JSONB,
    
    -- Results
    total_trees INT DEFAULT 0,
    affected_trees INT DEFAULT 0,
    safe_trees INT DEFAULT 0,
    direct_removal INT DEFAULT 0,
    high_impact INT DEFAULT 0,
    medium_impact INT DEFAULT 0,
    impact_percentage DECIMAL(5,2),
    
    -- Detailed Breakdown
    by_species JSONB,
    by_size JSONB,
    by_health JSONB,
    spatial_distribution JSONB,
    
    -- Recommendations
    mitigation_measures JSONB,
    total_compensation DECIMAL(12,2),
    implementation_cost DECIMAL(12,2),
    
    -- Report
    report_url TEXT,
    report_data JSONB,
    
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create resistance_templates table for species-specific movement costs
CREATE TABLE IF NOT EXISTS public.resistance_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    species_name VARCHAR(255),
    species_scientific VARCHAR(255),
    land_type_costs JSONB NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create species_database for tree species information
CREATE TABLE IF NOT EXISTS public.species_database (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scientific_name VARCHAR(255) NOT NULL UNIQUE,
    common_name VARCHAR(255),
    local_names JSONB,
    family VARCHAR(255),
    vulnerability_index INT,
    growth_rate VARCHAR(50),
    max_height_m DECIMAL(5,2),
    max_dbh_cm DECIMAL(6,2),
    lifespan_years INT,
    carbon_sequestration_rate DECIMAL(8,2),
    oxygen_production_rate DECIMAL(8,2),
    ecological_value_notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.impact_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resistance_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species_database ENABLE ROW LEVEL SECURITY;

-- Policies for impact_analyses
CREATE POLICY "Users can view own impact analyses"
    ON public.impact_analyses FOR SELECT
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM projects WHERE projects.id = impact_analyses.project_id AND projects.user_id = auth.uid()
    ));

CREATE POLICY "Users can create impact analyses"
    ON public.impact_analyses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own impact analyses"
    ON public.impact_analyses FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own impact analyses"
    ON public.impact_analyses FOR DELETE
    USING (user_id = auth.uid());

-- Policies for resistance_templates
CREATE POLICY "Users can view resistance templates"
    ON public.resistance_templates FOR SELECT
    USING (user_id = auth.uid() OR is_default = true);

CREATE POLICY "Users can create resistance templates"
    ON public.resistance_templates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resistance templates"
    ON public.resistance_templates FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own resistance templates"
    ON public.resistance_templates FOR DELETE
    USING (user_id = auth.uid());

-- Policies for species_database (read for all authenticated users)
CREATE POLICY "Authenticated users can view species database"
    ON public.species_database FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage species database"
    ON public.species_database FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role));

-- Add audit triggers to new tables
CREATE TRIGGER audit_impact_analyses
    AFTER INSERT OR UPDATE OR DELETE ON public.impact_analyses
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_resistance_templates
    AFTER INSERT OR UPDATE OR DELETE ON public.resistance_templates
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_impact_analyses_project ON public.impact_analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_impact_analyses_corridor ON public.impact_analyses(corridor_id);
CREATE INDEX IF NOT EXISTS idx_resistance_templates_species ON public.resistance_templates(species_name);
CREATE INDEX IF NOT EXISTS idx_species_database_name ON public.species_database(scientific_name);