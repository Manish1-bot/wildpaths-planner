import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TreePine, 
  Map, 
  Upload, 
  FileText, 
  ArrowRight,
  Shield,
  Globe,
  Users,
  BarChart3,
  Layers
} from 'lucide-react';

export default function Index() {
  const features = [
    {
      icon: Map,
      title: 'Interactive Map Visualization',
      description: 'View and analyze GIS data on an interactive map with multiple layer support',
    },
    {
      icon: Upload,
      title: 'GIS File Upload',
      description: 'Upload GeoJSON, Shapefile, KML, and other common GIS formats',
    },
    {
      icon: Layers,
      title: 'Corridor Design Tools',
      description: 'Draw corridors, create buffer zones, and place infrastructure markers',
    },
    {
      icon: BarChart3,
      title: 'Spatial Analysis',
      description: 'Run fragmentation analysis, connectivity scoring, and risk mapping',
    },
    {
      icon: FileText,
      title: 'Report Generation',
      description: 'Generate professional reports with maps, charts, and recommendations',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Work together with role-based access for planners, NGOs, and researchers',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TreePine className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-heading font-bold text-primary">EcoImpact</h1>
                <p className="text-xs text-muted-foreground">GIS-Based Environmental Impact Analysis</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                About
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 auth-gradient opacity-90" />
        <div className="absolute inset-0 bg-auth-pattern" />
        
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-6">
              <Shield className="h-4 w-4" />
              <span className="text-sm">Environmental Impact Analysis Platform</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6 leading-tight">
              Analyze Environmental Impact with Precision
            </h1>
            
            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              EcoImpact is a production-grade GIS platform for environmental impact analysis. 
              Upload data, analyze tree coverage, assess development impact, and generate professional reports.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
                <Link to="/register">
                  Start Planning
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                <Link to="/login">
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path 
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
              className="fill-background"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Powerful Tools for Environmental Analysis
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to analyze environmental impact, from data upload to final reports.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="glass-card hover:shadow-lg transition-all duration-300 group">
                <CardContent className="pt-6">
                  <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
                Built for Environmental Professionals
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                EcoImpact combines powerful GIS capabilities with an intuitive interface designed 
                specifically for environmental impact analysis. Whether you're an environmental planner, 
                conservation specialist, or researcher, our platform provides the tools you need.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Open Standards</h4>
                    <p className="text-sm text-muted-foreground">
                      Supports industry-standard GIS formats and integrates with your existing workflow
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Secure & Reliable</h4>
                    <p className="text-sm text-muted-foreground">
                      Role-based access control and secure data handling for sensitive conservation data
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-video rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <div className="text-center p-8">
                  <Map className="h-16 w-16 mx-auto mb-4 text-primary/60" />
                  <p className="text-muted-foreground">Interactive Map Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="glass-card overflow-hidden">
            <div className="relative p-8 md:p-12">
              <div className="absolute inset-0 auth-gradient opacity-5" />
              <div className="relative text-center">
                <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                  Ready to Start Planning?
                </h2>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                  Create your account and begin designing wildlife corridors today. 
                  No credit card required to get started.
                </p>
                <Button size="lg" asChild>
                  <Link to="/register">
                    Create Free Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <TreePine className="h-5 w-5 text-primary" />
              <span className="font-heading font-bold text-primary">EcoImpact</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} EcoImpact. Built for environmental impact analysis.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
