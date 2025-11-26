import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { X, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export interface SearchFilterOptions {
  location?: string;
  ageRange?: string;
  services?: string[];
  availability?: "available_now" | "any";
  verified?: boolean;
  vaiVerified?: boolean;
  priceRange?: [number, number];
}

interface SearchFiltersProps {
  filters: SearchFilterOptions;
  onFiltersChange: (filters: SearchFilterOptions) => void;
}

export const SearchFilters = ({ filters, onFiltersChange }: SearchFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const serviceOptions = [
    "Companionship",
    "Dinner Dates",
    "Events",
    "Travel",
    "Entertainment",
    "Virtual",
  ];

  const locationOptions = [
    "New York, NY",
    "Los Angeles, CA",
    "Chicago, IL",
    "Miami, FL",
    "Las Vegas, NV",
    "San Francisco, CA",
  ];

  const ageRangeOptions = [
    "18-25",
    "26-30",
    "31-35",
    "36-40",
    "41-45",
    "46+",
  ];

  const toggleService = (service: string) => {
    const currentServices = filters.services || [];
    const newServices = currentServices.includes(service)
      ? currentServices.filter(s => s !== service)
      : [...currentServices, service];
    onFiltersChange({ ...filters, services: newServices });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const activeFiltersCount = [
    filters.location,
    filters.ageRange,
    filters.services?.length,
    filters.availability === "available_now",
    filters.verified,
    filters.vaiVerified,
  ].filter(Boolean).length;

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Location */}
      <div className="space-y-2">
        <Label>Location</Label>
        <Select
          value={filters.location || ""}
          onValueChange={(value) => onFiltersChange({ ...filters, location: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            {locationOptions.map((location) => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Age Range */}
      <div className="space-y-2">
        <Label>Age Range</Label>
        <Select
          value={filters.ageRange || ""}
          onValueChange={(value) => onFiltersChange({ ...filters, ageRange: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select age range" />
          </SelectTrigger>
          <SelectContent>
            {ageRangeOptions.map((range) => (
              <SelectItem key={range} value={range}>
                {range}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Services */}
      <div className="space-y-2">
        <Label>Services Offered</Label>
        <div className="flex flex-wrap gap-2">
          {serviceOptions.map((service) => (
            <Badge
              key={service}
              variant={filters.services?.includes(service) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleService(service)}
            >
              {service}
              {filters.services?.includes(service) && (
                <X className="ml-1 h-3 w-3" />
              )}
            </Badge>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="space-y-2">
        <Label>Availability</Label>
        <Select
          value={filters.availability || "any"}
          onValueChange={(value) => onFiltersChange({ 
            ...filters, 
            availability: value as "available_now" | "any" 
          })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="available_now">Available Now</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Verified Only */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="verified"
          checked={filters.verified || false}
          onChange={(e) => onFiltersChange({ ...filters, verified: e.target.checked })}
          className="h-4 w-4 rounded border-border"
        />
        <Label htmlFor="verified" className="cursor-pointer">
          Verified profiles only
        </Label>
      </div>

      {/* V.A.I. Verified Only */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="vaiVerified"
          checked={filters.vaiVerified || false}
          onChange={(e) => onFiltersChange({ ...filters, vaiVerified: e.target.checked })}
          className="h-4 w-4 rounded border-border"
        />
        <Label htmlFor="vaiVerified" className="cursor-pointer">
          V.A.I. Verified only
        </Label>
      </div>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full"
        >
          Clear All Filters ({activeFiltersCount})
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile/Tablet - Sheet */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full relative">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Search Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6 overflow-y-auto h-[calc(100%-4rem)]">
              <FiltersContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop - Card */}
      <Card className="hidden lg:block p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Filters</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">{activeFiltersCount} active</Badge>
          )}
        </div>
        <FiltersContent />
      </Card>
    </>
  );
};
