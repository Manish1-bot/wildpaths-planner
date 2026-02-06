import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Trees, 
  Star, 
  Camera, 
  Upload, 
  MapPin, 
  Plus, 
  Check, 
  ChevronDown,
  Ruler,
  Calendar,
  Heart
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Common Indian tree species with photos
const COMMON_SPECIES = [
  { id: 'mango', name: 'Mango', scientific: 'Mangifera indica', emoji: '🥭' },
  { id: 'neem', name: 'Neem', scientific: 'Azadirachta indica', emoji: '🌿' },
  { id: 'banyan', name: 'Banyan', scientific: 'Ficus benghalensis', emoji: '🌳' },
  { id: 'peepal', name: 'Peepal', scientific: 'Ficus religiosa', emoji: '🍃' },
  { id: 'coconut', name: 'Coconut', scientific: 'Cocos nucifera', emoji: '🌴' },
  { id: 'teak', name: 'Teak', scientific: 'Tectona grandis', emoji: '🪵' },
  { id: 'gulmohar', name: 'Gulmohar', scientific: 'Delonix regia', emoji: '🌺' },
  { id: 'ashoka', name: 'Ashoka', scientific: 'Saraca asoca', emoji: '🌲' },
  { id: 'jamun', name: 'Jamun', scientific: 'Syzygium cumini', emoji: '🫐' },
  { id: 'tamarind', name: 'Tamarind', scientific: 'Tamarindus indica', emoji: '🌰' },
  { id: 'jackfruit', name: 'Jackfruit', scientific: 'Artocarpus heterophyllus', emoji: '🍈' },
  { id: 'unknown', name: 'Unknown', scientific: 'Species unknown', emoji: '❓' },
];

const AGE_CATEGORIES = [
  { value: '1-5', label: '1-5 years (Sapling)', color: 'bg-green-100' },
  { value: '5-20', label: '5-20 years (Young)', color: 'bg-green-200' },
  { value: '20-50', label: '20-50 years (Mature)', color: 'bg-green-300' },
  { value: '50-100', label: '50-100 years (Old)', color: 'bg-green-400' },
  { value: '100+', label: '100+ years (Heritage)', color: 'bg-green-500' },
];

interface TreeQuickFormProps {
  location: [number, number];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  onSaveAndContinue: (data: any) => void;
  treeNumber: number;
}

export function TreeQuickForm({
  location,
  onSubmit,
  onCancel,
  onSaveAndContinue,
  treeNumber,
}: TreeQuickFormProps) {
  const [species, setSpecies] = useState<string>('');
  const [healthRating, setHealthRating] = useState(5);
  const [height, setHeight] = useState(10);
  const [canopy, setCanopy] = useState(5);
  const [trunk, setTrunk] = useState(30);
  const [ageCategory, setAgeCategory] = useState('20-50');
  const [notes, setNotes] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (continueAdding: boolean) => {
    const data = {
      latitude: location[1],
      longitude: location[0],
      species: COMMON_SPECIES.find(s => s.id === species)?.name || species,
      species_scientific: COMMON_SPECIES.find(s => s.id === species)?.scientific,
      health_status: healthRating >= 4 ? 'excellent' : healthRating >= 3 ? 'good' : healthRating >= 2 ? 'fair' : 'poor',
      health_rating: healthRating,
      height_meters: height,
      canopy_diameter_meters: canopy,
      trunk_diameter_cm: trunk,
      age_years: parseInt(ageCategory.split('-')[0]) || 20,
      notes,
      tree_id: `T-${treeNumber.toString().padStart(4, '0')}`,
    };

    if (continueAdding) {
      onSaveAndContinue(data);
    } else {
      onSubmit(data);
    }
  };

  return (
    <Card className="glass-card w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Trees className="h-5 w-5 text-primary" />
            Tree #{treeNumber}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            <MapPin className="h-3 w-3 mr-1" />
            {location[1].toFixed(5)}, {location[0].toFixed(5)}
          </Badge>
        </div>
        <CardDescription>
          Add tree details (all fields optional except species)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Species Selection Grid */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Species</Label>
          <div className="grid grid-cols-4 gap-2">
            {COMMON_SPECIES.slice(0, 8).map((sp) => (
              <button
                key={sp.id}
                type="button"
                onClick={() => setSpecies(sp.id)}
                className={`p-2 rounded-lg text-center transition-all ${
                  species === sp.id 
                    ? 'bg-primary/20 ring-2 ring-primary' 
                    : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                <span className="text-xl">{sp.emoji}</span>
                <p className="text-[10px] mt-1 truncate">{sp.name}</p>
              </button>
            ))}
          </div>
          <Input
            placeholder="Or type species name..."
            value={!COMMON_SPECIES.find(s => s.id === species) ? species : ''}
            onChange={(e) => setSpecies(e.target.value)}
            className="mt-2"
          />
        </div>

        <Separator />

        {/* Health Rating - Star System */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Health Rating
          </Label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setHealthRating(star)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star 
                  className={`h-8 w-8 ${
                    star <= healthRating 
                      ? 'text-yellow-400 fill-yellow-400' 
                      : 'text-gray-300'
                  }`} 
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-muted-foreground">
              {healthRating === 5 ? 'Excellent' : 
               healthRating === 4 ? 'Good' : 
               healthRating === 3 ? 'Fair' : 
               healthRating === 2 ? 'Poor' : 'Very Poor'}
            </span>
          </div>
        </div>

        <Separator />

        {/* Quick Measurements */}
        <div className="space-y-4">
          {/* Height */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                Height
              </Label>
              <Badge variant="outline">{height}m</Badge>
            </div>
            <Slider
              value={[height]}
              min={0.5}
              max={50}
              step={0.5}
              onValueChange={([v]) => setHeight(v)}
            />
          </div>

          {/* Canopy */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Canopy Diameter</Label>
              <Badge variant="outline">{canopy}m</Badge>
            </div>
            <Slider
              value={[canopy]}
              min={1}
              max={30}
              step={0.5}
              onValueChange={([v]) => setCanopy(v)}
            />
          </div>

          {/* Trunk (DBH) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Trunk Diameter (DBH)</Label>
              <Badge variant="outline">{trunk}cm</Badge>
            </div>
            <Slider
              value={[trunk]}
              min={10}
              max={300}
              step={5}
              onValueChange={([v]) => setTrunk(v)}
            />
          </div>
        </div>

        {/* Age Category */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Age Category
          </Label>
          <Select value={ageCategory} onValueChange={setAgeCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AGE_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Options */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              Advanced Options
              <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-2">
            {/* Photo Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Photo
              </Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Notes</Label>
              <Input
                placeholder="Any additional observations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => handleSubmit(true)}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-1" />
            Save & Add
          </Button>
          <Button 
            onClick={() => handleSubmit(false)}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-1" />
            Save & Done
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
