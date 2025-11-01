// src/pages/RoleBasedAuth.tsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useToast } from "../hooks/use-toast";
import { PasswordInput } from "../components/ui/password-input";
import CaptchaWrapper, {
  CaptchaWrapperRef,
} from "../components/CaptchaWrapper";
import { Building2, Users } from "lucide-react";

const RoleBasedAuth: React.FC = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);

  const [signInCaptcha, setSignInCaptcha] = useState<string | null>(null);
  const [signUpCaptcha, setSignUpCaptcha] = useState<string | null>(null);

  const signInCaptchaRef = useRef<CaptchaWrapperRef>(null);
  const signUpCaptchaRef = useRef<CaptchaWrapperRef>(null);

  // If already logged in, bounce to dashboard/home.
  useEffect(() => {
    if (user && !loading) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  // --------------------------
  // Local form state
  // --------------------------
  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
  });

  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "user" as "user" | "organizer",
    orgName: "",
  });

  // --------------------------
  // SIGN IN
  // --------------------------
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signInCaptcha) {
      toast({
        title: "CAPTCHA Required",
        description: "Please complete the CAPTCHA verification.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signIn(signInData.email, signInData.password);

      if (error) {
        const message =
          typeof error === "string"
            ? error
            : (error as any)?.message || "Sign in failed";

        signInCaptchaRef.current?.reset();
        setSignInCaptcha(null);

        toast({
          title: "Sign in failed",
          description: message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        });
        // AuthContext can redirect by role, or we can navigate here:
        // navigate('/');
      }
    } catch (err: any) {
      signInCaptchaRef.current?.reset();
      setSignInCaptcha(null);

      toast({
        title: "Error",
        description: err?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------
  // SIGN UP
  // --------------------------
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signUpCaptcha) {
      toast({
        title: "CAPTCHA Required",
        description: "Please complete the CAPTCHA verification.",
        variant: "destructive",
      });
      return;
    }

    if (signUpData.role === "organizer" && !signUpData.orgName.trim()) {
      toast({
        title: "Organization Name Required",
        description: "Please enter your organization / brand name.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Note: We don't have a real organizationId yet, so we pass undefined.
      const { error } = await signUp(
        signUpData.email,
        signUpData.password,
        signUpData.fullName,
        signUpData.role,
        undefined
      );

      if (error) {
        const message =
          typeof error === "string"
            ? error
            : (error as any)?.message || "Sign up failed";

        signUpCaptchaRef.current?.reset();
        setSignUpCaptcha(null);

        toast({
          title: "Sign up failed",
          description: message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account created!",
          description:
            "Please check your email and verify your account before signing in.",
        });

        // success: reset form
        setSignUpData({
          email: "",
          password: "",
          fullName: "",
          role: "user",
          orgName: "",
        });

        signUpCaptchaRef.current?.reset();
        setSignUpCaptcha(null);
      }
    } catch (err: any) {
      signUpCaptchaRef.current?.reset();
      setSignUpCaptcha(null);

      toast({
        title: "Error",
        description: err?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------
  // LOADING
  // --------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // --------------------------
  // RENDER
  // --------------------------
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card
        className="w-full max-w-md shadow-lg border-0"
        style={{ boxShadow: "var(--shadow-elegant)" }}
      >
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Welcome to Zevo
          </CardTitle>
          <CardDescription>
            Join the ultimate event management platform
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* SIGN IN TAB */}
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="Enter your email"
                    value={signInData.email}
                    onChange={(e) =>
                      setSignInData({
                        ...signInData,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={signInData.password}
                    onChange={(e) =>
                      setSignInData({
                        ...signInData,
                        password: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="flex justify-center">
                  <CaptchaWrapper
                    onVerify={setSignInCaptcha}
                    ref={signInCaptchaRef}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !signInCaptcha}
                  style={{
                    background: "var(--gradient-primary)",
                    transition: "var(--transition-smooth)",
                  }}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            {/* SIGN UP TAB */}
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                {/* ROLE PICKER */}
                <div className="space-y-2">
                  <Label htmlFor="signup-role">Account Type</Label>
                  <Select
                    value={signUpData.role}
                    onValueChange={(value: "user" | "organizer") =>
                      setSignUpData({ ...signUpData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          User (Attendee / Participant)
                        </div>
                      </SelectItem>
                      <SelectItem value="organizer">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Event Organizer
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* FULL NAME */}
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={signUpData.fullName}
                    onChange={(e) =>
                      setSignUpData({
                        ...signUpData,
                        fullName: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                {/* ORG NAME (organizer only) */}
                {signUpData.role === "organizer" && (
                  <div className="space-y-2">
                    <Label htmlFor="signup-org">
                      Organization / Brand Name
                    </Label>
                    <Input
                      id="signup-org"
                      type="text"
                      placeholder="Your event brand / org"
                      value={signUpData.orgName}
                      onChange={(e) =>
                        setSignUpData({
                          ...signUpData,
                          orgName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                )}

                {/* EMAIL */}
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={signUpData.email}
                    onChange={(e) =>
                      setSignUpData({
                        ...signUpData,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                {/* PASSWORD */}
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <PasswordInput
                    id="signup-password"
                    placeholder="Create a password"
                    value={signUpData.password}
                    onChange={(e) =>
                      setSignUpData({
                        ...signUpData,
                        password: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="flex justify-center">
                  <CaptchaWrapper
                    onVerify={setSignUpCaptcha}
                    ref={signUpCaptchaRef}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !signUpCaptcha}
                  style={{
                    background: "var(--gradient-primary)",
                    transition: "var(--transition-smooth)",
                  }}
                >
                  {isLoading
                    ? "Creating account..."
                    : signUpData.role === "organizer"
                    ? "Create Organizer Account"
                    : "Create User Account"}
                </Button>

                <div className="text-center text-xs text-muted-foreground">
                  After signup, you'll get a verification email. You must verify
                  before you can sign in.
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleBasedAuth;
