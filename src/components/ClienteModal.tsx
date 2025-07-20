import React, { useState } from 'react';
import { clientesApi } from '../api/ventasApi';
import type { Cliente } from '../types/venta';

interface ClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClienteCreated: (cliente: Cliente) => void;
}

const ClienteModal: React.FC<ClienteModalProps> = ({ isOpen, onClose, onClienteCreated }) => {
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [celular, setCelular] = useState('');
  const [direccion, setDireccion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  if (!isOpen) return null;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dni || !nombre || !apellidoPaterno || !apellidoMaterno) {
      setError('Los campos DNI, Nombre, Apellido Paterno y Apellido Materno son obligatorios.');
      return;
    }
    
    if (dni.length !== 8) {
      setError('El DNI debe tener 8 dígitos');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const clienteData = {
        dni,
        nombre,
        apellido_paterno: apellidoPaterno,
        apellido_materno: apellidoMaterno,
        celular: celular || undefined,
        direccion: direccion || undefined
      };
      
      const response = await clientesApi.create(clienteData);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data) {
        onClienteCreated(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Error al crear cliente:', error);
      setError(error instanceof Error ? error.message : 'Error al crear cliente');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Registrar Nuevo Cliente</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">DNI</label>
            <input
              type="text"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              maxLength={8}
              placeholder="Ingrese DNI"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Ingrese nombre"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Apellido Paterno</label>
            <input
              type="text"
              value={apellidoPaterno}
              onChange={(e) => setApellidoPaterno(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Ingrese apellido paterno"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Apellido Materno</label>
            <input
              type="text"
              value={apellidoMaterno}
              onChange={(e) => setApellidoMaterno(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Ingrese apellido materno"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Celular</label>
            <input
              type="text"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Ingrese celular (opcional)"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Dirección</label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Ingrese dirección (opcional)"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Registrar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClienteModal;
