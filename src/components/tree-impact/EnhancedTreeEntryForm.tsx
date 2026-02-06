import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { 
  Trees, 
  MapPin, 
  Ruler, 
  Camera, 
  Save, 
  Plus,
  Leaf,
  Activity,
  TreePine,
  X,
  Loader2,
  Locate
} from 'lucide-react';
import { useSpeciesDatabase } from '@/hooks/useSpeciesDatabase';
import { CreateTreeInput, HealthStatus, ImpactStatus } from '@/hooks/useTreeObservations';

const treeFormSchema = z.object({
  tree_id: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  species: z.string().optional(),
  species_scientific: z.string().optional(),
  height_meters: z.number().min(0).max(200).optional(),
  trunk_diameter_cm: z.number().min(0).max(2000).optional(),
  canopy_diameter_meters: z.number().min(0).max(100).optional(),
  canopy_ns_m: z.number().min(0).max(100).optional(),
  canopy_ew_m: z.number().min(0).max(100).optional(),
  age_years: z.number().min(0).max(5000).optional(),
  health_status: z.enum(['excellent', 'good', 'fair', 'poor', 'dead']).optional(),
  crown_density_percent: z.number().min(0).max(100).optional(),
  impact_status: z.enum(['safe', 'at_risk', 'affected', 'removed', 'transplanted']).optional(),
  impact_reason: z.string().optional(),
  notes: z.string().optional(),
  carbon_stored_kg: z.number().min(0).optional(),
  biodiversity_score: z.number().min(1).max(10).optional(),
  species_vulnerability_index: z.number().min(1).max(10).optional(),
});

type TreeFormData = z.infer<typeof treeFormSchema>;

interface EnhancedTreeEntryFormProps {
  projectId: string;
  onSubmit: (data: CreateTreeInput) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  defaultCoordinates?: { lat: number; lng: number };
  treeNumber?: number;
}

const HEALTH_OPTIONS = [
  { value: 'excellent', label: 'Excellent', color: 'bg-green-500', description: 'Vigorous growth, no issues' },
  { value: 'good', label: 'Good', color: 'bg-lime-500', description: 'Healthy with minor issues' },
  { value: 'fair', label: 'Fair', color: 'bg-yellow-500', description: 'Some decline visible' },
  { value: 'poor', label: 'Poor', color: 'bg-orange-500', description: 'Significant decline' },
  { value: 'dead', label: 'Dead', color: 'bg-gray-500', description: 'No living tissue' },
];

const AGE_CATEGORIES = [
  { min: 0, max: 10, label: 'Young (1-10 years)' },
  { min: 11, max: 50, label: 'Mature (11-50 years)' },
  { min: 51, max: 150, label: 'Old (51-150 years)' },
  { min: 151, max: 1000, label: 'Ancient (150+ years)' },
];

export function EnhancedTreeEntryForm({
  projectId,
  onSubmit,
  onCancel,
  isSubmitting,
  defaultCoordinates,
  treeNumber = 1,
}: EnhancedTreeEntryFormProps) {
  const { species: speciesList, getVulnerabilityIndex, getCarbonValue } = useSpeciesDatabase();
  const [activeTab, setActiveTab] = useState('location');
  const [photos, setPhotos] = useState<string[]>([]);

  const form = useForm<TreeFormData>({
    resolver: zodResolver(treeFormSchema),
    defaultValues: {
      latitude: defaultCoordinates?.lat || 0,
      longitude: defaultCoordinates?.lng || 0,
      tree_id: `T-${String(treeNumber).padStart(3, '0')}`,
      health_status: 'good',
      crown_density_percent: 60,
      biodiversity_score: 5,
      species_vulnerability_index: 5,
    },
  });

  const watchSpecies = form.watch('species');
  const watchAge = form.watch('age_years');
  const watchHeight = form.watch('height_meters');

  // Auto-calculate values based on species
  const handleSpeciesChange = (value: string) => {
    form.setValue('species', value);
    const speciesData = speciesList.find(s => s.common_name === value);
    if (speciesData) {
      form.setValue('species_scientific', speciesData.scientific_name);
      if (speciesData.vulnerability_index) {
        form.setValue('species_vulnerability_index', speciesData.vulnerability_index);
      }
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue('latitude', position.coords.latitude);
          form.setValue('longitude', position.coords.longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  const handleFormSubmit = async (data: TreeFormData) => {
    const carbon = getCarbonValue(data.species || '', data.age_years || 20);
    
    await onSubmit({
      project_id: projectId,
      latitude: data.latitude,
      longitude: data.longitude,
      tree_id: data.tree_id,
      species: data.species,
      height_meters: data.height_meters,
      age_years: data.age_years,
      health_status: data.health_status as HealthStatus,
      canopy_diameter_meters: data.canopy_diameter_meters || ((data.canopy_ns_m || 0) + (data.canopy_ew_m || 0)) / 2,
      trunk_diameter_cm: data.trunk_diameter_cm,
      notes: data.notes,
      impact_status: data.impact_status as ImpactStatus,
      impact_reason: data.impact_reason,
      photo_urls: photos,
      metadata: {
        species_scientific: data.species_scientific,
        canopy_ns_m: data.canopy_ns_m,
        canopy_ew_m: data.canopy_ew_m,
        crown_density_percent: data.crown_density_percent,
        carbon_stored_kg: carbon,
        biodiversity_score: data.biodiversity_score,
        species_vulnerability_index: data.species_vulnerability_index,
      },
    });
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Trees className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="font-heading">Add Tree - {form.watch('tree_id')}</CardTitle>
              <CardDescription>Scientific field data collection</CardDescription>
            </div>
          </div>
          {onCancel && (
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="location" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="hidden sm:inline">Location</span>
                </TabsTrigger>
                <TabsTrigger value="species" className="flex items-center gap-1">
                  <Leaf className="h-3 w-3" />
                  <span className="hidden sm:inline">Species</span>
                </TabsTrigger>
                <TabsTrigger value="measurements" className="flex items-center gap-1">
                  <Ruler className="h-3 w-3" />
                  <span className="hidden sm:inline">Size</span>
                </TabsTrigger>
                <TabsTrigger value="health" className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  <span className="hidden sm:inline">Health</span>
                </TabsTrigger>
              </TabsList>

              {/* Location Tab */}
              <TabsContent value="location" className="space-y-4 pt-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium">GPS Coordinates</span>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={getCurrentLocation}>
                      <Locate className="h-4 w-4 mr-1" />
                      Current Location
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.000001" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
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
                            <Input 
                              type="number" 
                              step="0.000001" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    Accuracy: GPS (±3m typical)
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="tree_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tree ID / Tag Number</FormLabel>
                      <FormControl>
                        <Input placeholder="T-001" {...field} />
                      </FormControl>
                      <FormDescription>Unique identifier for this tree</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Species Tab */}
              <TabsContent value="species" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="species"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Species (Common Name)</FormLabel>
                      <Select onValueChange={handleSpeciesChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select species" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {speciesList.map((sp) => (
                            <SelectItem key={sp.id} value={sp.common_name || sp.scientific_name}>
                              <div className="flex items-center gap-2">
                                <TreePine className="h-4 w-4" />
                                {sp.common_name || sp.scientific_name}
                              </div>
                            </SelectItem>
                          ))}
                          <SelectItem value="unknown">Unknown / Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="species_scientific"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scientific Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Ficus benghalensis" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="age_years"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Age</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {AGE_CATEGORIES.map((cat) => (
                          <Button
                            key={cat.label}
                            type="button"
                            variant={(field.value || 0) >= cat.min && (field.value || 0) <= cat.max ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => field.onChange(Math.round((cat.min + cat.max) / 2))}
                          >
                            {cat.label}
                          </Button>
                        ))}
                      </div>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter exact age if known"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                          className="mt-2"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="species_vulnerability_index"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Species Vulnerability Index</FormLabel>
                        <Badge variant="outline">{field.value}/10</Badge>
                      </div>
                      <FormControl>
                        <Slider
                          value={[field.value || 5]}
                          min={1}
                          max={10}
                          step={1}
                          onValueChange={([v]) => field.onChange(v)}
                        />
                      </FormControl>
                      <FormDescription>
                        1 = Common/Resilient, 10 = Rare/Sensitive
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Measurements Tab */}
              <TabsContent value="measurements" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="height_meters"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Height (m)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type="number" 
                              step="0.1"
                              placeholder="12.5"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            />
                            <Ruler className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="trunk_diameter_cm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DBH (cm)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="45"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormDescription>Diameter at Breast Height</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <Label className="font-medium mb-3 block">Canopy Spread</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="canopy_ns_m"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">N-S Spread (m)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1"
                              placeholder="8"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="canopy_ew_m"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">E-W Spread (m)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1"
                              placeholder="10"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="biodiversity_score"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Biodiversity Score</FormLabel>
                        <Badge variant="outline">{field.value}/10</Badge>
                      </div>
                      <FormControl>
                        <Slider
                          value={[field.value || 5]}
                          min={1}
                          max={10}
                          step={1}
                          onValueChange={([v]) => field.onChange(v)}
                        />
                      </FormControl>
                      <FormDescription>
                        Nesting, food source, shelter value
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Health Tab */}
              <TabsContent value="health" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="health_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overall Health</FormLabel>
                      <div className="grid grid-cols-5 gap-2">
                        {HEALTH_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => field.onChange(option.value)}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              field.value === option.value 
                                ? 'border-primary ring-2 ring-primary/20' 
                                : 'border-transparent bg-muted/50 hover:bg-muted'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${option.color}`} />
                            <p className="text-xs font-medium">{option.label}</p>
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="crown_density_percent"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Crown Density</FormLabel>
                        <Badge variant="outline">{field.value}%</Badge>
                      </div>
                      <FormControl>
                        <Slider
                          value={[field.value || 60]}
                          min={0}
                          max={100}
                          step={5}
                          onValueChange={([v]) => field.onChange(v)}
                        />
                      </FormControl>
                      <FormDescription>
                        Percentage of crown with foliage
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observations / Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Pest damage, structural issues, unique features..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Photo Upload Placeholder */}
                <div className="p-4 rounded-lg border-2 border-dashed border-muted-foreground/20">
                  <div className="text-center">
                    <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Add Photos</p>
                    <p className="text-xs text-muted-foreground">Front, Side, Top, Close-up</p>
                    <Button type="button" variant="outline" size="sm" className="mt-2">
                      <Camera className="h-4 w-4 mr-1" />
                      Take Photo
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Form Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Tree
              </Button>
              <Button type="button" variant="secondary" className="flex-1" disabled={isSubmitting}>
                <Plus className="h-4 w-4 mr-2" />
                Save & Add Another
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
