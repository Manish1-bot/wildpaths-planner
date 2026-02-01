import { AppHeader } from '@/components/layout/AppHeader';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { useProjects, Project } from '@/hooks/useProjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FolderPlus, 
  MapPin, 
  Calendar, 
  MoreVertical,
  Trash2,
  Edit2,
  ExternalLink,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function Projects() {
  const { projects, isLoading, deleteProject } = useProjects();
  const navigate = useNavigate();

  const handleProjectCreated = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold mb-2">Projects</h1>
            <p className="text-muted-foreground">
              Manage your wildlife corridor planning projects
            </p>
          </div>
          <CreateProjectDialog onSuccess={handleProjectCreated} />
        </div>

        {projects.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="pt-12 pb-12 text-center">
              <FolderPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-heading font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first project to start planning wildlife corridors and analyzing habitat data.
              </p>
              <CreateProjectDialog 
                trigger={
                  <Button>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Create Your First Project
                  </Button>
                }
                onSuccess={handleProjectCreated}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project}
                onDelete={() => deleteProject.mutate(project.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ProjectCard({ project, onDelete }: { project: Project; onDelete: () => void }) {
  return (
    <Card className="glass-card hover:shadow-lg transition-all group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link to={`/project/${project.id}`}>
              <CardTitle className="font-heading text-lg hover:text-primary transition-colors cursor-pointer">
                {project.name}
              </CardTitle>
            </Link>
            <CardDescription className="mt-1 line-clamp-2">
              {project.description || 'No description'}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/project/${project.id}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Project
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/project/${project.id}/edit`}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {project.region && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{project.region}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Updated {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}</span>
          </div>

          {project.species && project.species.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.species.slice(0, 3).map((species) => (
                <Badge key={species} variant="secondary" className="text-xs">
                  {species}
                </Badge>
              ))}
              {project.species.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{project.species.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="pt-3">
            <Badge 
              variant={project.status === 'active' ? 'default' : 'secondary'}
              className="capitalize"
            >
              {project.status}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
