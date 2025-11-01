// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

type Role = "user" | "organizer" | "admin";

interface UserType {
  id?: string;
  _id?: string;
  name?: string;
  email: string;
  role?: Role;
  verified?: boolean;
}

interface AuthContextType {
  user: UserType | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
    role?: Role,
    organizationId?: string // we’ll treat orgName in the UI and pass it as orgId later if needed
  ) => Promise<{ error: string | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // helper to normalize backend error into string
  function extractErrorMessage(err: any): string {
    if (!err) return "Unknown error";

    // axios error?
    if (err.response && err.response.data) {
      const data = err.response.data;
      if (typeof data === "string") return data;
      if (data.message) return data.message;
    }

    if (typeof err.message === "string") return err.message;
    if (typeof err === "string") return err;
    return "Request failed";
  }

  // Load user (if token exists)
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await api.get("/auth/me"); // GET /api/auth/me
          setUser(res.data.user || null);
        } catch (err) {
          console.error("Failed to fetch /auth/me:", err);
          localStorage.removeItem("token");
          setUser(null);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  // SIGN UP
  // backend expects: { name, email, password, role, organizationId? }
  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
    role: Role = "user",
    organizationId?: string
  ) => {
    try {
      const payload: Record<string, any> = {
        name: fullName ?? "", // backend calls this "name"
        email,
        password,
        role,
      };

      // only send organizationId if we actually have something that looks like an ID
      if (role === "organizer" && organizationId) {
        payload.organizationId = organizationId;
      }

      await api.post("/auth/signup", payload);

      // we do NOT log them in yet. They must verify email, then login manually.
      return { error: null };
    } catch (err: any) {
      console.error("Signup error:", err);
      return { error: extractErrorMessage(err) };
    }
  };

  // SIGN IN
  // backend expects: { email, password }
  // backend returns: { token, user: { id, name, email, role } }
  const signIn = async (email: string, password: string) => {
    try {
      const res = await api.post("/auth/login", { email, password });

      const { token, user: loggedInUser } = res.data || {};

      if (token) {
        localStorage.setItem("token", token);
      } else {
        console.warn("No token received from /auth/login");
      }

      setUser(loggedInUser || null);

      // figure out where to send them
      const role = (loggedInUser?.role || "user") as Role;

      let redirectPath = "/";
      if (role === "organizer") redirectPath = "/dashboard";
      else if (role === "user") redirectPath = "/user-dashboard";
      else if (role === "admin") redirectPath = "/admin-dashboard";

      navigate(redirectPath, { replace: true });

      return { error: null };
    } catch (err: any) {
      console.error("Login error:", err);
      return { error: extractErrorMessage(err) };
    }
  };

  // SIGN OUT
  const signOut = async () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/role-auth", { replace: true });
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
