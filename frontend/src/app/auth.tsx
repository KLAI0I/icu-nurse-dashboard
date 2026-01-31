import React from "react";
import { api, setAccessToken } from "../lib/api";

type User = { id: string; email: string; role: "ADMIN" | "STAFF"; staffId?: string | null };
type AuthCtx = { user: User | null; login: (email: string, password: string) => Promise<void>; logout: () => Promise<void> };

const Ctx = React.createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);

  async function login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
  }

  async function logout() {
    await api.post("/auth/logout");
    setAccessToken(null);
    setUser(null);
  }

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("AuthProvider missing");
  return v;
}
