import { useContext } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContextType';

const DashboardLayout = () => {
  const auth = useContext(AuthContext);
  const userName = auth.user?.nombre || "Usuario";
  
  return (
    <div className="flex h-screen bg-[#F8F8F8]">
      <Sidebar />
      
      <div className="flex-1 ml-64 flex flex-col">
        <Header userName={userName} />
        
        <main className="flex-1 overflow-y-auto p-6 pt-24">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
