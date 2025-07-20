import { createContext } from 'react';

export interface User {
  id: number;
  username: string;
  role: string;
  nombre: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Creamos el contexto con un valor inicial undefined
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => false,
  logout: () => {}
});
