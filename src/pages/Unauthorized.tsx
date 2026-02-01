import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX, ArrowLeft, TreePine } from 'lucide-react';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="glass-card max-w-md w-full animate-fade-in">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TreePine className="h-8 w-8 text-primary" />
            <span className="text-2xl font-heading font-bold text-primary">TerraByte</span>
          </div>
          <div className="mx-auto p-4 bg-destructive/10 rounded-full w-fit mb-4">
            <ShieldX className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-heading">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this resource. 
            Please contact your administrator if you believe this is an error.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button asChild className="w-full">
            <Link to="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Dashboard
            </Link>
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Error Code: 403 - Forbidden
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
