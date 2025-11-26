import { UseFormReturn } from "react-hook-form";
import { Ruler, Briefcase, Plus, MapPin, Car, Utensils, Clock, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PhysicalServicesStepProps {
  form: UseFormReturn<any>;
}

const services = [
  {
    id: "1hour",
    name: "1 Hour City Tour",
    duration: "60 minutes",
    price: 200,
    description: "Standard city tour experience",
    icon: MapPin,
  },
  {
    id: "1.5hour",
    name: "Extended Walking Tour",
    duration: "90 minutes",
    price: 280,
    description: "Leisurely walking tour with extra time",
    icon: MapPin,
  },
  {
    id: "cart",
    name: "Golf Cart Tour",
    duration: "60 minutes",
    price: 250,
    description: "Comfortable tour via golf cart",
    icon: Car,
  },
  {
    id: "2hour",
    name: "2 Hour Premium Tour",
    duration: "120 minutes",
    price: 380,
    description: "Extended premium experience",
    icon: MapPin,
  },
];

const addOns = [
  {
    id: "dinner",
    name: "Dinner After Tour",
    duration: "+60 minutes",
    price: 150,
    note: "Client covers meal expenses",
    icon: Utensils,
  },
  {
    id: "transport",
    name: "Taxi/Uber To & From Venue",
    price: 40,
    note: "Round-trip transportation included",
    icon: Car,
  },
  {
    id: "overnight",
    name: "Overnight Experience",
    duration: "8+ hours",
    price: 800,
    note: "Available by special arrangement",
    icon: Clock,
  },
];

export const PhysicalServicesStep = ({ form }: PhysicalServicesStepProps) => {
  const toggleService = (serviceId: string) => {
    const current = form.getValues("servicesOffered");
    const updated = current.includes(serviceId)
      ? current.filter((id: string) => id !== serviceId)
      : [...current, serviceId];
    form.setValue("servicesOffered", updated);
  };

  const toggleAddOn = (addOnId: string) => {
    const current = form.getValues("addOns");
    const updated = current.includes(addOnId)
      ? current.filter((id: string) => id !== addOnId)
      : [...current, addOnId];
    form.setValue("addOns", updated);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Physical Attributes & Services</h2>
        <p className="text-muted-foreground">
          All fields are optional. Add what you're comfortable sharing.
        </p>
      </div>

      {/* Physical Attributes */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="flex items-center gap-2">
              Physical Attributes
              <Badge variant="outline" className="text-xs">Optional</Badge>
            </CardTitle>
          </div>
          <CardDescription>
            Help clients know what to expect. All fields optional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="height"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Height</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select height" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4-10">4'10" - 147cm</SelectItem>
                      <SelectItem value="5-0">5'0" - 152cm</SelectItem>
                      <SelectItem value="5-2">5'2" - 157cm</SelectItem>
                      <SelectItem value="5-4">5'4" - 162cm</SelectItem>
                      <SelectItem value="5-6">5'6" - 168cm</SelectItem>
                      <SelectItem value="5-8">5'8" - 173cm</SelectItem>
                      <SelectItem value="5-10">5'10" - 178cm</SelectItem>
                      <SelectItem value="6-0">6'0" - 183cm</SelectItem>
                      <SelectItem value="6-2">6'2" - 188cm</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eyeColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eye Color</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select eye color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brown">Brown</SelectItem>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="hazel">Hazel</SelectItem>
                      <SelectItem value="gray">Gray</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hairColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hair Color</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select hair color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blonde">Blonde</SelectItem>
                      <SelectItem value="brunette">Brunette</SelectItem>
                      <SelectItem value="black">Black</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="auburn">Auburn</SelectItem>
                      <SelectItem value="gray">Gray</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hairLength"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hair Length</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select hair length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="long">Long</SelectItem>
                      <SelectItem value="bald">Bald</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bodyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select body type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slim">Slim</SelectItem>
                      <SelectItem value="athletic">Athletic</SelectItem>
                      <SelectItem value="average">Average</SelectItem>
                      <SelectItem value="curvy">Curvy</SelectItem>
                      <SelectItem value="plus-size">Plus-size</SelectItem>
                      <SelectItem value="muscular">Muscular</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ageRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age Range</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select age range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="18-24">18-24</SelectItem>
                      <SelectItem value="25-34">25-34</SelectItem>
                      <SelectItem value="35-44">35-44</SelectItem>
                      <SelectItem value="45-54">45-54</SelectItem>
                      <SelectItem value="55+">55+</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Services Offered */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            <CardTitle className="flex items-center gap-2">
              Services & Tours
              <Badge variant="secondary" className="text-xs bg-primary/20">Recommended</Badge>
            </CardTitle>
          </div>
          <CardDescription>
            Select the services you offer. Pricing is set by administrators.
          </CardDescription>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mt-2">
            <p className="text-sm text-foreground flex items-start gap-2">
              <span className="text-primary">ℹ️</span>
              Prices and service names are managed by Vairify administrators to ensure consistency.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {services.map((service) => {
              const Icon = service.icon;
              const isSelected = form.watch("servicesOffered").includes(service.id);
              
              return (
                <Card
                  key={service.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1",
                    isSelected && "border-primary bg-primary/5"
                  )}
                  onClick={() => toggleService(service.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-5 h-5 border-2 rounded flex items-center justify-center shrink-0 mt-0.5",
                        isSelected ? "bg-primary border-primary" : "border-border"
                      )}>
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-primary" />
                            <h4 className="font-semibold text-foreground">{service.name}</h4>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Duration: {service.duration}
                        </div>
                        <div className="text-lg font-semibold text-primary">
                          ${service.price}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {service.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add-On Services */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="flex items-center gap-2">
              Add-On Services
              <Badge variant="outline" className="text-xs">Optional</Badge>
            </CardTitle>
          </div>
          <CardDescription>
            Additional services you can offer with tours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {addOns.map((addOn) => {
              const Icon = addOn.icon;
              const isSelected = form.watch("addOns").includes(addOn.id);
              
              return (
                <Card
                  key={addOn.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1",
                    isSelected && "border-primary bg-primary/5"
                  )}
                  onClick={() => toggleAddOn(addOn.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-5 h-5 border-2 rounded flex items-center justify-center shrink-0 mt-0.5",
                        isSelected ? "bg-primary border-primary" : "border-border"
                      )}>
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-2">
                          <Icon className="w-4 h-4 text-primary" />
                          <h4 className="font-semibold text-foreground">{addOn.name}</h4>
                        </div>
                        {addOn.duration && (
                          <div className="text-sm text-muted-foreground">
                            {addOn.duration}
                          </div>
                        )}
                        <div className="text-lg font-semibold text-primary">
                          +${addOn.price}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {addOn.note}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
