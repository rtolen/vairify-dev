import { UseFormReturn } from "react-hook-form";
import { Ruler } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface AppearanceStepProps {
  form: UseFormReturn<any>;
}

export const AppearanceStep = ({ form }: AppearanceStepProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Physical Appearance</h2>
        <p className="text-muted-foreground">
          All fields are optional. Add what you're comfortable sharing.
        </p>
      </div>

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
                      <SelectItem value="6-4">6'4" - 193cm</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select weight range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under-100">Under 100 lbs</SelectItem>
                      <SelectItem value="100-120">100-120 lbs</SelectItem>
                      <SelectItem value="120-140">120-140 lbs</SelectItem>
                      <SelectItem value="140-160">140-160 lbs</SelectItem>
                      <SelectItem value="160-180">160-180 lbs</SelectItem>
                      <SelectItem value="180-200">180-200 lbs</SelectItem>
                      <SelectItem value="200-220">200-220 lbs</SelectItem>
                      <SelectItem value="220-240">220-240 lbs</SelectItem>
                      <SelectItem value="over-240">Over 240 lbs</SelectItem>
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
                      <SelectItem value="amber">Amber</SelectItem>
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
                      <SelectItem value="white">White</SelectItem>
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
                      <SelectItem value="bald">Bald</SelectItem>
                      <SelectItem value="short">Short</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="long">Long</SelectItem>
                      <SelectItem value="very-long">Very Long</SelectItem>
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
              name="ethnicity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ethnicity</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ethnicity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asian">Asian</SelectItem>
                      <SelectItem value="black">Black/African American</SelectItem>
                      <SelectItem value="hispanic">Hispanic/Latino</SelectItem>
                      <SelectItem value="middle-eastern">Middle Eastern</SelectItem>
                      <SelectItem value="native-american">Native American</SelectItem>
                      <SelectItem value="pacific-islander">Pacific Islander</SelectItem>
                      <SelectItem value="white">White/Caucasian</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
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
                      <SelectItem value="55-64">55-64</SelectItem>
                      <SelectItem value="65+">65+</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

