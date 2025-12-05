import { useState, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getGroupedCategories, CATEGORIES } from "@/config/categories";

interface CategoryComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function CategoryCombobox({ value, onValueChange, placeholder = "Select category..." }: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const groupedCategories = useMemo(() => getGroupedCategories(), []);

  const selectedCategory = CATEGORIES.find((cat) => cat.name === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selectedCategory ? (
            <span className="flex items-center gap-2">
              <span>{selectedCategory.icon}</span>
              <span>{selectedCategory.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-popover" align="start">
        <Command>
          <CommandInput placeholder="Search categories..." />
          <CommandList>
            <CommandEmpty>No category found.</CommandEmpty>
            {groupedCategories.map((group) => (
              <CommandGroup key={group.group} heading={group.group}>
                {group.categories.map((category) => (
                  <CommandItem
                    key={category.slug}
                    value={category.name}
                    onSelect={() => {
                      onValueChange(category.name);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === category.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="mr-2">{category.icon}</span>
                    {category.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
