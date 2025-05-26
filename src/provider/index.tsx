import { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";

export function Provider({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
