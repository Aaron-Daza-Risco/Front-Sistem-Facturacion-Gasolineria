import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaSearch, FaUserPlus, FaSave, FaTimes, FaSpinner } from 'react-icons/fa';
import type { Cliente } from '../types/venta';
import * as clienteApi from '../api/clienteApi';

interface ClienteModalProps {
  cliente: Cliente | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (cliente: Cliente) => void;
  isLoading: boolean;
}

const ClienteModal: React.FC<ClienteModalProps> = ({ cliente, isOpen, onClose, onSave, isLoading }) => {
  const [formData, setFormData] = useState<Cliente>({
    dni: '',
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    celular: '',
    direccion: ''
  });

  useEffect(() => {
    if (cliente) {
      setFormData({
        ...cliente
      });
    } else {
      setFormData({
        dni: '',
        nombre: '',
        apellido_paterno: '',
        apellido_materno: '',
        celular: '',
        direccion: ''
      });
    }
  }, [cliente]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#011748]">
            {cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
            <input
              type="text"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#011748]"
              required
              maxLength={8}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#011748]"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Paterno</label>
            <input
              type="text"
              name="apellido_paterno"
              value={formData.apellido_paterno}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#011748]"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Materno</label>
            <input
              type="text"
              name="apellido_materno"
              value={formData.apellido_materno}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#011748]"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
            <input
              type="text"
              name="celular"
              value={formData.celular || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#011748]"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#011748]"
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-[#E39E36] text-white rounded-md hover:bg-[#E39E36]/90 flex items-center"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" /> Guardando...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" /> Guardar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCliente, setCurrentCliente] = useState<Cliente | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchClientes = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await clienteApi.getClientes();
        if (response.error) {
          throw new Error(response.error);
        }
        if (response.data) {
          setClientes(response.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar clientes');
        console.error('Error al cargar clientes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, []);

  const handleOpenModal = (cliente: Cliente | null = null) => {
    setCurrentCliente(cliente);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentCliente(null);
  };

  const handleSaveCliente = async (clienteData: Cliente) => {
    setIsSubmitting(true);
    try {
      if (clienteData.id_cliente) {
        // Actualizar cliente existente
        const response = await clienteApi.updateCliente(clienteData.id_cliente, clienteData);
        if (response.error) {
          throw new Error(response.error);
        }
        if (response.data) {
          setClientes(prev => prev.map(c => c.id_cliente === clienteData.id_cliente ? response.data as Cliente : c));
        }
      } else {
        // Crear nuevo cliente
        const response = await clienteApi.createCliente(clienteData);
        if (response.error) {
          throw new Error(response.error);
        }
        if (response.data) {
          setClientes(prev => [...prev, response.data as Cliente]);
        }
      }
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar cliente');
      console.error('Error al guardar cliente:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCliente = async (id_cliente: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este cliente?')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await clienteApi.deleteCliente(id_cliente);
      if (response.error) {
        throw new Error(response.error);
      }
      setClientes(prev => prev.filter(c => c.id_cliente !== id_cliente));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar cliente');
      console.error('Error al eliminar cliente:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredClientes = searchTerm 
    ? clientes.filter(cliente => 
        cliente.dni.toLowerCase().includes(searchTerm.toLowerCase()) || 
        cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.apellido_paterno.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.apellido_materno.toLowerCase().includes(searchTerm.toLowerCase()))
    : clientes;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#011748]">Clientes</h1>
          <p className="text-gray-600">Gestiona la información de los clientes</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-[#E39E36] text-white rounded-lg hover:bg-[#E39E36]/90 shadow-md transition-colors"
        >
          <FaUserPlus className="mr-2" /> Nuevo Cliente
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-[#BA2E3B]/10 border-l-4 border-[#BA2E3B] text-[#BA2E3B] rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden border-t-4 border-[#E39E36]">
        <div className="p-4 bg-[#F8F8F8]">
          <div className="flex">
            <input 
              type="text" 
              placeholder="Buscar por nombre o DNI..." 
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#011748]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button 
              className="ml-2 px-4 py-2 bg-[#011748] text-white rounded-lg hover:bg-[#011748]/90 transition-colors shadow-md flex items-center"
              onClick={() => setSearchTerm('')}
            >
              <FaSearch className="mr-2" /> Buscar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#011748] text-white text-left">
                <th className="py-3 px-4 text-sm font-semibold">DNI</th>
                <th className="py-3 px-4 text-sm font-semibold">Nombre</th>
                <th className="py-3 px-4 text-sm font-semibold">Apellido Paterno</th>
                <th className="py-3 px-4 text-sm font-semibold">Apellido Materno</th>
                <th className="py-3 px-4 text-sm font-semibold">Celular</th>
                <th className="py-3 px-4 text-sm font-semibold">Dirección</th>
                <th className="py-3 px-4 text-sm font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && !filteredClientes.length ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    <FaSpinner className="animate-spin mx-auto mb-2 text-[#011748]" size={24} />
                    <p>Cargando clientes...</p>
                  </td>
                </tr>
              ) : !filteredClientes.length ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No se encontraron clientes
                  </td>
                </tr>
              ) : (
                filteredClientes.map((cliente, index) => (
                  <tr key={cliente.id_cliente} className={`border-b border-[#E39E36]/10 ${index % 2 === 0 ? 'bg-[#F8F8F8]' : 'bg-white'} hover:bg-[#E39E36]/5`}>
                    <td className="py-3 px-4 text-sm font-medium text-[#011748]">{cliente.dni}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{cliente.nombre}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{cliente.apellido_paterno}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{cliente.apellido_materno}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{cliente.celular}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{cliente.direccion}</td>
                    <td className="py-3 px-4 text-sm">
                      <button 
                        className="text-[#011748] hover:text-[#011748]/80 bg-[#011748]/10 p-2 rounded-full mr-2"
                        onClick={() => handleOpenModal(cliente)}
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="text-[#BA2E3B] hover:text-[#BA2E3B]/80 bg-[#BA2E3B]/10 p-2 rounded-full"
                        onClick={() => cliente.id_cliente && handleDeleteCliente(cliente.id_cliente)}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="py-4 px-6 bg-[#F8F8F8] border-t border-[#E39E36]/20 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Mostrando {filteredClientes.length} {filteredClientes.length === 1 ? 'cliente' : 'clientes'}
          </p>
        </div>
      </div>

      <ClienteModal
        cliente={currentCliente}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCliente}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default Clientes;
