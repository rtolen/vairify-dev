import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { Briefcase, Check, ChevronDown, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface ServicesStepProps {
  form: UseFormReturn<any>;
}

interface ServiceCategory {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  display_order: number;
  parent_category_id?: string;
  service_options: ServiceOption[];
}

interface ServiceOption {
  id: string;
  category_id: string;
  name: string;
  display_name: string;
  description?: string;
  base_price: number;
  duration_minutes?: number;
  display_order: number;
}

export const ServicesStep = ({ form }: ServicesStepProps) => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const selectedServices = form.watch("selectedServices") || [];

  useEffect(() => {
    loadServiceCategories();
  }, []);

  const loadServiceCategories = async () => {
    try {
      setLoading(true);

      // Fetch top-level categories (no parent)
      const { data: topCategories, error: categoriesError } = await supabase
        .from('service_categories')
        .select('*')
        .eq('is_active', true)
        .is('parent_category_id', null)
        .order('display_order', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Fetch subcategories for each top-level category
      const categoriesWithSubcategories = await Promise.all(
        (topCategories || []).map(async (category) => {
          // Get subcategories
          const { data: subcategories } = await supabase
            .from('service_categories')
            .select('*')
            .eq('is_active', true)
            .eq('parent_category_id', category.id)
            .order('display_order', { ascending: true });

          // Get all service options for this category and subcategories
          const categoryIds = [category.id, ...(subcategories?.map(s => s.id) || [])];
          
          const { data: serviceOptions } = await supabase
            .from('service_options')
            .select('*')
            .eq('is_active', true)
            .in('category_id', categoryIds)
            .order('display_order', { ascending: true });

          // Group service options by subcategory
          const subcategoriesWithServices = (subcategories || []).map(subcat => ({
            ...subcat,
            service_options: serviceOptions?.filter(opt => opt.category_id === subcat.id) || [],
          }));

          return {
            ...category,
            service_options: serviceOptions?.filter(opt => opt.category_id === category.id) || [],
            subcategories: subcategoriesWithServices,
          };
        })
      );

      setCategories(categoriesWithSubcategories as ServiceCategory[]);
      
      // Auto-expand categories with services
      const initialExpanded: Record<string, boolean> = {};
      categoriesWithSubcategories.forEach(cat => {
        if (cat.service_options.length > 0 || cat.subcategories?.length > 0) {
          initialExpanded[cat.id] = true;
        }
      });
      setExpandedCategories(initialExpanded);
    } catch (error) {
      console.error("Error loading service categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (serviceId: string) => {
    const current = selectedServices;
    const updated = current.includes(serviceId)
      ? current.filter((id: string) => id !== serviceId)
      : [...current, serviceId];
    form.setValue("selectedServices", updated);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Services</h2>
          <p className="text-muted-foreground">Loading service categories...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Select Your Services</h2>
        <p className="text-muted-foreground">
          Choose the services you offer. You'll set pricing in the next step.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            <CardTitle className="flex items-center gap-2">
              Services & Offerings
              <Badge variant="outline" className="text-xs">Optional</Badge>
            </CardTitle>
          </div>
          <CardDescription>
            Select all services you're comfortable providing. Services are organized by category.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No service categories available. Please contact support.
            </div>
          ) : (
            <Accordion
              type="multiple"
              value={Object.keys(expandedCategories).filter(key => expandedCategories[key])}
              onValueChange={(values) => {
                const newExpanded: Record<string, boolean> = {};
                values.forEach(value => {
                  newExpanded[value] = true;
                });
                setExpandedCategories(newExpanded);
              }}
              className="w-full"
            >
              {categories.map((category) => (
                <AccordionItem key={category.id} value={category.id} className="border-b">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3 flex-1">
                      {category.icon && (
                        <span className="text-2xl">{category.icon}</span>
                      )}
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-foreground">{category.display_name}</div>
                        {category.description && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {category.description}
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary" className="mr-2">
                        {category.service_options.length + 
                         (category.subcategories?.reduce((sum, sub) => sum + sub.service_options.length, 0) || 0)} services
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="space-y-4 pt-2">
                      {/* Services in main category */}
                      {category.service_options.length > 0 && (
                        <div className="space-y-2">
                          {category.service_options.map((service) => {
                            const isSelected = selectedServices.includes(service.id);
                            return (
                              <Card
                                key={service.id}
                                className={cn(
                                  "cursor-pointer transition-all hover:shadow-md",
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
                                    <div className="flex-1 space-y-1">
                                      <h4 className="font-semibold text-foreground">{service.display_name}</h4>
                                      {service.description && (
                                        <p className="text-sm text-muted-foreground">{service.description}</p>
                                      )}
                                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        {service.duration_minutes && (
                                          <span>Duration: {service.duration_minutes} min</span>
                                        )}
                                        <span className="font-semibold text-primary">
                                          Base: ${service.base_price}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}

                      {/* Subcategories */}
                      {category.subcategories?.map((subcategory) => (
                        <div key={subcategory.id} className="space-y-2">
                          <h5 className="font-medium text-foreground text-sm ml-7">
                            {subcategory.display_name}
                          </h5>
                          {subcategory.service_options.map((service) => {
                            const isSelected = selectedServices.includes(service.id);
                            return (
                              <Card
                                key={service.id}
                                className={cn(
                                  "cursor-pointer transition-all hover:shadow-md ml-7",
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
                                    <div className="flex-1 space-y-1">
                                      <h4 className="font-semibold text-foreground">{service.display_name}</h4>
                                      {service.description && (
                                        <p className="text-sm text-muted-foreground">{service.description}</p>
                                      )}
                                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        {service.duration_minutes && (
                                          <span>Duration: {service.duration_minutes} min</span>
                                        )}
                                        <span className="font-semibold text-primary">
                                          Base: ${service.base_price}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}

          {selectedServices.length > 0 && (
            <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm text-foreground">
                ✓ You've selected {selectedServices.length} service{selectedServices.length !== 1 ? "s" : ""}. 
                Configure pricing in the next step.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

