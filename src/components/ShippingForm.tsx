import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { trackCheckoutStep, trackEvent } from "@/lib/analytics";

// Enhanced shipping form validation schema with realistic requirements
const shippingFormSchema = z.object({
  firstName: z.string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "First name can only contain letters, spaces, hyphens, and apostrophes"),
  lastName: z.string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes"),
  email: z.string().email("Please enter a valid email address"),
  address: z.string()
    .min(10, "Address must be at least 10 characters")
    .max(200, "Address must be less than 200 characters")
    .regex(/^[a-zA-Z0-9\s,.'#-]+$/, "Address contains invalid characters"),
  city: z.string()
    .min(2, "City must be at least 2 characters")
    .max(100, "City must be less than 100 characters")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "City can only contain letters, spaces, hyphens, and apostrophes"),
  state: z.string()
    .min(2, "State/Province must be at least 2 characters")
    .max(100, "State/Province must be less than 100 characters")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "State/Province can only contain letters, spaces, hyphens, and apostrophes"),
  zipCode: z.string()
    .min(3, "Zip/Postal code must be at least 3 characters")
    .max(12, "Zip/Postal code must be less than 12 characters")
    .regex(/^[a-zA-Z0-9\s-]+$/, "Zip/Postal code format is invalid"),
  country: z.string().min(2, "Please select a country"),
});

type ShippingFormValues = z.infer<typeof shippingFormSchema>;

interface ShippingFormProps {
  imageDataUrl?: string; // Make this optional for cart checkout
  onSubmit?: (data: ShippingFormValues) => void; // Add onSubmit for compatibility
  onSuccess?: (data: ShippingFormValues) => void; // Make this optional
  hideSubmitButton?: boolean;
  isProcessing?: boolean; // Add isProcessing prop for handling loading state
}

export default function ShippingForm({ 
  imageDataUrl, 
  onSuccess, 
  onSubmit,
  hideSubmitButton = false,
  isProcessing = false 
}: ShippingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
  });

  // Form submission handler
  const onFormSubmit = form.handleSubmit((data: ShippingFormValues) => {
    setIsSubmitting(true);
    
    // Just validate the form and notify parent component
    try {
      // Track shipping information completion (step 1 in checkout flow)
      trackCheckoutStep(1, 'shipping_info_completed');
      trackEvent('Checkout', 'shipping_completed', data.country);
      
      // Use the appropriate callback based on what was provided
      if (onSubmit) {
        onSubmit(data);
      } else if (onSuccess) {
        onSuccess(data);
      }
      // No toast notification needed for successful validation
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onFormSubmit} className="w-full space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">First Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Last Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Address</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">City</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">State/Province</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="zipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Zip/Postal Code</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Country</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="AT">Austria</SelectItem>
                  <SelectItem value="BE">Belgium</SelectItem>
                  <SelectItem value="BG">Bulgaria</SelectItem>
                  <SelectItem value="HR">Croatia</SelectItem>
                  <SelectItem value="CY">Cyprus</SelectItem>
                  <SelectItem value="CZ">Czech Republic</SelectItem>
                  <SelectItem value="DK">Denmark</SelectItem>
                  <SelectItem value="EE">Estonia</SelectItem>
                  <SelectItem value="FI">Finland</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="GR">Greece</SelectItem>
                  <SelectItem value="HU">Hungary</SelectItem>
                  <SelectItem value="IS">Iceland</SelectItem>
                  <SelectItem value="IE">Ireland</SelectItem>
                  <SelectItem value="IT">Italy</SelectItem>
                  <SelectItem value="LV">Latvia</SelectItem>
                  <SelectItem value="LI">Liechtenstein</SelectItem>
                  <SelectItem value="LT">Lithuania</SelectItem>
                  <SelectItem value="LU">Luxembourg</SelectItem>
                  <SelectItem value="MT">Malta</SelectItem>
                  <SelectItem value="NL">Netherlands</SelectItem>
                  <SelectItem value="NO">Norway</SelectItem>
                  <SelectItem value="PL">Poland</SelectItem>
                  <SelectItem value="PT">Portugal</SelectItem>
                  <SelectItem value="RO">Romania</SelectItem>
                  <SelectItem value="SK">Slovakia</SelectItem>
                  <SelectItem value="SI">Slovenia</SelectItem>
                  <SelectItem value="ES">Spain</SelectItem>
                  <SelectItem value="SE">Sweden</SelectItem>
                  <SelectItem value="CH">Switzerland</SelectItem>
                  <SelectItem value="UK">United Kingdom</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Hidden submit button that can be triggered externally */}
        <button 
          type="submit" 
          className="hidden" 
          id="shipping-form-submit"
          aria-hidden="true"
        />
        
        {!hideSubmitButton && (
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full px-6 py-3 bg-white text-black rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 text-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Proceed to Payment"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
