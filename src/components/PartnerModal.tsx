import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PartnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PartnerModal({ open, onOpenChange }: PartnerModalProps) {
  const [name, setName] = useState("");
  const [cafeName, setCafeName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!name || !cafeName || !email || !location || !address) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/partner-inquiry', {
        name,
        cafeName,
        email,
        location,
        address
      });

      if (response.ok) {
        toast({
          title: "Thank you for your interest!",
          description: "We'll get back to you within 24 hours to discuss the partnership opportunity.",
          variant: "default",
        });

        // Reset form and close modal
        setName("");
        setCafeName("");
        setEmail("");
        setLocation("");
        setAddress("");
        onOpenChange(false);
      } else {
        toast({
          title: "Submission failed",
          description: "Something went wrong. Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Partner inquiry error:", error);
      toast({
        title: "Submission failed",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] top-[50%] translate-y-[-50%] sm:max-w-[425px] bg-black border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-center font-racing text-2xl text-white pt-4" style={{ fontFamily: "'Racing Sans One', cursive" }}>
            Partner with us and boost your margins
          </DialogTitle>
          <DialogDescription className="text-center text-white">
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="partner-name" className="text-right text-white">
              Your name
            </Label>
            <Input
              id="partner-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3 bg-gray-900 border-gray-700 text-white"
              placeholder="Enter your name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cafe-name" className="text-right text-white">
              Your Café name
            </Label>
            <Input
              id="cafe-name"
              type="text"
              value={cafeName}
              onChange={(e) => setCafeName(e.target.value)}
              className="col-span-3 bg-gray-900 border-gray-700 text-white"
              placeholder="Enter your café name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="partner-email" className="text-right text-white">
              Your email
            </Label>
            <Input
              id="partner-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3 bg-gray-900 border-gray-700 text-white"
              placeholder="Enter your email"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cafe-location" className="text-right text-white">
              Your Café location
            </Label>
            <Input
              id="cafe-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="col-span-3 bg-gray-900 border-gray-700 text-white"
              placeholder="Enter your café location"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cafe-address" className="text-right text-white">
              Café address
            </Label>
            <Input
              id="cafe-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="col-span-3 bg-gray-900 border-gray-700 text-white"
              placeholder="Full address for package delivery"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex justify-center">
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-white text-black rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Send"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}