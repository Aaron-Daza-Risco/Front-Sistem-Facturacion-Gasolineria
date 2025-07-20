import { useState, useEffect, useContext } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AuthContext } from './context/AuthContextType';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import NuevaVenta from './pages/NuevaVenta';
import VentasLista from './pages/VentasLista';
import Clientes from './pages/Clientes';
import Combustibles from './pages/Combustibles';
import Reportes from './pages/Reportes';
import ErrorBoundary from './components/ErrorBoundary';
import logoGrifo from './assets/images/repsol-209.jpg'; // Asegúrate de que la ruta sea correcta
// Componente de Login
const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  useEffect(() => {
    // Si ya está autenticado, redirigir al dashboard de reportes
    if (auth.isAuthenticated) {
      navigate('/dashboard/reportes');
    }
  }, [auth.isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: { username: string; password: string }) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const success = await auth.login(formData.username, formData.password);
      
      if (success) {
        navigate('/dashboard/reportes');
      } else {
        setError('Usuario o contraseña incorrectos');
      }
    } catch (error) {
      setError('Error al iniciar sesión');
      console.error('Error de login:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8F8F8] p-4">
      {/* Contenedor principal con estilo de ventana de aplicación de escritorio */}
      <div className="w-full max-w-4xl flex overflow-hidden bg-white rounded-xl shadow-2xl" style={{ maxHeight: '85vh' }}>
        {/* Panel lateral con imagen y logo */}
        <div className="hidden md:block w-2/5 bg-[#011748] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#011748]/90 to-[#BA2E3B]/90 z-10"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-8">
            <div className="bg-white p-4 rounded-lg shadow-2xl mb-8 border-4 border-[#E39E36]">
              <img 
                src={logoGrifo} 
                alt="Logo Estación de Servicio" 
                className="h-24 w-auto object-contain"
              />
            </div>
            <h2 className="text-3xl font-bold text-white text-center mb-4">Estación de Servicio</h2>
            <div className="h-1 w-20 bg-[#E39E36] mb-4"></div>
            <p className="text-white text-lg text-center">Sistema de Gestión y Facturación</p>
          </div>
        </div>
        
        {/* Panel de formulario */}
        <div className="w-full md:w-3/5 bg-white p-0">
          {/* Barra de título estilo aplicación de escritorio */}
          <div className="bg-[#E39E36] py-3 px-6 flex items-center justify-between shadow-md">
            <div className="flex items-center">
              <div className="md:hidden mr-3">
                <img 
                  src={logoGrifo} 
                  alt="Logo" 
                  className="h-7 w-auto object-contain"
                />
              </div>
              <h2 className="text-lg font-bold text-[#011748]">SISTEMA DE FACTURACIÓN</h2>
            </div>
            <div className="flex space-x-2">
              <span className="h-3 w-3 rounded-full bg-[#F8F8F8]"></span>
              <span className="h-3 w-3 rounded-full bg-[#BA2E3B]"></span>
              <span className="h-3 w-3 rounded-full bg-[#011748]"></span>
            </div>
          </div>
          
          <div className="px-8 py-12 md:px-12">
            <div className="mb-8 text-center md:text-left">
              <h3 className="text-2xl font-bold text-[#011748]">Iniciar Sesión</h3>
              <p className="text-gray-500 mt-2">Ingrese sus credenciales para acceder al sistema</p>
            </div>
            
            {error && (
              <div className="bg-[#F8F8F8] border-l-4 border-[#BA2E3B] text-[#BA2E3B] p-4 rounded-r mb-6 shadow-sm">
                <div className="flex">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p>{error}</p>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[#011748] font-semibold mb-2" htmlFor="username">
                  Usuario
                </label>
                <div className="relative bg-[#F8F8F8] rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#E39E36]" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input 
                    id="username"
                    name="username"
                    type="text" 
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-transparent border-0 focus:outline-none focus:ring-0"
                    placeholder="Ingrese su nombre de usuario"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[#011748] font-semibold mb-2" htmlFor="password">
                  Contraseña
                </label>
                <div className="relative bg-[#F8F8F8] rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#E39E36]" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input 
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-transparent border-0 focus:outline-none focus:ring-0"
                    placeholder="Ingrese su contraseña"
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input 
                    id="remember"
                    type="checkbox"
                    className="h-4 w-4 text-[#E39E36] focus:ring-[#E39E36] border-gray-300 rounded"
                  />
                  <label htmlFor="remember" className="ml-2 block text-sm text-gray-600">
                    Recordar sesión
                  </label>
                </div>
                
                <div>
                  <a href="#" className="text-sm font-medium text-[#BA2E3B] hover:text-[#E39E36] transition-colors">
                    ¿Olvidó su contraseña?
                  </a>
                </div>
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 text-white font-semibold rounded-lg shadow-lg transition transform hover:translate-y-[-2px] 
                    ${loading ? 'bg-[#BA2E3B]/70' : 'bg-[#BA2E3B]'}
                  `}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Iniciando...
                    </span>
                  ) : 'Iniciar Sesión'}
                </button>
              </div>
            </form>
            
            {/* Pie de página con información de la aplicación */}
            <div className="mt-12 pt-6 border-t border-gray-200 flex flex-col items-center">
              <div className="flex items-center mb-2">
                <span className="text-[#011748] text-sm font-semibold">© 2025 Estación de Servicio</span>
              </div>
              <div className="flex space-x-4">
                <div className="h-2 w-2 rounded-full bg-[#011748]"></div>
                <div className="h-2 w-2 rounded-full bg-[#E39E36]"></div>
                <div className="h-2 w-2 rounded-full bg-[#BA2E3B]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente ProtectedRoute para rutas que requieren autenticación
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const auth = useContext(AuthContext);
  
  if (!auth.isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          
          {/* Rutas protegidas */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={
              <ErrorBoundary>
                <Reportes />
              </ErrorBoundary>
            } />
   
            <Route path="ventas/nueva" element={<NuevaVenta />} />
            <Route path="ventas/lista" element={
              <ErrorBoundary>
                <VentasLista />
              </ErrorBoundary>
            } />
            <Route path="clientes" element={<Clientes />} />
            <Route path="combustibles" element={<Combustibles />} />
            <Route path="reportes" element={
              <ErrorBoundary>
                <Reportes />
              </ErrorBoundary>
            } />
            {/* Redirección por defecto a reportes */}
            <Route path="*" element={<Navigate to="/dashboard/reportes" replace />} />
          </Route>
          
          {/* Redirección por defecto a la página de login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
