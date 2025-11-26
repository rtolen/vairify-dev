import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { DollarSign, Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface PricingStepProps {
  form: UseFormReturn<any>;
}

interface ServiceOption {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  base_price: number;
  duration_minutes?: number;
  category_id: string;
  category?: {
    display_name: string;
    icon?: string;
  };
}

interface ServicePricing {
  priceType: 'included' | 'extra';
  customPrice?: number;
}

export const PricingStep = ({ form }: PricingStepProps) => {
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedServices = form.watch("selectedServices") || [];
  const servicePricing = form.watch("servicePricing") || {};

  useEffect(() => {
    if (selectedServices.length > 0) {
      loadServiceDetails();
    } else {
      setLoading(false);
    }
  }, [selectedServices]);

  const loadServiceDetails = async () => {
    try {
      setLoading(true);

      // Fetch service options
      const { data: serviceOptions, error: optionsError } = await supabase
        .from('service_options')
        .select('*')
        .in('id', selectedServices)
        .eq('is_active', true);

      if (optionsError) {
        console.error("Error fetching service options:", optionsError);
        throw optionsError;
      }

      if (!serviceOptions || serviceOptions.length === 0) {
        setServices([]);
        setLoading(false);
        return;
      }

      // Fetch categories for the services
      const categoryIds = [...new Set(serviceOptions.map(opt => opt.category_id))];
      const { data: categories, error: categoriesError } = await supabase
        .from('service_categories')
        .select('id, display_name, icon')
        .in('id', categoryIds);

      if (categoriesError) {
        console.error("Error fetching categories:", categoriesError);
      }

      // Combine services with their categories
      const transformedOptions = serviceOptions.map((opt: any) => ({
        ...opt,
        category: categories?.find(c => c.id === opt.category_id),
      }));

      // Initialize pricing for services that don't have it yet
      const currentPricing = form.getValues("servicePricing") || {};
      const newPricing: Record<string, ServicePricing> = { ...currentPricing };

      transformedOptions.forEach((service: any) => {
        if (!newPricing[service.id]) {
          newPricing[service.id] = {
            priceType: 'included', // Default to included
            customPrice: undefined,
          };
        }
      });

      form.setValue("servicePricing", newPricing);
      setServices(transformedOptions || []);
    } catch (error) {
      console.error("Error loading service details:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePricingType = (serviceId: string, priceType: 'included' | 'extra') => {
    const current = form.getValues("servicePricing") || {};
    form.setValue("servicePricing", {
      ...current,
      [serviceId]: {
        ...current[serviceId],
        priceType,
      },
    });
  };

  const updateCustomPrice = (serviceId: string, price: string) => {
    const current = form.getValues("servicePricing") || {};
    const numPrice = price ? parseFloat(price) : undefined;
    form.setValue("servicePricing", {
      ...current,
      [serviceId]: {
        ...current[serviceId],
        customPrice: numPrice,
      },
    });
  };

  const getDisplayPrice = (service: ServiceOption): number => {
    const pricing = servicePricing[service.id];
    return pricing?.customPrice ?? service.base_price;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Service Pricing</h2>
          <p className="text-muted-foreground">Loading service details...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (selectedServices.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Service Pricing</h2>
          <p className="text-muted-foreground">No services selected. Go back to select services.</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Please select at least one service in the previous step to configure pricing.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Service Pricing</h2>
        <p className="text-muted-foreground">
          Set pricing for your selected services. Mark services as "Included" (in base price) or "Extra" (additional charge).
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <CardTitle className="flex items-center gap-2">
              Pricing Configuration
              <Badge variant="outline" className="text-xs">Optional</Badge>
            </CardTitle>
          </div>
          <CardDescription>
            Configure how each service is priced. Included services are part of the base price, Extra services are additional charges.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="servicePricing"
            render={() => (
              <FormItem>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Service</TableHead>
                        <TableHead className="w-[120px]">Base Price</TableHead>
                        <TableHead className="w-[150px]">Price Type</TableHead>
                        <TableHead className="w-[150px]">Custom Price</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((service) => {
                        const pricing = servicePricing[service.id] || { priceType: 'included' as const };
                        const displayPrice = getDisplayPrice(service);
                        const isIncluded = pricing.priceType === 'included';

                        return (
                          <TableRow key={service.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {service.category?.icon && (
                                  <span className="text-xl">{service.category.icon}</span>
                                )}
                                <div>
                                  <div className="font-semibold text-foreground">{service.display_name}</div>
                                  {service.category && (
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                      {service.category.display_name}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-primary">
                                ${service.base_price}
                              </span>
                              {service.duration_minutes && (
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {service.duration_minutes} min
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-1">
                                  <Label htmlFor={`type-${service.id}`} className="text-xs text-muted-foreground">
                                    {isIncluded ? 'Included' : 'Extra'}
                                  </Label>
                                  <div className="flex items-center gap-2">
                                    <span className={cn(
                                      "text-sm font-medium",
                                      isIncluded ? "text-foreground" : "text-muted-foreground"
                                    )}>
                                      Included
                                    </span>
                                    <Switch
                                      id={`type-${service.id}`}
                                      checked={!isIncluded}
                                      onCheckedChange={(checked) => {
                                        updatePricingType(service.id, checked ? 'extra' : 'included');
                                      }}
                                      className="data-[state=checked]:bg-primary"
                                    />
                                    <span className={cn(
                                      "text-sm font-medium",
                                      !isIncluded ? "text-foreground" : "text-muted-foreground"
                                    )}>
                                      Extra
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Input
                                  type="number"
                                  placeholder={service.base_price.toString()}
                                  value={pricing.customPrice?.toString() || ''}
                                  onChange={(e) => updateCustomPrice(service.id, e.target.value)}
                                  className="w-full h-9"
                                  min="0"
                                  step="0.01"
                                />
                                {pricing.customPrice && pricing.customPrice !== service.base_price && (
                                  <p className="text-xs text-muted-foreground">
                                    Override: ${pricing.customPrice}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {service.description && (
                                <p className="text-sm text-muted-foreground max-w-md">
                                  {service.description}
                                </p>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {services.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Included Services</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {services
                            .filter(s => servicePricing[s.id]?.priceType === 'included')
                            .map(s => (
                              <li key={s.id} className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-success" />
                                <span>{s.display_name} - ${getDisplayPrice(s)}</span>
                              </li>
                            ))}
                          {services.filter(s => servicePricing[s.id]?.priceType === 'included').length === 0 && (
                            <li className="text-muted-foreground italic">None</li>
                          )}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Extra Services</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {services
                            .filter(s => servicePricing[s.id]?.priceType === 'extra')
                            .map(s => (
                              <li key={s.id} className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-primary" />
                                <span>{s.display_name} - ${getDisplayPrice(s)}</span>
                              </li>
                            ))}
                          {services.filter(s => servicePricing[s.id]?.priceType === 'extra').length === 0 && (
                            <li className="text-muted-foreground italic">None</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <p className="text-sm text-foreground">
                        <strong>Note:</strong> Included services are part of your base pricing package. 
                        Extra services are optional add-ons that clients can purchase separately.
                      </p>
                    </div>
                  </div>
                )}
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
};

