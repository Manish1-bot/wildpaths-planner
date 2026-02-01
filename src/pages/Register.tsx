import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TreePine, Users, ClipboardList, FlaskConical, Shield } from 'lucide-react';

const roleDescriptions: Record<UserRole, { label: string; description: string; icon: React.ReactNode }> = {
  planner: {
    label: 'Planner',
    description: 'Full access to all tools for corridor planning',
    icon: <ClipboardList className="h-4 w-4" />,
  },
  ngo: {
    label: 'NGO',
    description: 'View and basic editing for conservation organizations',
    icon: <Users className="h-4 w-4" />,
  },
  researcher: {
    label: 'Researcher',
    description: 'View and analysis tools for academic research',
    icon: <FlaskConical className="h-4 w-4" />,
  },
  admin: {
    label: 'Admin',
    description: 'System management and user administration',
    icon: <Shield className="h-4 w-4" />,
  },
};

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState<UserRole>('researcher');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please ensure both passwords are identical.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password, fullName, organization, role);

    if (error) {
      toast({
        title: 'Registration failed',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
    } else {
      toast({
        title: 'Registration successful!',
        description: 'Please check your email to verify your account.',
      });
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex auth-gradient bg-auth-pattern">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 text-white">
        <div className="max-w-md space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <TreePine className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-4xl font-heading font-bold">TerraByte</h1>
              <p className="text-white/80">Wildlife Corridor Planning</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl font-heading">Join the Conservation Community</h2>
            <p className="text-white/80">
              Create an account to start planning wildlife corridors, analyzing habitat 
              connectivity, and generating professional reports for your conservation projects.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {Object.entries(roleDescriptions).map(([key, { label, icon }]) => (
              <div key={key} className="flex items-center gap-2 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                {icon}
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <Card className="glass-card w-full max-w-md animate-fade-in my-8">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4 lg:hidden">
              <TreePine className="h-8 w-8 text-primary" />
              <span className="text-2xl font-heading font-bold text-primary">TerraByte</span>
            </div>
            <CardTitle className="text-2xl font-heading">Create Account</CardTitle>
            <CardDescription>
              Join our platform for wildlife conservation planning
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Dr. Jane Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@organization.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  type="text"
                  placeholder="Wildlife Conservation Society"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleDescriptions).map(([key, { label, description, icon }]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {icon}
                          <div>
                            <div className="font-medium">{label}</div>
                            <div className="text-xs text-muted-foreground">{description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
              
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
