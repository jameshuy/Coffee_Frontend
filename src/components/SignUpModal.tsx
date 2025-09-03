import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Check, X, UserCheck, LockKeyhole } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAsync } from "@/hooks/use-async";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ModalHeader, ModalActions } from "@/components/ui/modal-parts";

interface SignUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignUpModal({ open, onOpenChange }: SignUpModalProps) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [step, setStep] = useState<"form" | "verification">("form");
  const [verificationCode, setVerificationCode] = useState("");
  const { toast } = useToast();
  const { login } = useAuth();

  // Check username availability
  const checkUsernameAvailability = useCallback(async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 5) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const response = await apiRequest("GET", `/api/auth/check-username?username=${encodeURIComponent(usernameToCheck)}`);
      if (response.ok) {
        const data = await response.json();
        setUsernameAvailable(data.available);
      } else {
        setUsernameAvailable(null);
      }
    } catch (error) {
      console.error("Error checking username availability:", error);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  }, []);

  // Debounced username checking
  const debouncedUsername = useDebouncedValue(username, 500);
  useEffect(() => {
    if (debouncedUsername.length >= 5 && debouncedUsername.length <= 20) {
      checkUsernameAvailability(debouncedUsername);
    } else {
      setUsernameAvailable(null);
    }
  }, [debouncedUsername, checkUsernameAvailability]);

  // Reset username availability when username changes significantly
  useEffect(() => {
    if (username.length < 5 || username.length > 20) {
      setUsernameAvailable(null);
    }
  }, [username]);

  const handleSendVerification = useCallback(async () => {
    if (!email || !username || !password || !confirmPassword) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (usernameAvailable === false) {
      toast({
        title: "Username not available",
        description: "Please choose a different username.",
        variant: "destructive",
      });
      return;
    }

    const response = await apiRequest("POST", "/api/send-verification", { email });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to send verification email");
    }
    console.log(response)
    return response;
  }, [email, username, password, confirmPassword, toast, usernameAvailable]);

  const sendVerificationAsync = useAsync(handleSendVerification, {
    onSuccess: async () => {
      toast({
        title: "Verification code sent",
        description: "Please check your email for the verification code.",
        variant: "default",
      });
      setStep("verification");
    },
    onError: (error) => {
      console.error("Verification email error:", error);
      toast({
        title: "Failed to send verification",
        description: error instanceof Error ? error.message : "An error occurred sending the verification code",
        variant: "destructive",
      });
    },
  });

  const handleVerifyAndRegister = useCallback(async () => {
    console.log("handleVerifyAndRegister")
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }
    // First verify the email
    const verifyResponse = await apiRequest("POST", "/api/verify-email", {
      email,
      code: verificationCode,
    });
    console.log(verifyResponse)
    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json();
      throw new Error(errorData.message || "Invalid verification code");
    }
    // Then create the account
    const response = await apiRequest("POST", "/api/auth/register", {
      email,
      username,
      password,
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create account");
    }
    return true;
  }, [verificationCode, email, username, password, toast]);

  const verifyAndRegisterAsync = useAsync(handleVerifyAndRegister, {
    onSuccess: async () => {
      const loginSuccess = await login(email, password);
      if (loginSuccess) {
        onOpenChange(false);
        setEmail("");
        setUsername("");
        setPassword("");
        setConfirmPassword("");
        setUsernameAvailable(null);
        window.dispatchEvent(new CustomEvent('showWelcomeModal'));
      } else {
        toast({
          title: "Account created",
          description: "Please log in with your new credentials.",
          variant: "default",
        });
        onOpenChange(false);
      }
    },
    onError: (error) => {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An error occurred during registration",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-black border-[#f1b917] text-white">
        <ModalHeader 
          title={step === "verification" ? "Verify Your Email" : "Sign Up"}
          description={step === "verification" ? `We've sent a 6-digit verification code to ${email}. Please check your inbox and enter the code below:` : ""}
        />

        {step === "form" ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right text-white">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3 bg-gray-900 border-gray-700 text-white"
                placeholder="Enter your email"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right text-white">
                Username
              </Label>
              <div className="col-span-3 relative">
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
                    setUsername(value);
                  }}
                  placeholder="Enter username (5-20 characters)"
                  className={`bg-gray-900 border-gray-700 text-white pr-8 ${
                    username.length >= 5 && username.length <= 20
                      ? usernameAvailable === true
                        ? 'border-green-500'
                        : usernameAvailable === false
                        ? 'border-red-500'
                        : 'border-yellow-500'
                      : username.length > 0
                      ? 'border-red-500'
                      : ''
                  }`}
                />
                {username.length >= 5 && username.length <= 20 && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    {checkingUsername ? (
                      <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                    ) : usernameAvailable === true ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : usernameAvailable === false ? (
                      <X className="h-4 w-4 text-red-500" />
                    ) : null}
                  </div>
                )}
              </div>
            </div>
            {username.length > 0 && username.length < 5 && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div></div>
                <div className="col-span-3 text-red-400 text-sm">
                  Username must be at least 5 characters
                </div>
              </div>
            )}
            {username.length > 20 && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div></div>
                <div className="col-span-3 text-red-400 text-sm">
                  Username must be 20 characters or less
                </div>
              </div>
            )}
            {usernameAvailable === false && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div></div>
                <div className="col-span-3 text-red-400 text-sm">
                  Username is already taken
                </div>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right text-white">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="col-span-3 bg-gray-900 border-gray-700 text-white"
                placeholder="Enter password (min 8 characters)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="confirmPassword" className="text-right text-white">
                Confirm
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="col-span-3 bg-gray-900 border-gray-700 text-white"
                placeholder="Confirm password"
              />
            </div>
            {password && confirmPassword && password !== confirmPassword && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div></div>
                <div className="col-span-3 text-red-400 text-sm">
                  Passwords don't match
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="verificationCode" className="block text-sm font-medium text-gray-300 mb-1">
                  Verification Code
                </Label>
                <input
                  type="text"
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f1b917] text-white tracking-widest text-xl text-center"
                  disabled={isLoading}
                  required
                />
              </div>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleSendVerification}
                  disabled={isLoading}
                  className="text-[#f1b917] hover:text-white text-sm underline"
                >
                  Resend code
                </button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:justify-center mt-4">
          {step === "form" ? (
            <>
              <Button
                variant="outline_white"
                onClick={() => onOpenChange(false)}
                disabled={sendVerificationAsync.isLoading}
              >
                Cancel
              </Button>
              <Button 
                variant="primary"
                onClick={() => sendVerificationAsync.execute()} 
                disabled={sendVerificationAsync.isLoading}
              >
                {sendVerificationAsync.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <LockKeyhole className="mr-2 h-4 w-4" />
                    Sign Up
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline_white"
                onClick={() => setStep("form")}
              >
                Back
              </Button>
              <Button 
                variant="primary"
                onClick={() => verifyAndRegisterAsync.execute()}
                disabled={verifyAndRegisterAsync.isLoading || verificationCode.length !== 6}
              >
                {verifyAndRegisterAsync.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}