"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Role = "SUBMITTER" | "REVIEWER" | "DECISION_MAKER";

export const ROLE_LABELS: Record<Role, string> = {
  SUBMITTER: "Submitter (Employee)",
  REVIEWER: "Reviewer / Portfolio Owner",
  DECISION_MAKER: "Decision-Maker",
};

interface RoleState {
  role: Role;
  name: string;
  setRole: (r: Role) => void;
  setName: (n: string) => void;
}

const RoleContext = createContext<RoleState | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("SUBMITTER");
  const [name, setName] = useState<string>("Alex Demo");

  useEffect(() => {
    try {
      const storedRole = window.localStorage.getItem("roi-align-role") as Role | null;
      const storedName = window.localStorage.getItem("roi-align-name");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of persisted role on mount
      if (storedRole) setRole(storedRole);
      if (storedName) setName(storedName);
    } catch {
      // ignore - localStorage unavailable
    }
  }, []);

  function updateRole(r: Role) {
    setRole(r);
    try {
      window.localStorage.setItem("roi-align-role", r);
    } catch {
      // ignore
    }
  }

  function updateName(n: string) {
    setName(n);
    try {
      window.localStorage.setItem("roi-align-name", n);
    } catch {
      // ignore
    }
  }

  return (
    <RoleContext.Provider value={{ role, name, setRole: updateRole, setName: updateName }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
