import React, { createContext, useContext, useEffect, useState } from 'react';

// Define the shape of the context data
interface AuthContextData {
  signIn: () => void;
  signOut: () => void;
  session?: string | null;
  isLoading: boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// Custom hook to use the AuthContext
export function useSession() {
  const value = useContext(AuthContext);
  if (process.env.NODE_ENV !== 'production') {
    if (!value) {
      throw new Error('useSession must be wrapped in a <SessionProvider />');
    }
  }
  return value;
}

// Provider component that wraps the app and makes auth data available
export function SessionProvider(props: { children: React.ReactNode }) {
  const [session, setSession] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, you'd fetch the session from secure storage
    // For now, we'll just simulate a loading state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const authContextValue = {
    signIn: () => {
      // In a real app, you'd perform a login and store the session
      setSession('sample-session-token');
    },
    signOut: () => {
      setSession(null);
    },
    session,
    isLoading,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {props.children}
    </AuthContext.Provider>
  );
} 