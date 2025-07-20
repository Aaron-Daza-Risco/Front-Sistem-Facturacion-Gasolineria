import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './AuthContextType';
import type { User } from './AuthContextType';
import { authService } from '../api/apiService';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Verificar si hay un usuario almacenado en sessionStorage al cargar
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await authService.login(username, password);
      
      if (response.error || !response.data) {
        throw new Error(response.error || 'Error en la autenticación');
      }

      const data = response.data;
      
      // Mapear los datos recibidos del backend al formato que espera el frontend
      const userData: User = {
        id: data.id_usuario,
        username: data.nombre_usuario,
        role: data.role,
        nombre: data.nombre_completo
      };
      
      setUser(userData);
      setIsAuthenticated(true);
      // Guardar en sessionStorage para persistir durante la sesión
      sessionStorage.setItem('user', JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
