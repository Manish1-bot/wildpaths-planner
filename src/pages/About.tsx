import { AppHeader } from '@/components/layout/AppHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TreePine, 
  Map, 
  BarChart3, 
  FileText, 
  Users, 
  Shield,
  Layers,
  Zap
} from 'lucide-react';

export default function About() {
  const features = [
    {
      icon: Map,
      title: 'Interactive Mapping',
      description: 'Visualize wildlife habitats, corridors, and risk zones on an interactive map with drawing tools.',
    },
    {
      icon: BarChart3,
      title: 'Habitat Analysis',
      description: 'Analyze habitat fragmentation, connectivity, and risk zones with easy-to-understand explanations.',
    },
    {
      icon: Layers,
      title: 'GIS Data Support',
      description: 'Upload GeoJSON and CSV files with automatic conversion and analysis.',
    },
    {
      icon: FileText,
      title: 'Report Generation',
      description: 'Generate comprehensive PDF reports with analysis results and recommendations.',
    },
    {
      icon: Users,
      title: 'Role-Based Access',
      description: 'Support for planners, researchers, NGOs, and administrators with appropriate permissions.',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is securely stored with row-level security and encrypted connections.',
    },
  ];

  const workflow = [
    { step: 1, title: 'Create Project', desc: 'Set up a new corridor planning project with region and species info' },
    { step: 2, title: 'Upload Data', desc: 'Upload habitat polygons, wildlife sightings, or road networks' },
    { step: 3, title: 'Run Analysis', desc: 'Analyze fragmentation, connectivity, and identify risk zones' },
    { step: 4, title: 'Design Corridors', desc: 'Use the map tools to draw and design wildlife corridors' },
    { step: 5, title: 'Generate Report', desc: 'Create a professional PDF report to share with stakeholders' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <TreePine className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-heading font-bold mb-4">About TerraByte</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A comprehensive wildlife corridor planning system designed to help conservationists 
            analyze habitats, design corridors, and protect wildlife connectivity.
          </p>
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-2xl font-heading font-bold text-center mb-8">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="glass-card">
                <CardHeader>
                  <div className="p-3 bg-primary/10 rounded-lg w-fit mb-2">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-heading text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Workflow */}
        <div className="mb-16">
          <h2 className="text-2xl font-heading font-bold text-center mb-8">How It Works</h2>
          <div className="max-w-3xl mx-auto">
            {workflow.map((item, idx) => (
              <div key={item.step} className="flex gap-4 mb-6">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    {item.step}
                  </div>
                  {idx < workflow.length - 1 && (
                    <div className="w-0.5 h-full bg-primary/20 mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <h3 className="font-heading font-semibold text-lg">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <Card className="glass-card max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Technology
            </CardTitle>
            <CardDescription>Built with modern, reliable technologies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                'React',
                'TypeScript',
                'MapLibre GL',
                'Turf.js',
                'Supabase',
                'PostgreSQL',
                'Tailwind CSS',
                'FastAPI (Python)',
                'GeoPandas',
                'PostGIS',
              ].map((tech) => (
                <Badge key={tech} variant="secondary">
                  {tech}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
