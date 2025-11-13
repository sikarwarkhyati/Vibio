// src/pages/Auth.tsx
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useToast } from "../hooks/use-toast";
import { PasswordInput } from "../components/ui/password-input";
import CaptchaWrapper, {
  CaptchaWrapperRef,
} from "../components/CaptchaWrapper";

const Auth: React.FC = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);

  const [signInCaptcha, setSignInCaptcha] = useState<string | null>(null);
  const [signUpCaptcha, setSignUpCaptcha] = useState<string | null>(null);

  const signInCaptchaRef = useRef<CaptchaWrapperRef>(null);
  const signUpCaptchaRef = useRef<CaptchaWrapperRef>(null);

  // If already logged in, go home.
  // (Do NOT auto-navigate to /role-auth here, because this page itself IS an auth page.)
  useEffect(() => {
    if (user && !loading) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
  });

  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    fullName: "",
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
        return;
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });

      navigate("/");
    } catch (err: any) {
      signInCaptchaRef.current?.reset();
      setSignInCaptcha(null);

      toast({
        title: "Sign in failed",
        description: err?.message || "Unexpected error",
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

    setIsLoading(true);

    try {
      // call signUp with the correct positional params
      const { error, approvalPending, message } = await signUp(
        signUpData.email,
        signUpData.password,
        signUpData.fullName,
        "user", // default role here in simple Auth screen
        undefined, // no orgId in this basic screen
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

        return;
      }

      toast({
        title: approvalPending
          ? "Account created — pending approval by superadmin."
          : "Account created!",
        description:
          message ||
          (approvalPending
            ? "Please verify your email. You will be notified once approved."
            : "Please verify your email before signing in."),
      });

      // Optionally clear form
      setSignUpData({
        email: "",
        password: "",
        fullName: "",
      });

      signUpCaptchaRef.current?.reset();
      setSignUpCaptcha(null);
    } catch (err: any) {
      signUpCaptchaRef.current?.reset();
      setSignUpCaptcha(null);

      toast({
        title: "Sign up failed",
        description: err?.message || "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------
  // LOADING SCREEN
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
            Welcome to Vibio
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
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
