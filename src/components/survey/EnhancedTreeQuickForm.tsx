import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TreeDeciduous, 
  Camera, 
  Upload,
  Star,
  Ruler,
  MapPin,
  Save,
  X,
  Search,
  ChevronRight
} from 'lucide-react';

// Common tree species with photos (using emoji as placeholders)
const COMMON_SPECIES = [
  { name: 'Mango', emoji: '🥭', scientific: 'Mangifera indica' },
  { name: 'Neem', emoji: '🌿', scientific: 'Azadirachta indica' },
  { name: 'Banyan', emoji: '🌳', scientific: 'Ficus benghalensis' },
  { name: 'Peepal', emoji: '🍃', scientific: 'Ficus religiosa' },
  { name: 'Teak', emoji: '🌲', scientific: 'Tectona grandis' },
  { name: 'Coconut', emoji: '🥥', scientific: 'Cocos nucifera' },
  { name: 'Jamun', emoji: '🫐', scientific: 'Syzygium cumini' },
  { name: 'Tamarind', emoji: '🌰', scientific: 'Tamarindus indica' },
  { name: 'Gulmohar', emoji: '🌺', scientific: 'Delonix regia' },
  { name: 'Ashoka', emoji: '🌴', scientific: 'Saraca asoca' },
  { name: 'Sandalwood', emoji: '🪵', scientific: 'Santalum album' },
  { name: 'Indian Rosewood', emoji: '🪻', scientific: 'Dalbergia sissoo' },
  { name: 'Unknown', emoji: '❓', scientific: 'Unknown species' },
];

const HEALTH_RATINGS = [
  { stars: 5, label: 'Excellent', description: 'Full canopy, no visible damage', color: 'text-green-500' },
  { stars: 4, label: 'Good', description: 'Healthy with minor issues', color: 'text-lime-500' },
  { stars: 3, label: 'Fair', description: 'Some damage or stress signs', color: 'text-yellow-500' },
  { stars: 2, label: 'Poor', description: 'Significant damage or disease', color: 'text-orange-500' },
  { stars: 1, label: 'Critical', description: 'Severe decline or dying', color: 'text-red-500' },
];

const AGE_OPTIONS = [
  { value: '1-5', label: '1-5 years', description: 'Sapling' },
  { value: '5-20', label: '5-20 years', description: 'Young tree' },
  { value: '20-50', label: '20-50 years', description: 'Adult tree' },
  { value: '50-100', label: '50-100 years', description: 'Mature tree' },
  { value: '100+', label: '100+ years', description: 'Heritage tree' },
];

interface EnhancedTreeQuickFormProps {
  location: [number, number];
  onSubmit: (data: TreeFormData) => void;
  onCancel: () => void;
  onSaveAndContinue: (data: TreeFormData) => void;
  treeNumber: number;
  projectId: string;
}

export type HealthStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'dead';

export interface TreeFormData {
  project_id: string;
  latitude: number;
  longitude: number;
  species: string;
  species_scientific?: string;
  height_meters: number;
  trunk_diameter_cm: number;
  canopy_diameter_meters: number;
  health_status: HealthStatus;
  age_years: number;
  notes?: string;
  photo_urls?: string[];
  has_birds_nest?: boolean;
  has_flowers_fruits?: boolean;
  provides_shade?: boolean;
}

export function EnhancedTreeQuickForm({
  location,
  onSubmit,
  onCancel,
  onSaveAndContinue,
  treeNumber,
  projectId,
}: EnhancedTreeQuickFormProps) {
  const [species, setSpecies] = useState('');
  const [speciesScientific, setSpeciesScientific] = useState('');
  const [speciesSearch, setSpeciesSearch] = useState('');
  const [height, setHeight] = useState(10);
  const [dbh, setDbh] = useState(30);
  const [canopy, setCanopy] = useState(5);
  const [health, setHealth] = useState(4);
  const [ageCategory, setAgeCategory] = useState('20-50');
  const [notes, setNotes] = useState('');
  const [hasBirdsNest, setHasBirdsNest] = useState(false);
  const [hasFlowersFruits, setHasFlowersFruits] = useState(false);
  const [providesShade, setProvidesShade] = useState(true);
  const [activeTab, setActiveTab] = useState('species');

  const filteredSpecies = COMMON_SPECIES.filter(s => 
    s.name.toLowerCase().includes(speciesSearch.toLowerCase()) ||
    s.scientific.toLowerCase().includes(speciesSearch.toLowerCase())
  );

  const getAgeFromCategory = (category: string): number => {
    switch (category) {
      case '1-5': return 3;
      case '5-20': return 12;
      case '20-50': return 35;
      case '50-100': return 75;
      case '100+': return 120;
      default: return 25;
    }
  };

  const getHealthStatus = (stars: number): HealthStatus => {
    switch (stars) {
      case 5: return 'excellent';
      case 4: return 'good';
      case 3: return 'fair';
      case 2: return 'poor';
      case 1: return 'dead';
      default: return 'fair';
    }
  };

  const buildFormData = (): TreeFormData => ({
    project_id: projectId,
    latitude: location[1],
    longitude: location[0],
    species: species || 'Unknown',
    species_scientific: speciesScientific,
    height_meters: height,
    trunk_diameter_cm: dbh,
    canopy_diameter_meters: canopy,
    health_status: getHealthStatus(health),
    age_years: getAgeFromCategory(ageCategory),
    notes,
    has_birds_nest: hasBirdsNest,
    has_flowers_fruits: hasFlowersFruits,
    provides_shade: providesShade,
  });

  const handleSubmit = () => {
    onSubmit(buildFormData());
  };

  const handleSaveAndContinue = () => {
    onSaveAndContinue(buildFormData());
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <TreeDeciduous className="h-5 w-5 text-green-600" />
              Tree #{treeNumber}
            </CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              {location[1].toFixed(6)}, {location[0].toFixed(6)}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="species" className="text-xs">Species</TabsTrigger>
            <TabsTrigger value="measurements" className="text-xs">Size</TabsTrigger>
            <TabsTrigger value="health" className="text-xs">Health</TabsTrigger>
          </TabsList>

          {/* Species Tab */}
          <TabsContent value="species" className="space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search species..."
                value={speciesSearch}
                onChange={(e) => setSpeciesSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <ScrollArea className="h-[200px]">
              <div className="grid grid-cols-3 gap-2 pr-4">
                {filteredSpecies.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => {
                      setSpecies(s.name);
                      setSpeciesScientific(s.scientific);
                      setActiveTab('measurements');
                    }}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      species === s.name 
                        ? 'border-green-500 bg-green-500/10' 
                        : 'border-muted hover:border-green-500/50'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{s.emoji}</span>
                    <span className="text-xs font-medium block truncate">{s.name}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>

            {species && (
              <div className="p-3 rounded-lg bg-green-500/10 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{species}</p>
                  <p className="text-xs text-muted-foreground">{speciesScientific}</p>
                </div>
                <Button size="sm" onClick={() => setActiveTab('measurements')}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Measurements Tab */}
          <TabsContent value="measurements" className="space-y-5 mt-4">
            {/* Height Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
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
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.5m</span>
                <span>25m</span>
                <span>50m</span>
              </div>
            </div>

            {/* DBH Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <span className="text-lg">⭕</span>
                  Trunk (DBH)
                </Label>
                <Badge variant="outline">{dbh}cm</Badge>
              </div>
              <Slider
                value={[dbh]}
                min={10}
                max={300}
                step={5}
                onValueChange={([v]) => setDbh(v)}
              />
            </div>

            {/* Canopy Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <span className="text-lg">🌳</span>
                  Canopy Diameter
                </Label>
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

            {/* Age */}
            <div className="space-y-3">
              <Label>Estimated Age</Label>
              <div className="grid grid-cols-5 gap-1">
                {AGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setAgeCategory(opt.value)}
                    className={`p-2 rounded text-center transition-all text-xs ${
                      ageCategory === opt.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <span className="block font-medium">{opt.label.split(' ')[0]}</span>
                    <span className="block text-[10px] opacity-70">{opt.description.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button 
              className="w-full"
              onClick={() => setActiveTab('health')}
            >
              Next: Health Rating <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </TabsContent>

          {/* Health Tab */}
          <TabsContent value="health" className="space-y-4 mt-4">
            {/* Star Rating */}
            <div className="space-y-3">
              <Label>Health Rating</Label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setHealth(star)}
                    className="p-2 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= health
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className={`text-center text-sm font-medium ${HEALTH_RATINGS.find(r => r.stars === health)?.color}`}>
                {HEALTH_RATINGS.find(r => r.stars === health)?.label}
              </p>
              <p className="text-center text-xs text-muted-foreground">
                {HEALTH_RATINGS.find(r => r.stars === health)?.description}
              </p>
            </div>

            {/* Ecological Features */}
            <div className="space-y-3">
              <Label>Ecological Features</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setHasBirdsNest(!hasBirdsNest)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    hasBirdsNest ? 'border-green-500 bg-green-500/10' : 'border-muted'
                  }`}
                >
                  <span className="text-xl block">🪺</span>
                  <span className="text-xs">Bird Nests</span>
                </button>
                <button
                  onClick={() => setHasFlowersFruits(!hasFlowersFruits)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    hasFlowersFruits ? 'border-green-500 bg-green-500/10' : 'border-muted'
                  }`}
                >
                  <span className="text-xl block">🌸</span>
                  <span className="text-xs">Flowers/Fruits</span>
                </button>
                <button
                  onClick={() => setProvidesShade(!providesShade)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    providesShade ? 'border-green-500 bg-green-500/10' : 'border-muted'
                  }`}
                >
                  <span className="text-xl block">☀️</span>
                  <span className="text-xs">Shade</span>
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Any additional observations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button variant="outline" onClick={handleSaveAndContinue}>
                <Save className="h-4 w-4 mr-1" />
                Save & Add More
              </Button>
              <Button onClick={handleSubmit}>
                <Save className="h-4 w-4 mr-1" />
                Save & Finish
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
