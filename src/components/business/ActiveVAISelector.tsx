import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface VAIOption {
  value: string;
  label: string;
  type: "personal" | "business";
  businessId?: string;
  vaiNumber: string;
}

export default function ActiveVAISelector() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<VAIOption[]>([]);
  const [activeVAI, setActiveVAI] = useState<VAIOption | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVAIOptions();
  }, []);

  const loadVAIOptions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get personal V.A.I.
      const { data: personalVAI } = await supabase
        .from("vai_verifications")
        .select("vai_number")
        .eq("user_id", user.id)
        .eq("is_business_vai", false)
        .maybeSingle();

      // Get business V.A.I.s
      const { data: businessVAIs } = await supabase
        .from("business_employees")
        .select("business_vai_number, business_id, businesses(business_name)")
        .eq("employee_user_id", user.id)
        .eq("status", "active");

      const vaiOptions: VAIOption[] = [];

      if (personalVAI) {
        vaiOptions.push({
          value: "personal",
          label: "Personal V.A.I.",
          type: "personal",
          vaiNumber: personalVAI.vai_number,
        });
      }

      if (businessVAIs) {
        businessVAIs.forEach((biz: any) => {
          vaiOptions.push({
            value: `business-${biz.business_id}`,
            label: biz.businesses?.business_name || "Business",
            type: "business",
            businessId: biz.business_id,
            vaiNumber: biz.business_vai_number,
          });
        });
      }

      setOptions(vaiOptions);

      // Load or set active V.A.I.
      const { data: activeContext } = await supabase
        .from("active_vai_context")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (activeContext) {
        const active = vaiOptions.find(
          opt => opt.vaiNumber === activeContext.active_vai_number
        );
        setActiveVAI(active || vaiOptions[0]);
      } else if (vaiOptions.length > 0) {
        // Set default to personal if available
        const defaultVAI = vaiOptions.find(opt => opt.type === "personal") || vaiOptions[0];
        setActiveVAI(defaultVAI);
        await updateActiveContext(defaultVAI);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateActiveContext = async (option: VAIOption) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("active_vai_context")
        .upsert({
          user_id: user.id,
          active_vai_type: option.type,
          active_business_id: option.businessId || null,
          active_vai_number: option.vaiNumber,
        });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSelect = async (option: VAIOption) => {
    setActiveVAI(option);
    setOpen(false);
    await updateActiveContext(option);
    toast({
      title: "V.A.I. Switched",
      description: `Now operating under: ${option.label}`,
    });
  };

  if (isLoading || options.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            {activeVAI?.type === "personal" ? (
              <User className="h-4 w-4" />
            ) : (
              <Building2 className="h-4 w-4" />
            )}
            <span>{activeVAI?.label || "Select V.A.I."}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search V.A.I..." />
          <CommandEmpty>No V.A.I. found.</CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => handleSelect(option)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    activeVAI?.value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex items-center gap-2">
                  {option.type === "personal" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Building2 className="h-4 w-4" />
                  )}
                  <div>
                    <div>{option.label}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {option.vaiNumber}
                    </div>
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
