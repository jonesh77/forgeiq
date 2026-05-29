"use client";

import { createContext, useContext, ReactNode } from "react";

// Define the shape of the user (adjust fields as needed)
type User = {
  id: string;
  name: string;
  email: string;
  isSignedIn: boolean;
} | null;

// Context type
type UserContextType = User;

// Create the context with a default value
const UserContext = createContext<UserContextType>(null);

type ProvideUserProps = {
  user: User;
  children: ReactNode;
};

// Provider component
export function ProvideUser({ user, children }: ProvideUserProps) {
  return (
    <UserContext.Provider value={user}>
      {children}
    </UserContext.Provider>
  );
}

// Hook to use user context
export function useUser() {
  const user = useContext(UserContext);

  if (user === undefined) {
    throw new Error("useUser must be used within a ProvideUser");
  }

  return user;
}


