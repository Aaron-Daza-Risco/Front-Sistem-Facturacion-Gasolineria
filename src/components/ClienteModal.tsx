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
  const [fieldErrors, setFieldErrors] = useState({
    dni: '',
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    celular: '',
    direccion: ''
  });
  
  if (!isOpen) return null;
  
  // Validaciones en tiempo real
  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'dni':
        if (!/^\d{8}$/.test(value)) return 'El DNI debe tener 8 números';
        return '';
      case 'nombre':
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value.trim())) return 'Solo letras y espacios';
        return '';
      case 'apellidoPaterno':
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value.trim())) return 'Solo letras y espacios';
        return '';
      case 'apellidoMaterno':
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value.trim())) return 'Solo letras y espacios';
        return '';
      case 'celular':
        if (value && !/^\d{9}$/.test(value)) return 'Debe tener 9 números';
        return '';
      case 'direccion':
        if (value && value.trim().length < 3) return 'Mínimo 3 caracteres';
        return '';
      default:
        return '';
    }
  };

  // Restringir ingreso de caracteres no válidos
  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    let newValue = value;
    if (name === 'dni' || name === 'celular') {
      newValue = newValue.replace(/[^\d]/g, '');
    } else if (name === 'nombre' || name === 'apellidoPaterno' || name === 'apellidoMaterno') {
      newValue = newValue.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    }
    if (newValue !== value) {
      e.currentTarget.value = newValue;
    }
  };

  // Validar y actualizar estado de errores en cada cambio
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    switch (name) {
      case 'dni': setDni(value); break;
      case 'nombre': setNombre(value); break;
      case 'apellidoPaterno': setApellidoPaterno(value); break;
      case 'apellidoMaterno': setApellidoMaterno(value); break;
      case 'celular': setCelular(value); break;
      case 'direccion': setDireccion(value); break;
      default: break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validar todos los campos antes de enviar
    const newErrors = {
      dni: validateField('dni', dni),
      nombre: validateField('nombre', nombre),
      apellidoPaterno: validateField('apellidoPaterno', apellidoPaterno),
      apellidoMaterno: validateField('apellidoMaterno', apellidoMaterno),
      celular: validateField('celular', celular || ''),
      direccion: validateField('direccion', direccion || '')
    };
    setFieldErrors(newErrors);
    if (!dni || !nombre || !apellidoPaterno || !apellidoMaterno) {
      setError('Los campos DNI, Nombre, Apellido Paterno y Apellido Materno son obligatorios.');
      return;
    }
    if (Object.values(newErrors).some(msg => msg)) {
      setError('Corrige los errores antes de continuar.');
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
              name="dni"
              value={dni}
              onChange={handleChange}
              onInput={handleInput}
              className={`w-full border ${fieldErrors.dni ? 'border-red-400' : 'border-gray-300'} rounded px-3 py-2`}
              maxLength={8}
              placeholder="Ingrese DNI"
              required
              inputMode="numeric"
              pattern="\d*"
            />
            {fieldErrors.dni && <p className="text-xs text-red-500 mt-1">{fieldErrors.dni}</p>}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={nombre}
              onChange={handleChange}
              onInput={handleInput}
              className={`w-full border ${fieldErrors.nombre ? 'border-red-400' : 'border-gray-300'} rounded px-3 py-2`}
              placeholder="Ingrese nombre"
              required
            />
            {fieldErrors.nombre && <p className="text-xs text-red-500 mt-1">{fieldErrors.nombre}</p>}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Apellido Paterno</label>
            <input
              type="text"
              name="apellidoPaterno"
              value={apellidoPaterno}
              onChange={handleChange}
              onInput={handleInput}
              className={`w-full border ${fieldErrors.apellidoPaterno ? 'border-red-400' : 'border-gray-300'} rounded px-3 py-2`}
              placeholder="Ingrese apellido paterno"
              required
            />
            {fieldErrors.apellidoPaterno && <p className="text-xs text-red-500 mt-1">{fieldErrors.apellidoPaterno}</p>}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Apellido Materno</label>
            <input
              type="text"
              name="apellidoMaterno"
              value={apellidoMaterno}
              onChange={handleChange}
              onInput={handleInput}
              className={`w-full border ${fieldErrors.apellidoMaterno ? 'border-red-400' : 'border-gray-300'} rounded px-3 py-2`}
              placeholder="Ingrese apellido materno"
              required
            />
            {fieldErrors.apellidoMaterno && <p className="text-xs text-red-500 mt-1">{fieldErrors.apellidoMaterno}</p>}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Celular</label>
            <input
              type="text"
              name="celular"
              value={celular}
              onChange={handleChange}
              onInput={handleInput}
              className={`w-full border ${fieldErrors.celular ? 'border-red-400' : 'border-gray-300'} rounded px-3 py-2`}
              placeholder="Ingrese celular (opcional)"
              inputMode="numeric"
              pattern="\d*"
              maxLength={9}
            />
            {fieldErrors.celular && <p className="text-xs text-red-500 mt-1">{fieldErrors.celular}</p>}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Dirección</label>
            <input
              type="text"
              name="direccion"
              value={direccion}
              onChange={handleChange}
              className={`w-full border ${fieldErrors.direccion ? 'border-red-400' : 'border-gray-300'} rounded px-3 py-2`}
              placeholder="Ingrese dirección (opcional)"
            />
            {fieldErrors.direccion && <p className="text-xs text-red-500 mt-1">{fieldErrors.direccion}</p>}
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
