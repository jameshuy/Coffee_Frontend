import { useState, useCallback } from "react";
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
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useAsync } from "@/hooks/use-async";
import { ModalHeader, ModalActions } from "@/components/ui/modal-parts";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      toast({
        title: "Missing information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }
    return login(email, password);
  }, [email, password, login, toast, onOpenChange, setLocation]);

  const { execute } = useAsync(handleLogin, {
    onSuccess: (success) => {
      if (success) {
        onOpenChange(false);
        setEmail("");
        setPassword("");
        setLocation("/feed");
      } else {
        toast({
          title: "Login failed",
          description: "Invalid email or password. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[50%] translate-y-[-50%] w-[calc(100%-1rem)] max-w-[400px] sm:max-w-[425px] bg-black border-[#f1b917] text-white">
        <ModalHeader title="Welcome Back" description="" />

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="login-email" className="text-right text-white">
              Email
            </Label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3 bg-gray-900 border-gray-700 text-white"
              placeholder="Enter your email"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="login-password" className="text-right text-white">
              Password
            </Label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="col-span-3 bg-gray-900 border-gray-700 text-white"
              placeholder="Enter your password"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex justify-center">
            <Button
              variant="primary"
              onClick={() => execute()}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <span>Don't have an account?</span>
            <Button
              variant="link"
              className="text-[#f1b917] hover:text-[#f1b917]/90 p-0 h-auto font-medium"
              onClick={() => {
                onOpenChange(false);
                // Dispatch event to open signup modal
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('openSignupModal'));
                }, 100);
              }}
            >
              Sign up
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}