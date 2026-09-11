import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

const generalSettingsFormSchema = z.object({
  restaurantName: z
    .string()
    .min(2, {
      message: "Restaurant name must be at least 2 characters.",
    })
    .max(50, {
      message: "Restaurant name must not be longer than 50 characters.",
    }),
  restaurantAddress: z
    .string()
    .max(200, {
      message: "Restaurant address must not be longer than 200 characters.",
    }).optional(),
  contactEmail: z.string().email({ message: "Please enter a valid email." }),
});

type GeneralSettingsFormValues = z.infer<typeof generalSettingsFormSchema>;

// This is a mock API call. Replace with your actual API call.
const updateGeneralSettings = async (data: GeneralSettingsFormValues) => {
  console.log("Updating settings with:", data);
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  // Simulate a successful response
  return { ok: true };
};

export default function GeneralSettingsPage() {
  // You would typically fetch defaultValues from your API
  const form = useForm<GeneralSettingsFormValues>({
    resolver: zodResolver(generalSettingsFormSchema),
    defaultValues: {
      restaurantName: "The Pizza Place",
      restaurantAddress: "123 Main St, Anytown, USA",
      contactEmail: "contact@thepizzaplace.com",
    },
    mode: "onChange",
  });

  async function onSubmit(data: GeneralSettingsFormValues) {
    try {
      await updateGeneralSettings(data);
      toast({
        title: "Settings updated successfully!",
        description: "Your general settings have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error updating settings",
        description: "Could not save your settings. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">General Settings</h1>
        <p className="text-muted-foreground">
          Manage your restaurant's general information.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Restaurant Details</CardTitle>
          <CardDescription>
            Update your restaurant's publicly visible details here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="restaurantName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Restaurant Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Restaurant's Name" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is the name that will be displayed on your online store and receipts.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="restaurantAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Restaurant Address</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="123 Main St, Anytown, USA"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your@email.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      This email will be used for notifications and customer inquiries.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}