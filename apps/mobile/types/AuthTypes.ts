export type User = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: "google" | "email";
};

export type AuthState = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasSeenIntro: boolean;
};

export type AuthContextType = {
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  markIntroAsSeen: () => Promise<void>;
} & AuthState;
