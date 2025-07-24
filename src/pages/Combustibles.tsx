import React, { useState, useEffect } from 'react';
import { FaEdit, FaGasPump, FaSave, FaTimes } from 'react-icons/fa';
import { combustibleApi } from '../api/combustibleApi';
import type { Combustible, CombustibleCreate } from '../api/combustibleApi';
import { toast } from 'react-hot-toast';

const Combustibles: React.FC = () => {
  const [busqueda, setBusqueda] = useState<string>("");
  const [combustibles, setCombustibles] = useState<Combustible[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newPrecio, setNewPrecio] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [newCombustible, setNewCombustible] = useState<CombustibleCreate>({
    nombre: '',
    precio: 0,
    cantidad: 0
  });
  const [registrandoIngreso, setRegistrandoIngreso] = useState<number | null>(null);
  const [cantidadIngreso, setCantidadIngreso] = useState<string>("");

  // Cargar combustibles
  useEffect(() => {
    loadCombustibles();
  }, []);

  const loadCombustibles = async () => {
    try {
      setLoading(true);
      const data = await combustibleApi.getAll();
      // Asegurarnos de que los valores numéricos sean realmente números
      const processedData = data.map(item => ({
        ...item,
        precio: Number(item.precio),
        cantidad: Number(item.cantidad)
      }));
      setCombustibles(processedData);
    } catch (error) {
      console.error("Error al cargar combustibles:", error);
      toast.error("Error al cargar los combustibles");
    } finally {
      setLoading(false);
    }
  };

  // Funciones para manejar combustibles

  const handleDeleteCombustible = async (id: number) => {
    toast(
      (t) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontWeight: 'bold', color: '#BA2E3B' }}>
            ⚠️ ¿Deseas eliminar este combustible?<br />
            <span style={{ fontWeight: 'normal', color: '#011748' }}>
              Esta acción no se puede deshacer y el registro será removido permanentemente.
            </span>
          </span>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              style={{ background: '#BA2E3B', color: '#fff', fontWeight: 'bold', borderRadius: '6px', padding: '6px 16px', border: 'none', cursor: 'pointer' }}
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await combustibleApi.delete(id);
                  toast.success('Combustible eliminado con éxito', {
                    icon: '✅',
                    style: { background: '#fff', color: '#011748', fontWeight: 'bold' },
                    position: 'top-center'
                  });
                  loadCombustibles();
                } catch (error) {
                  console.error('Error al eliminar combustible:', error);
                  let mensaje = 'Error al eliminar el combustible';
                  if (
                    typeof error === 'object' &&
                    error !== null &&
                    'message' in error &&
                    typeof (error as { message?: string }).message === 'string' &&
                    (error as { message: string }).message.includes('Error:')
                  ) {
                    mensaje = 'No se pudo eliminar el combustible. Intenta nuevamente.';
                  }
                  toast.error(mensaje, {
                    icon: '❌',
                    style: { background: '#fff', color: '#BA2E3B', fontWeight: 'bold' },
                    position: 'top-center'
                  });
                }
              }}
            >Confirmar</button>
            <button
              style={{ background: '#fffbe6', color: '#BA2E3B', fontWeight: 'bold', borderRadius: '6px', padding: '6px 16px', border: 'none', cursor: 'pointer' }}
              onClick={() => {
                toast.dismiss(t.id);
                toast('Eliminación cancelada por el usuario.', {
                  icon: '⚠️',
                  style: { background: '#fffbe6', color: '#BA2E3B', fontWeight: 'bold' },
                  position: 'top-center'
                });
              }}
            >Cancelar</button>
          </div>
        </div>
      ),
      {
        duration: 10000,
        position: 'top-center',
        style: { background: '#fff', color: '#BA2E3B', fontWeight: 'bold', minWidth: '320px' }
      }
    );
  };
  const handleEditPrecio = (id: number) => {
    setEditingId(id);
    const combustible = combustibles.find(c => c.id_combustible === id);
    if (combustible) {
      setNewPrecio(combustible.precio.toString());
    }
  };

  const savePrecioUpdate = async (id: number) => {
    if (!newPrecio || isNaN(Number(newPrecio))) {
      toast('Por favor ingrese un precio válido', {
        icon: '⚠️',
        style: { background: '#fffbe6', color: '#BA2E3B', fontWeight: 'bold' }
      });
      return;
    }

    try {
      await combustibleApi.updatePrecio(id, Number(newPrecio));
      toast.success("Precio actualizado con éxito", {
        icon: '✅',
        style: { background: '#fff', color: '#011748', fontWeight: 'bold' }
      });
      setEditingId(null);
      loadCombustibles();
    } catch (error) {
      console.error("Error al actualizar precio:", error);
      toast.error("Error al actualizar el precio", {
        icon: '❌',
        style: { background: '#fff', color: '#BA2E3B', fontWeight: 'bold' }
      });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewPrecio("");
  };

  const handleRegistrarIngreso = (id: number) => {
    setRegistrandoIngreso(id);
    setCantidadIngreso("");
  };

  const saveIngresoUpdate = async (id: number) => {
    if (!cantidadIngreso || isNaN(Number(cantidadIngreso)) || Number(cantidadIngreso) <= 0) {
      toast('Por favor ingrese una cantidad válida', {
        icon: '⚠️',
        style: { background: '#fffbe6', color: '#BA2E3B', fontWeight: 'bold' }
      });
      return;
    }

    try {
      const combustible = combustibles.find(c => c.id_combustible === id);
      if (combustible) {
        const nuevaCantidad = Number(combustible.cantidad) + Number(cantidadIngreso);
        await combustibleApi.updateCantidad(id, nuevaCantidad);
        toast.success("Ingreso de combustible registrado con éxito", {
          icon: '✅',
          style: { background: '#fff', color: '#011748', fontWeight: 'bold' }
        });
        setRegistrandoIngreso(null);
        setCantidadIngreso("");
        loadCombustibles();
      }
    } catch (error) {
      console.error("Error al registrar ingreso:", error);
      toast.error("Error al registrar el ingreso de combustible", {
        icon: '❌',
        style: { background: '#fff', color: '#BA2E3B', fontWeight: 'bold' }
      });
    }
  };

  const toggleNewCombustibleModal = () => {
    setShowModal(!showModal);
    setNewCombustible({
      nombre: '',
      precio: 0,
      cantidad: 0
    });
  };

  const handleCreateCombustible = async () => {
    if (!newCombustible.nombre || newCombustible.precio <= 0 || newCombustible.cantidad < 0) {
      toast('Por favor complete correctamente todos los campos', {
        icon: '⚠️',
        style: { background: '#fffbe6', color: '#BA2E3B', fontWeight: 'bold' }
      });
      return;
    }

    try {
      await combustibleApi.create(newCombustible);
      toast.success("Combustible creado con éxito", {
        icon: '✅',
        style: { background: '#fff', color: '#011748', fontWeight: 'bold' }
      });
      toggleNewCombustibleModal();
      loadCombustibles();
    } catch (error) {
      console.error("Error al crear combustible:", error);
      toast.error("Error al crear el combustible", {
        icon: '❌',
        style: { background: '#fff', color: '#BA2E3B', fontWeight: 'bold' }
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#011748]">Combustibles</h1>
          <p className="text-gray-600">Gestión de precios y stock de combustibles</p>
        </div>
        <button 
          onClick={toggleNewCombustibleModal}
          className="bg-[#E39E36] hover:bg-[#E39E36]/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md"
        >
          <FaGasPump />
          <span>Nuevo Combustible</span>
        </button>
      </div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <input
            type="text"
            className="w-full p-2 border rounded-md text-[#011748]"
            placeholder="Buscar combustible por nombre..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-[#011748]">Cargando combustibles...</p>
        </div>
      ) : combustibles.length === 0 ? (
        <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <p className="text-[#011748] mb-2">No hay combustibles registrados</p>
            <button 
              onClick={toggleNewCombustibleModal}
              className="bg-[#E39E36] hover:bg-[#E39E36]/90 text-white px-4 py-2 rounded-lg"
            >
              Agregar combustible
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
          {combustibles
            .filter(c => c.nombre.toLowerCase().includes(busqueda.toLowerCase()))
            .map((combustible) => (
            <div key={combustible.id_combustible} className="bg-white rounded-lg shadow-md overflow-hidden border-t-4 border-[#E39E36]">
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#011748] mb-2">{combustible.nombre}</h3>
                
                {editingId === combustible.id_combustible ? (
                  <div className="flex items-center mb-4 space-x-2">
                    <input 
                      type="number"
                      step="0.01"
                      className="p-2 border rounded-md w-24 text-[#011748]"
                      value={newPrecio}
                      onChange={(e) => setNewPrecio(e.target.value)}
                    />
                    <button 
                      onClick={() => savePrecioUpdate(combustible.id_combustible)} 
                      className="bg-green-500 text-white p-2 rounded-md"
                    >
                      <FaSave size={16} />
                    </button>
                    <button 
                      onClick={cancelEdit} 
                      className="bg-red-500 text-white p-2 rounded-md"
                    >
                      <FaTimes size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-[#BA2E3B]">S/ {Number(combustible.precio).toFixed(2)}</span>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEditPrecio(combustible.id_combustible)}
                      className="text-[#011748] hover:text-[#011748]/80 bg-[#011748]/10 p-2 rounded-full"
                    >
                      <FaEdit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteCombustible(combustible.id_combustible)}
                      className="text-red-500 hover:text-red-700 bg-red-100 p-2 rounded-full"
                      title="Eliminar combustible"
                    >
                      <FaTimes size={18} />
                    </button>
                  </div>
                  </div>
                )}
                
                <div className="bg-[#F8F8F8] rounded-lg p-3 border-l-4 border-[#E39E36]">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-[#011748]">Stock actual:</span>
                    <span className="text-sm font-bold text-[#011748]">{Number(combustible.cantidad).toFixed(2)} gal</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-[#011748] h-2 rounded-full" 
                      style={{ width: `${Math.min((Number(combustible.cantidad) / 1500) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {registrandoIngreso === combustible.id_combustible && (
                  <div className="mt-3 p-3 bg-[#F8F8F8] rounded-lg border-l-4 border-green-500">
                    <p className="text-sm font-medium text-[#011748] mb-2">Registrar ingreso:</p>
                    <div className="flex space-x-2">
                      <input 
                        type="number"
                        step="0.01"
                        className="p-2 border rounded-md flex-1 text-[#011748]"
                        placeholder="Cantidad en galones"
                        value={cantidadIngreso}
                        onChange={(e) => setCantidadIngreso(e.target.value)}
                      />
                      <button 
                        onClick={() => saveIngresoUpdate(combustible.id_combustible)} 
                        className="bg-green-500 text-white p-2 rounded-md"
                      >
                        <FaSave size={16} />
                      </button>
                      <button 
                        onClick={() => setRegistrandoIngreso(null)} 
                        className="bg-red-500 text-white p-2 rounded-md"
                      >
                        <FaTimes size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-[#F8F8F8] px-6 py-3 border-t border-gray-100">
                <button 
                  onClick={() => handleEditPrecio(combustible.id_combustible)}
                  className="text-[#011748] hover:text-[#011748]/80 font-medium text-sm bg-[#011748]/10 px-3 py-1 rounded-md"
                >
                  Actualizar precio
                </button>
                <button 
                  onClick={() => handleRegistrarIngreso(combustible.id_combustible)}
                  className="text-[#E39E36] hover:text-[#E39E36]/80 font-medium text-sm ml-4 bg-[#E39E36]/10 px-3 py-1 rounded-md"
                >
                  Registrar ingreso
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para añadir nuevo combustible */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-[#011748] mb-4">Nuevo Combustible</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                value={newCombustible.nombre}
                onChange={(e) => setNewCombustible({...newCombustible, nombre: e.target.value})}
                placeholder="Ej: Gasolina 95"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio por galón</label>
              <input
                type="number"
                step="0.01"
                className="w-full p-2 border rounded-md"
                value={newCombustible.precio}
                onChange={(e) => setNewCombustible({...newCombustible, precio: Number(e.target.value)})}
                placeholder="Ej: 15.50"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock inicial (galones)</label>
              <input
                type="number"
                step="0.01"
                className="w-full p-2 border rounded-md"
                value={newCombustible.cantidad}
                onChange={(e) => setNewCombustible({...newCombustible, cantidad: Number(e.target.value)})}
                placeholder="Ej: 1000"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={toggleNewCombustibleModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCombustible}
                className="px-4 py-2 bg-[#E39E36] text-white rounded-md hover:bg-[#E39E36]/90"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Combustibles;
