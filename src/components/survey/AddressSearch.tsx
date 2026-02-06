import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  MapPin, 
  Loader2, 
  Navigation2, 
  Building2, 
  Trees, 
  Wheat,
  Waves,
  LocateFixed
} from 'lucide-react';
import { searchAddress, GeocodingResult, detectLandType } from '@/lib/geocoding';
import { toast } from 'sonner';

interface AddressSearchProps {
  onLocationSelect: (result: GeocodingResult) => void;
  onCurrentLocation?: () => void;
}

export function AddressSearch({ onLocationSelect, onCurrentLocation }: AddressSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState<GeocodingResult | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      toast.error('Please enter an address or location name');
      return;
    }

    setIsSearching(true);
    try {
      const searchResults = await searchAddress(query);
      setResults(searchResults);
      
      if (searchResults.length === 0) {
        toast.info('No locations found. Try a different search term.');
      }
    } catch (error) {
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [query]);

  const handleSelect = (result: GeocodingResult) => {
    setSelectedResult(result);
    onLocationSelect(result);
  };

  const getLandTypeIcon = (result: GeocodingResult) => {
    const landType = detectLandType(result);
    switch (landType) {
      case 'forest': return <Trees className="h-4 w-4 text-green-600" />;
      case 'agricultural': return <Wheat className="h-4 w-4 text-amber-600" />;
      case 'urban': return <Building2 className="h-4 w-4 text-slate-600" />;
      case 'water': return <Waves className="h-4 w-4 text-blue-600" />;
      default: return <MapPin className="h-4 w-4 text-primary" />;
    }
  };

  const getLandTypeBadge = (result: GeocodingResult) => {
    const landType = detectLandType(result);
    const colors: Record<string, string> = {
      forest: 'bg-green-500/10 text-green-700',
      agricultural: 'bg-amber-500/10 text-amber-700',
      urban: 'bg-slate-500/10 text-slate-700',
      water: 'bg-blue-500/10 text-blue-700',
      other: 'bg-gray-500/10 text-gray-700',
    };
    return colors[landType] || colors.other;
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-lg flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Find Your Location
        </CardTitle>
        <CardDescription>
          Enter any address, landmark, or place name
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="e.g., SP College Pune, Tiger Reserve Bandipur..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 h-11"
            />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={isSearching}
            className="h-11"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Search'
            )}
          </Button>
        </div>

        {/* Current Location Button */}
        {onCurrentLocation && (
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={onCurrentLocation}
          >
            <LocateFixed className="h-4 w-4 mr-2 text-primary" />
            Use My Current Location
          </Button>
        )}

        {/* Search Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Found {results.length} location{results.length > 1 ? 's' : ''}
            </p>
            <ScrollArea className="h-[250px]">
              <div className="space-y-2 pr-4">
                {results.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(result)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      selectedResult === result 
                        ? 'bg-primary/10 ring-2 ring-primary' 
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getLandTypeIcon(result)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {result.display_name.split(',')[0]}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {result.display_name.split(',').slice(1, 4).join(',')}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getLandTypeBadge(result)}`}
                          >
                            {detectLandType(result)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {result.lat.toFixed(4)}, {result.lon.toFixed(4)}
                          </span>
                        </div>
                      </div>
                      {selectedResult === result && (
                        <Navigation2 className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Example Searches */}
        {results.length === 0 && !isSearching && (
          <div className="p-4 rounded-lg bg-muted/30">
            <p className="text-sm font-medium mb-2">Example searches:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Cubbon Park, Bangalore',
                'IIT Bombay Campus',
                'Ranthambore National Park',
                'NH 48, Pune Highway',
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => {
                    setQuery(example);
                    handleSearch();
                  }}
                  className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-primary/10 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
