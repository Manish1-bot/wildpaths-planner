import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Camera, 
  AlertTriangle, 
  Trees, 
  Eye,
  Building,
  Route,
  Loader2 
} from 'lucide-react';
import { 
  CreateObservationInput, 
  ObservationType, 
  RiskLevel 
} from '@/hooks/useFieldObservations';

const observationSchema = z.object({
  observation_type: z.enum(['wildlife_sighting', 'habitat_area', 'risk_zone', 'infrastructure', 'corridor_suggestion', 'tree_observation']),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  habitat_type: z.string().optional(),
  species_observed: z.string().optional(),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  infrastructure_type: z.string().optional(),
});

type FormData = z.infer<typeof observationSchema>;

interface FieldObservationFormProps {
  projectId: string;
  onSubmit: (data: CreateObservationInput) => Promise<void>;
  isSubmitting?: boolean;
  defaultCoordinates?: { lat: number; lng: number };
  onCancel?: () => void;
}

const observationTypes: { value: ObservationType; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'wildlife_sighting', label: 'Wildlife Sighting', icon: <Eye className="h-4 w-4" />, description: 'Record animal observation' },
  { value: 'habitat_area', label: 'Habitat Area', icon: <Trees className="h-4 w-4" />, description: 'Mark habitat boundary' },
  { value: 'risk_zone', label: 'Risk Zone', icon: <AlertTriangle className="h-4 w-4" />, description: 'Identify danger area' },
  { value: 'infrastructure', label: 'Infrastructure', icon: <Building className="h-4 w-4" />, description: 'Note roads, buildings' },
  { value: 'corridor_suggestion', label: 'Corridor Suggestion', icon: <Route className="h-4 w-4" />, description: 'Propose wildlife path' },
  { value: 'tree_observation', label: 'Tree Observation', icon: <Trees className="h-4 w-4" />, description: 'Document tree data' },
];

const habitatTypes = [
  'Dense Forest',
  'Open Forest',
  'Grassland',
  'Wetland',
  'Riverine',
  'Agricultural',
  'Urban Edge',
  'Rocky Outcrop',
  'Scrubland',
  'Other',
];

const infrastructureTypes = [
  'Highway',
  'Road',
  'Railway',
  'Power Line',
  'Fence',
  'Building',
  'Dam',
  'Bridge',
  'Tunnel',
  'Other',
];

export function FieldObservationForm({
  projectId,
  onSubmit,
  isSubmitting = false,
  defaultCoordinates,
  onCancel,
}: FieldObservationFormProps) {
  const [selectedType, setSelectedType] = useState<ObservationType>('wildlife_sighting');

  const form = useForm<FormData>({
    resolver: zodResolver(observationSchema),
    defaultValues: {
      observation_type: 'wildlife_sighting',
      latitude: defaultCoordinates?.lat || 0,
      longitude: defaultCoordinates?.lng || 0,
      title: '',
      description: '',
      habitat_type: '',
      species_observed: '',
      risk_level: undefined,
      infrastructure_type: '',
    },
  });

  const handleSubmit = async (data: FormData) => {
    const species = data.species_observed?.split(',').map(s => s.trim()).filter(Boolean);
    
    await onSubmit({
      project_id: projectId,
      observation_type: data.observation_type,
      latitude: data.latitude,
      longitude: data.longitude,
      title: data.title,
      description: data.description,
      habitat_type: data.habitat_type,
      species_observed: species?.length ? species : undefined,
      risk_level: data.risk_level as RiskLevel | undefined,
      infrastructure_type: data.infrastructure_type,
    });
    
    form.reset();
  };

  const watchType = form.watch('observation_type');

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Field Observation Form
        </CardTitle>
        <CardDescription>
          Record field observations for corridor planning and environmental analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Observation Type Selection */}
            <FormField
              control={form.control}
              name="observation_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observation Type</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {observationTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => {
                          field.onChange(type.value);
                          setSelectedType(type.value);
                        }}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          field.value === type.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {type.icon}
                          <span className="text-sm font-medium">{type.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="e.g., 20.5937" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="e.g., 78.9629" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of observation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detailed Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add detailed observations, behavior notes, or other relevant information..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type-specific fields */}
            {(watchType === 'wildlife_sighting' || watchType === 'corridor_suggestion') && (
              <FormField
                control={form.control}
                name="species_observed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Species Observed</FormLabel>
                    <FormControl>
                      <Input placeholder="Tiger, Elephant, Deer (comma-separated)" {...field} />
                    </FormControl>
                    <FormDescription>Enter species names separated by commas</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {(watchType === 'habitat_area' || watchType === 'tree_observation') && (
              <FormField
                control={form.control}
                name="habitat_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Habitat Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select habitat type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {habitatTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {watchType === 'risk_zone' && (
              <FormField
                control={form.control}
                name="risk_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Risk Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select risk level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-500/10 text-green-600">Low</Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="medium">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">Medium</Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-orange-500/10 text-orange-600">High</Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="critical">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-red-500/10 text-red-600">Critical</Badge>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {watchType === 'infrastructure' && (
              <FormField
                control={form.control}
                name="infrastructure_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Infrastructure Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select infrastructure type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {infrastructureTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Save Observation
                  </>
                )}
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
