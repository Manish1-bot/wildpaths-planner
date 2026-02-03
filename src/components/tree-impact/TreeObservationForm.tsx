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
import { Trees, Loader2, MapPin, Heart, Ruler, Calendar } from 'lucide-react';
import { CreateTreeInput, HealthStatus, ImpactStatus } from '@/hooks/useTreeObservations';

const treeSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  tree_id: z.string().optional(),
  species: z.string().optional(),
  height_meters: z.coerce.number().min(0).optional().or(z.literal('')),
  age_years: z.coerce.number().int().min(0).optional().or(z.literal('')),
  health_status: z.enum(['excellent', 'good', 'fair', 'poor', 'dead']).optional(),
  canopy_diameter_meters: z.coerce.number().min(0).optional().or(z.literal('')),
  trunk_diameter_cm: z.coerce.number().min(0).optional().or(z.literal('')),
  impact_status: z.enum(['safe', 'at_risk', 'affected', 'removed', 'transplanted']).optional(),
  impact_reason: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof treeSchema>;

interface TreeObservationFormProps {
  projectId: string;
  onSubmit: (data: CreateTreeInput) => Promise<void>;
  isSubmitting?: boolean;
  defaultCoordinates?: { lat: number; lng: number };
  onCancel?: () => void;
}

const commonSpecies = [
  'Teak (Tectona grandis)',
  'Sal (Shorea robusta)',
  'Neem (Azadirachta indica)',
  'Banyan (Ficus benghalensis)',
  'Peepal (Ficus religiosa)',
  'Mango (Mangifera indica)',
  'Acacia',
  'Eucalyptus',
  'Pine',
  'Oak',
  'Bamboo',
  'Unknown',
];

export function TreeObservationForm({
  projectId,
  onSubmit,
  isSubmitting = false,
  defaultCoordinates,
  onCancel,
}: TreeObservationFormProps) {
  const [customSpecies, setCustomSpecies] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(treeSchema),
    defaultValues: {
      latitude: defaultCoordinates?.lat || 0,
      longitude: defaultCoordinates?.lng || 0,
      tree_id: '',
      species: '',
      height_meters: '',
      age_years: '',
      health_status: undefined,
      canopy_diameter_meters: '',
      trunk_diameter_cm: '',
      impact_status: undefined,
      impact_reason: '',
      notes: '',
    },
  });

  const handleSubmit = async (data: FormData) => {
    await onSubmit({
      project_id: projectId,
      latitude: data.latitude,
      longitude: data.longitude,
      tree_id: data.tree_id || undefined,
      species: data.species || undefined,
      height_meters: data.height_meters ? Number(data.height_meters) : undefined,
      age_years: data.age_years ? Number(data.age_years) : undefined,
      health_status: data.health_status as HealthStatus | undefined,
      canopy_diameter_meters: data.canopy_diameter_meters ? Number(data.canopy_diameter_meters) : undefined,
      trunk_diameter_cm: data.trunk_diameter_cm ? Number(data.trunk_diameter_cm) : undefined,
      impact_status: data.impact_status as ImpactStatus | undefined,
      impact_reason: data.impact_reason || undefined,
      notes: data.notes || undefined,
    });
    
    form.reset();
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <Trees className="h-5 w-5 text-green-600" />
          Tree Observation Form
        </CardTitle>
        <CardDescription>
          Record individual tree data for environmental impact analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Latitude
                    </FormLabel>
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

            {/* Tree ID & Species */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tree_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tree ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., TREE-001" {...field} />
                    </FormControl>
                    <FormDescription>Unique identifier for tracking</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="species"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Species</FormLabel>
                    {customSpecies ? (
                      <FormControl>
                        <Input placeholder="Enter species name" {...field} />
                      </FormControl>
                    ) : (
                      <Select onValueChange={(val) => {
                        if (val === '__custom__') {
                          setCustomSpecies(true);
                          field.onChange('');
                        } else {
                          field.onChange(val);
                        }
                      }} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select species" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {commonSpecies.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                          <SelectItem value="__custom__">+ Enter custom species</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Measurements */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="height_meters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Ruler className="h-3 w-3" /> Height (m)
                    </FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 15" {...field} />
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
                    <FormLabel className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Age (years)
                    </FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="canopy_diameter_meters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canopy (m)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 8" {...field} />
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
                    <FormLabel>Trunk (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 60" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Health & Impact */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="health_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Heart className="h-3 w-3" /> Health Status
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select health" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="excellent">🟢 Excellent</SelectItem>
                        <SelectItem value="good">🟢 Good</SelectItem>
                        <SelectItem value="fair">🟡 Fair</SelectItem>
                        <SelectItem value="poor">🟠 Poor</SelectItem>
                        <SelectItem value="dead">⚫ Dead</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="impact_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Impact Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select impact" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="safe">🟢 Safe</SelectItem>
                        <SelectItem value="at_risk">🟡 At Risk</SelectItem>
                        <SelectItem value="affected">🔴 Affected</SelectItem>
                        <SelectItem value="removed">⚫ Removed</SelectItem>
                        <SelectItem value="transplanted">🔵 Transplanted</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Impact Reason */}
            <FormField
              control={form.control}
              name="impact_reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Impact Reason (if applicable)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Within 50m of proposed highway" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional observations about the tree..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    <Trees className="h-4 w-4 mr-2" />
                    Save Tree
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
