import { useState, useEffect, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Briefcase } from "lucide-react";
import { CATEGORIES } from "@/config/categories";
import { searchLocations } from "@/config/southAfricanLocations";

interface ProSearchAutocompleteProps {
  serviceValue: string;
  locationValue: string;
  onServiceChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onSearch: () => void;
}

interface Suggestion {
  text: string;
  type: "service" | "location";
  subtext?: string;
}

export const ProSearchAutocomplete = ({
  serviceValue,
  locationValue,
  onServiceChange,
  onLocationChange,
  onSearch,
}: ProSearchAutocompleteProps) => {
  const [activeField, setActiveField] = useState<"service" | "location" | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const serviceSuggestions = useMemo(() => {
    if (!serviceValue || serviceValue.length < 2) return [];
    
    const searchLower = serviceValue.toLowerCase();
    return CATEGORIES.filter(
      (cat) =>
        cat.name.toLowerCase().includes(searchLower) ||
        cat.group.toLowerCase().includes(searchLower)
    ).slice(0, 6).map(cat => ({
      text: cat.name,
      type: "service" as const,
      subtext: cat.group,
    }));
  }, [serviceValue]);

  const locationSuggestions = useMemo(() => {
    if (!locationValue || locationValue.length < 2) return [];
    
    return searchLocations(locationValue, 6).map(loc => ({
      text: loc.name,
      type: "location" as const,
      subtext: loc.type === "city" ? loc.province : "Province",
    }));
  }, [locationValue]);

  const currentSuggestions = activeField === "service" ? serviceSuggestions : locationSuggestions;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveField(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [currentSuggestions]);

  const handleSelect = (suggestion: Suggestion) => {
    if (suggestion.type === "service") {
      onServiceChange(suggestion.text);
    } else {
      onLocationChange(suggestion.text);
    }
    setActiveField(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: "service" | "location") => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, currentSuggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && currentSuggestions[highlightedIndex]) {
        handleSelect(currentSuggestions[highlightedIndex]);
      } else {
        onSearch();
      }
    } else if (e.key === "Escape") {
      setActiveField(null);
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col md:flex-row gap-3 w-full">
      {/* Service Search */}
      <div className="relative flex-1">
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="What service do you need?"
            value={serviceValue}
            onChange={(e) => onServiceChange(e.target.value)}
            onFocus={() => setActiveField("service")}
            onKeyDown={(e) => handleKeyDown(e, "service")}
            className="pl-10"
          />
        </div>
        {activeField === "service" && serviceSuggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-64 overflow-auto">
            {serviceSuggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.text}-${index}`}
                className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-muted transition ${
                  highlightedIndex === index ? "bg-muted" : ""
                }`}
                onClick={() => handleSelect(suggestion)}
              >
                <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{suggestion.text}</p>
                  <p className="text-xs text-muted-foreground truncate">{suggestion.subtext}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Location Search */}
      <div className="relative flex-1">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Your location (city or province)"
            value={locationValue}
            onChange={(e) => onLocationChange(e.target.value)}
            onFocus={() => setActiveField("location")}
            onKeyDown={(e) => handleKeyDown(e, "location")}
            className="pl-10"
          />
        </div>
        {activeField === "location" && locationSuggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-64 overflow-auto">
            {locationSuggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.text}-${index}`}
                className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-muted transition ${
                  highlightedIndex === index ? "bg-muted" : ""
                }`}
                onClick={() => handleSelect(suggestion)}
              >
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{suggestion.text}</p>
                  <p className="text-xs text-muted-foreground truncate">{suggestion.subtext}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Button */}
      <button
        onClick={onSearch}
        className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition flex items-center justify-center gap-2"
      >
        <Search className="h-4 w-4" />
        <span className="md:hidden lg:inline">Search</span>
      </button>
    </div>
  );
};
