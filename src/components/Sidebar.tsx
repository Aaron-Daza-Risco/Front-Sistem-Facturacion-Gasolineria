import { useContext } from 'react';
import { FaGasPump, FaClipboardList, FaUsers, FaSignOutAlt, FaChartLine } from 'react-icons/fa';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContextType';
import logoGrifo from '../assets/images/repsol-209.jpg';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  
  const isActive = (path: string) => {
    return location.pathname === path ? 
      'bg-[#BA2E3B] text-white' : 
      'text-white hover:bg-[#011748]/70 hover:text-white';
  };
  
  const handleLogout = () => {
    auth.logout();
    navigate('/');
  };

  return (
    <div className="bg-[#011748] text-white w-64 h-screen fixed left-0 top-0 flex flex-col shadow-lg">
      <div className="p-5 border-b border-[#011748]/30">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-white p-2 rounded-lg shadow-md border-2 border-[#E39E36]">
            <img 
              src={logoGrifo} 
              alt="Logo Estación" 
              className="h-14 w-auto object-contain"
            />
          </div>
        </div>
        <h2 className="text-xl font-bold text-center text-white">Estación de Servicio</h2>
        <p className="text-sm text-center text-[#E39E36] mt-1">Sistema de Gestión y Facturación</p>
      </div>
      
      <nav className="flex-1 py-4 overflow-y-auto">
        <p className="px-4 text-xs font-semibold text-[#E39E36] uppercase tracking-wider mb-2">Reportes</p>
        <Link to="/dashboard/reportes" className={`flex items-center px-4 py-3 ${isActive('/dashboard/reportes') || location.pathname === '/dashboard' ? 'bg-[#BA2E3B] text-white' : 'text-white hover:bg-[#011748]/70 hover:text-white'}`}>
          <FaChartLine className="mr-3" /> Resumen de Ventas
        </Link>
        
        <p className="px-4 text-xs font-semibold text-[#E39E36] uppercase tracking-wider mt-6 mb-2">Ventas</p>
        <Link to="/dashboard/ventas/nueva" className={`flex items-center px-4 py-3 ${isActive('/dashboard/ventas/nueva')}`}>
          <FaGasPump className="mr-3" /> Nueva Venta
        </Link>
        <Link to="/dashboard/ventas/lista" className={`flex items-center px-4 py-3 ${isActive('/dashboard/ventas/lista')}`}>
          <FaClipboardList className="mr-3" /> Historial de Ventas
        </Link>
        
        <p className="px-4 text-xs font-semibold text-[#E39E36] uppercase tracking-wider mt-6 mb-2">Gestión</p>
        <Link to="/dashboard/combustibles" className={`flex items-center px-4 py-3 ${isActive('/dashboard/combustibles')}`}>
          <FaGasPump className="mr-3" /> Combustibles
        </Link>
        <Link to="/dashboard/clientes" className={`flex items-center px-4 py-3 ${isActive('/dashboard/clientes')}`}>
          <FaUsers className="mr-3" /> Clientes
        </Link>
      </nav>
      
      <div className="p-4 border-t border-[#011748]/30">
        <button 
          onClick={handleLogout}
          className="flex items-center w-full py-2 px-4 rounded-lg transition-colors text-white bg-[#BA2E3B]/80 hover:bg-[#BA2E3B]"
        >
          <FaSignOutAlt className="mr-3" /> Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
