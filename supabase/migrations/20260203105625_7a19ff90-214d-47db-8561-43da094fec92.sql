-- Create audit_logs table for enhanced security
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create field_observations table for corridor and tree observations
CREATE TABLE IF NOT EXISTS public.field_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  observation_type TEXT NOT NULL CHECK (observation_type IN ('wildlife_sighting', 'habitat_area', 'risk_zone', 'infrastructure', 'corridor_suggestion', 'tree_observation')),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  habitat_type TEXT,
  species_observed TEXT[],
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  infrastructure_type TEXT,
  photo_urls TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create corridor_observations table for corridor path suggestions
CREATE TABLE IF NOT EXISTS public.corridor_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  corridor_type TEXT CHECK (corridor_type IN ('proposed', 'existing', 'alternative')),
  geojson_data JSONB NOT NULL,
  width_meters DOUBLE PRECISION DEFAULT 100,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  target_species TEXT[],
  connectivity_notes TEXT,
  risk_factors TEXT[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tree_observations table for individual tree data entry
CREATE TABLE IF NOT EXISTS public.tree_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tree_id TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  species TEXT,
  height_meters DOUBLE PRECISION,
  age_years INTEGER,
  health_status TEXT CHECK (health_status IN ('excellent', 'good', 'fair', 'poor', 'dead')),
  canopy_diameter_meters DOUBLE PRECISION,
  trunk_diameter_cm DOUBLE PRECISION,
  photo_urls TEXT[],
  notes TEXT,
  impact_status TEXT CHECK (impact_status IN ('safe', 'at_risk', 'affected', 'removed', 'transplanted')),
  impact_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  observation_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ai_detection_results table for AI tree detection from images
CREATE TABLE IF NOT EXISTS public.ai_detection_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  detection_type TEXT NOT NULL CHECK (detection_type IN ('tree_detection', 'habitat_classification', 'land_use')),
  detected_features JSONB,
  geojson_output JSONB,
  confidence_score DOUBLE PRECISION,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create google_form_imports table for tracking Google Form data
CREATE TABLE IF NOT EXISTS public.google_form_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  form_type TEXT NOT NULL CHECK (form_type IN ('corridor_observation', 'tree_observation', 'wildlife_sighting')),
  import_source TEXT NOT NULL,
  raw_data JSONB NOT NULL,
  processed_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_log JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corridor_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tree_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_detection_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_form_imports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs (admin only read, system insert)
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for field_observations
CREATE POLICY "Users can view own project observations" ON public.field_observations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.projects WHERE id = field_observations.project_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create observations" ON public.field_observations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own observations" ON public.field_observations
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own observations" ON public.field_observations
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for corridor_observations
CREATE POLICY "Users can view own project corridors" ON public.corridor_observations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.projects WHERE id = corridor_observations.project_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create corridor observations" ON public.corridor_observations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own corridor observations" ON public.corridor_observations
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own corridor observations" ON public.corridor_observations
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for tree_observations
CREATE POLICY "Users can view own project trees" ON public.tree_observations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.projects WHERE id = tree_observations.project_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create tree observations" ON public.tree_observations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tree observations" ON public.tree_observations
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own tree observations" ON public.tree_observations
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for ai_detection_results
CREATE POLICY "Users can view own AI detections" ON public.ai_detection_results
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create AI detections" ON public.ai_detection_results
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own AI detections" ON public.ai_detection_results
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for google_form_imports
CREATE POLICY "Users can view own imports" ON public.google_form_imports
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create imports" ON public.google_form_imports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_field_observations_updated_at
  BEFORE UPDATE ON public.field_observations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_corridor_observations_updated_at
  BEFORE UPDATE ON public.corridor_observations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tree_observations_updated_at
  BEFORE UPDATE ON public.tree_observations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for observation photos
INSERT INTO storage.buckets (id, name, public) VALUES ('observation-photos', 'observation-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for observation photos
CREATE POLICY "Anyone can view observation photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'observation-photos');

CREATE POLICY "Authenticated users can upload photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'observation-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'observation-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'observation-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_field_observations_project ON public.field_observations(project_id);
CREATE INDEX IF NOT EXISTS idx_field_observations_type ON public.field_observations(observation_type);
CREATE INDEX IF NOT EXISTS idx_corridor_observations_project ON public.corridor_observations(project_id);
CREATE INDEX IF NOT EXISTS idx_tree_observations_project ON public.tree_observations(project_id);
CREATE INDEX IF NOT EXISTS idx_tree_observations_species ON public.tree_observations(species);
CREATE INDEX IF NOT EXISTS idx_tree_observations_impact ON public.tree_observations(impact_status);
CREATE INDEX IF NOT EXISTS idx_ai_detection_project ON public.ai_detection_results(project_id);