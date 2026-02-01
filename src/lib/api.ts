// API client for Python FastAPI backend
const API_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function getAuthToken(): Promise<string | null> {
  const { supabase } = await import('@/integrations/supabase/client');
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = await getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.detail || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('API Error:', error);
    return { error: error instanceof Error ? error.message : 'Network error' };
  }
}

// File upload with FormData
async function uploadFile(
  endpoint: string,
  file: File,
  additionalData?: Record<string, string>
): Promise<ApiResponse<any>> {
  try {
    const token = await getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.detail || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Upload Error:', error);
    return { error: error instanceof Error ? error.message : 'Upload failed' };
  }
}

// API endpoints
export const api = {
  // GIS Upload
  uploadGIS: (file: File, projectId: string) =>
    uploadFile('/api/upload-gis', file, { project_id: projectId }),

  // Analysis
  analyze: (projectId: string, datasetId: string, analysisType: string = 'full') =>
    apiRequest<AnalysisResult>('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, dataset_id: datasetId, analysis_type: analysisType }),
    }),

  // Corridor Design
  saveCorridorDesign: (projectId: string, name: string, geojson: any) =>
    apiRequest<{ id: string }>('/api/corridor', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, name, geojson_data: geojson }),
    }),

  // Report Generation
  generateReport: (projectId: string) =>
    apiRequest<ReportResult>('/api/report', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId }),
    }),

  // Health check
  health: () => apiRequest<{ status: string }>('/health'),
};

// Types
export interface AnalysisResult {
  id: string;
  project_id: string;
  analysis_type: string;
  results: {
    species_summary?: {
      total_sightings: number;
      species_breakdown: Record<string, number>;
      area_covered_sqkm: number;
    };
    fragmentation?: {
      patch_count: number;
      avg_patch_size_sqkm: number;
      fragmentation_index: number;
      fragmentation_level: string;
    };
    connectivity?: {
      score: number;
      connections: Array<{
        from: string;
        to: string;
        quality: string;
      }>;
    };
    risk_zones?: Array<{
      name: string;
      type: string;
      risk_level: string;
      location: [number, number];
    }>;
    recommendations?: Array<{
      action: string;
      priority: string;
      description: string;
    }>;
  };
  explanations: {
    overview: string;
    fragmentation: string;
    connectivity: string;
    risks: string;
    recommendations: string;
  };
}

export interface ReportResult {
  id: string;
  title: string;
  pdf_url?: string;
  report_data: any;
}

export default api;
