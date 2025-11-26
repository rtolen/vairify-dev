import { UseFormReturn } from "react-hook-form";
import { Globe, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LanguageStepProps {
  form: UseFormReturn<any>;
}

const commonLanguages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "zh", name: "Mandarin", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
];

export const LanguageStep = ({ form }: LanguageStepProps) => {
  const selectedLanguages = form.watch("languages") || [];

  const toggleLanguage = (languageCode: string) => {
    const current = selectedLanguages;
    const updated = current.includes(languageCode)
      ? current.filter((code: string) => code !== languageCode)
      : [...current, languageCode];
    form.setValue("languages", updated);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Select Your Languages</h2>
        <p className="text-muted-foreground">
          Choose the languages you speak. This helps clients find providers who speak their language.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <CardTitle className="flex items-center gap-2">
              Languages
              <Badge variant="outline" className="text-xs">Optional</Badge>
            </CardTitle>
          </div>
          <CardDescription>
            Select all languages you're comfortable speaking with clients. You can add more later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="languages"
            render={() => (
              <FormItem>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {commonLanguages.map((language) => {
                    const isSelected = selectedLanguages.includes(language.code);
                    return (
                      <Card
                        key={language.code}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1",
                          isSelected && "border-primary bg-primary/5"
                        )}
                        onClick={() => toggleLanguage(language.code)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-5 h-5 border-2 rounded flex items-center justify-center shrink-0",
                              isSelected ? "bg-primary border-primary" : "border-border"
                            )}>
                              {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{language.flag}</span>
                                <span className="font-semibold text-foreground">{language.name}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                <FormDescription className="mt-4">
                  Selected languages: {selectedLanguages.length > 0 ? selectedLanguages.join(", ") : "None"}
                </FormDescription>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {selectedLanguages.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <p className="text-sm text-foreground">
              ✓ You've selected {selectedLanguages.length} language{selectedLanguages.length !== 1 ? "s" : ""}. This information will be visible on your profile.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

