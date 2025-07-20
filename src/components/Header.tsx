import { Fragment, useContext } from 'react';
import { FaUserCircle, FaSignOutAlt, FaUser, FaCog } from 'react-icons/fa';
import { Menu, Transition } from '@headlessui/react';
import { AuthContext } from '../context/AuthContextType';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  userName: string;
}

const Header = ({ userName }: HeaderProps) => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  
  const handleLogout = () => {
    auth.logout();
    navigate('/');
  };
  
  return (
    <header className="bg-[#E39E36] h-16 fixed top-0 right-0 left-64 z-10 flex justify-between items-center px-6 shadow-md">
      <div className="flex-1">
        <h2 className="text-lg font-bold text-[#011748]">SISTEMA DE FACTURACIÓN</h2>
      </div>
      
      <div className="flex items-center">
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center text-[#011748] hover:text-[#011748]/80 focus:outline-none">
            <div className="bg-white p-1 rounded-full shadow-sm border border-[#F8F8F8] mr-2">
              <FaUserCircle className="h-6 w-6 text-[#BA2E3B]" />
            </div>
            <span className="font-semibold">{userName}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden border border-[#F8F8F8]">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="#"
                      className={`${
                        active ? 'bg-[#F8F8F8]' : ''
                      } block px-4 py-2 text-sm text-[#011748] flex items-center`}
                    >
                      <FaUser className="mr-2 text-[#E39E36]" /> Mi Perfil
                    </a>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="#"
                      className={`${
                        active ? 'bg-[#F8F8F8]' : ''
                      } block px-4 py-2 text-sm text-[#011748] flex items-center`}
                    >
                      <FaCog className="mr-2 text-[#E39E36]" /> Configuración
                    </a>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={`${
                        active ? 'bg-[#BA2E3B] text-white' : 'text-[#BA2E3B]'
                      } block px-4 py-2 text-sm w-full text-left flex items-center`}
                    >
                      <FaSignOutAlt className="mr-2" /> Cerrar Sesión
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </header>
  );
};

export default Header;
