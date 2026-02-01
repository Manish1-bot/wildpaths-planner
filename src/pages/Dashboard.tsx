import { AppHeader } from '@/components/layout/AppHeader';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TreePine, 
  FolderPlus, 
  Upload, 
  Map, 
  FileText, 
  Clock,
  Users,
  Database
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { profile } = useAuth();
  const { projects, isLoading } = useProjects();
  const navigate = useNavigate();

  const quickActions = [
    { 
      title: 'New Project', 
      description: 'Create a new corridor planning project',
      icon: FolderPlus,
      href: '/projects/new',
      color: 'bg-primary/10 text-primary',
      isDialog: true
    },
    { 
      title: 'Upload Data', 
      description: 'Upload GIS files for analysis',
      icon: Upload,
      href: '/upload',
      color: 'bg-accent/10 text-accent'
    },
    { 
      title: 'Open Map', 
      description: 'Explore the interactive map viewer',
      icon: Map,
      href: '/map',
      color: 'bg-secondary/10 text-secondary'
    },
    { 
      title: 'Reports', 
      description: 'Generate and view reports',
      icon: FileText,
      href: '/reports',
      color: 'bg-zone-monitoring/10 text-zone-monitoring'
    },
  ];

  const stats = [
    { label: 'Active Projects', value: isLoading ? '-' : String(projects.filter(p => p.status === 'active').length), icon: FolderPlus },
    { label: 'Total Projects', value: isLoading ? '-' : String(projects.length), icon: Database },
    { label: 'Corridors Designed', value: '0', icon: Map },
    { label: 'Reports Generated', value: '0', icon: FileText },
  ];

  const handleProjectCreated = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-heading font-bold mb-2">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Conservationist'}!
          </h2>
          <p className="text-muted-foreground">
            Here's an overview of your conservation planning activities.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-heading">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-heading font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              action.isDialog ? (
                <CreateProjectDialog
                  key={action.title}
                  onSuccess={handleProjectCreated}
                  trigger={
                    <Card className="glass-card hover:shadow-lg transition-all duration-300 cursor-pointer group">
                      <CardContent className="pt-6">
                        <div className={`p-3 rounded-lg w-fit mb-4 ${action.color} group-hover:scale-110 transition-transform`}>
                          <action.icon className="h-6 w-6" />
                        </div>
                        <h4 className="font-heading font-semibold mb-1">{action.title}</h4>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </CardContent>
                    </Card>
                  }
                />
              ) : (
                <Link key={action.title} to={action.href}>
                  <Card className="glass-card hover:shadow-lg transition-all duration-300 cursor-pointer group">
                    <CardContent className="pt-6">
                      <div className={`p-3 rounded-lg w-fit mb-4 ${action.color} group-hover:scale-110 transition-transform`}>
                        <action.icon className="h-6 w-6" />
                      </div>
                      <h4 className="font-heading font-semibold mb-1">{action.title}</h4>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              )
            ))}
          </div>
        </div>

        {/* Recent Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading">
                <Clock className="h-5 w-5" />
                Recent Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground text-center py-4">Loading...</p>
              ) : projects.length === 0 ? (
                <div className="text-center py-6">
                  <FolderPlus className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No projects yet</p>
                  <CreateProjectDialog onSuccess={handleProjectCreated} />
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.slice(0, 3).map((project) => (
                    <Link
                      key={project.id}
                      to={`/project/${project.id}`}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="p-2 bg-primary/10 rounded">
                        <FolderPlus className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{project.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {project.region || 'No region'} • {project.status}
                        </p>
                      </div>
                    </Link>
                  ))}
                  {projects.length > 3 && (
                    <Link
                      to="/projects"
                      className="block text-center text-sm text-primary hover:underline py-2"
                    >
                      View all {projects.length} projects →
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Getting Started */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading">
                <TreePine className="h-5 w-5" />
                Getting Started
              </CardTitle>
              <CardDescription>
                Follow these steps to analyze your first corridor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-medium">Create a Project</p>
                    <p className="text-xs text-muted-foreground">
                      Set up a project with your region and target species
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/80 flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-medium">Upload Your Data</p>
                    <p className="text-xs text-muted-foreground">
                      Add GeoJSON or CSV files with habitat or sighting data
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/60 flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-medium">Run Analysis</p>
                    <p className="text-xs text-muted-foreground">
                      Get fragmentation, connectivity, and risk assessments
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/40 flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                    4
                  </div>
                  <div>
                    <p className="text-sm font-medium">Design & Report</p>
                    <p className="text-xs text-muted-foreground">
                      Draw corridors on the map and generate PDF reports
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
