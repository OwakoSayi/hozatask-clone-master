import { useState, useRef, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { CATEGORIES } from "@/config/categories";
import { searchLocations } from "@/config/southAfricanLocations";
import { Search, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onKeyPress?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  type: "service" | "location";
  className?: string;
}

export const SearchAutocomplete = ({
  value,
  onChange,
  onKeyPress,
  placeholder,
  type,
  className,
}: SearchAutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    if (!value.trim()) return [];
    
    if (type === "service") {
      const lowerQuery = value.toLowerCase();
      return CATEGORIES
        .filter(cat => 
          cat.name.toLowerCase().includes(lowerQuery) ||
          cat.group.toLowerCase().includes(lowerQuery)
        )
        .sort((a, b) => {
          const aStartsWith = a.name.toLowerCase().startsWith(lowerQuery);
          const bStartsWith = b.name.toLowerCase().startsWith(lowerQuery);
          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;
          return a.name.localeCompare(b.name);
        })
        .slice(0, 8);
    } else {
      return searchLocations(value, 8);
    }
  }, [value, type]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      onKeyPress?.(e);
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          e.preventDefault();
          const selected = suggestions[highlightedIndex];
          handleSelect(type === "service" ? (selected as any).name : (selected as any).name);
        } else {
          onKeyPress?.(e);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
      default:
        onKeyPress?.(e);
    }
  };

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <div className="flex items-center gap-2 px-3">
        {type === "service" ? (
          <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        ) : (
          <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        )}
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className={cn("border-0 shadow-none focus-visible:ring-0", className)}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => value.trim() && setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </div>
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
          <ul className="py-2 max-h-64 overflow-y-auto">
            {suggestions.map((item, index) => {
              if (type === "service") {
                const category = item as typeof CATEGORIES[0];
                return (
                  <li
                    key={category.slug}
                    className={cn(
                      "px-4 py-3 cursor-pointer flex items-center gap-3 transition-colors",
                      highlightedIndex === index
                        ? "bg-primary/10"
                        : "hover:bg-muted"
                    )}
                    onClick={() => handleSelect(category.name)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <span className="text-xl">{category.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {category.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {category.group}
                      </p>
                    </div>
                  </li>
                );
              } else {
                const location = item as { name: string; type: "city" | "province"; province?: string };
                return (
                  <li
                    key={`${location.type}-${location.name}`}
                    className={cn(
                      "px-4 py-3 cursor-pointer flex items-center gap-3 transition-colors",
                      highlightedIndex === index
                        ? "bg-primary/10"
                        : "hover:bg-muted"
                    )}
                    onClick={() => handleSelect(location.name)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {location.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {location.type === "province" ? "Province" : location.province}
                      </p>
                    </div>
                  </li>
                );
              }
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
