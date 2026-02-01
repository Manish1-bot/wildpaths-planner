-- Create datasets table to track uploaded files
CREATE TABLE public.datasets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'geojson', 'csv', 'shapefile'
  file_url TEXT, -- URL to stored file or null if stored as JSON
  geojson_data JSONB, -- Store small GeoJSON directly
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analysis_results table
CREATE TABLE public.analysis_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  dataset_id UUID REFERENCES public.datasets(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  analysis_type TEXT NOT NULL, -- 'fragmentation', 'connectivity', 'risk', 'full'
  results JSONB NOT NULL,
  explanations JSONB, -- Human-readable explanations
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create corridor_designs table
CREATE TABLE public.corridor_designs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  geojson_data JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  report_data JSONB NOT NULL, -- Contains all analysis data for the report
  pdf_url TEXT, -- URL to generated PDF if stored
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corridor_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for datasets
CREATE POLICY "Users can view their own datasets"
ON public.datasets FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own datasets"
ON public.datasets FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own datasets"
ON public.datasets FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own datasets"
ON public.datasets FOR DELETE
USING (user_id = auth.uid());

-- RLS Policies for analysis_results
CREATE POLICY "Users can view their own analysis results"
ON public.analysis_results FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own analysis results"
ON public.analysis_results FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own analysis results"
ON public.analysis_results FOR DELETE
USING (user_id = auth.uid());

-- RLS Policies for corridor_designs
CREATE POLICY "Users can view their own corridor designs"
ON public.corridor_designs FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own corridor designs"
ON public.corridor_designs FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own corridor designs"
ON public.corridor_designs FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own corridor designs"
ON public.corridor_designs FOR DELETE
USING (user_id = auth.uid());

-- RLS Policies for reports
CREATE POLICY "Users can view their own reports"
ON public.reports FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own reports"
ON public.reports FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own reports"
ON public.reports FOR DELETE
USING (user_id = auth.uid());

-- Add triggers for updated_at
CREATE TRIGGER update_datasets_updated_at
BEFORE UPDATE ON public.datasets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_corridor_designs_updated_at
BEFORE UPDATE ON public.corridor_designs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();