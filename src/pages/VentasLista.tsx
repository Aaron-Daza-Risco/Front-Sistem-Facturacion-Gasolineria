import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { ventasApi, clientesApi, combustiblesApi } from '../api/ventasApi';
import type { Venta, Cliente, Combustible, DetalleVenta, Pago } from '../types/venta';
import VentaDetalleModal from '../components/VentaDetalleModal';
import { useAuth } from '../context/useAuth';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface VentaCompleta extends Venta {
  clienteInfo?: Cliente;
  detallesCompletos?: (DetalleVenta & { combustible?: Combustible })[];
}

const VentasLista: React.FC = () => {
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroCombustible, setFiltroCombustible] = useState('');
  const [ventas, setVentas] = useState<VentaCompleta[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Cargando ventas...');
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<VentaCompleta | null>(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [detallesVenta, setDetallesVenta] = useState<(DetalleVenta & { combustible?: Combustible })[]>([]);
  const [pagosVenta, setPagosVenta] = useState<Pago[]>([]);
  const [combustibles, setCombustibles] = useState<Combustible[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const { user } = useAuth();
  
  // Cargar ventas al iniciar y cuando cambien los filtros
  useEffect(() => {
    fetchVentas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroFecha, filtroCombustible, page]);
  
  // Cargar lista de combustibles (para el filtro)
  useEffect(() => {
    const fetchCombustibles = async () => {
      try {
        const response = await combustiblesApi.getAll();
        if (response.data) {
          setCombustibles(response.data);
        }
      } catch (error) {
        console.error('Error al cargar combustibles:', error);
      }
    };
    
    fetchCombustibles();
  }, []);
  
  const fetchVentas = async () => {
    setLoading(true);
    setLoadingMessage('Cargando ventas...');
    try {
      let response;
      
      // Usar el filtro de fecha si está establecido
      if (filtroFecha) {
        response = await ventasApi.getByFecha(filtroFecha);
      } else {
        response = await ventasApi.getAll();
      }
      
      if (response.data) {
        // Si hay ventas, obtener datos adicionales para cada una
        const ventasConDetalles = await Promise.all(
          response.data.map(async (venta) => {
            // Obtener información del cliente
            let clienteInfo: Cliente | undefined;
            if (venta.id_cliente) {
              try {
                const clienteResponse = await clientesApi.getById(venta.id_cliente);
                if (clienteResponse.data) {
                  clienteInfo = clienteResponse.data;
                } else if (clienteResponse.error) {
                  console.warn(`Cliente no encontrado para venta ${venta.id_venta}: ${clienteResponse.error}`);
                  // Crear un cliente genérico para evitar errores en la interfaz
                  clienteInfo = {
                    id_cliente: venta.id_cliente,
                    dni: "Sin DNI",
                    nombre: "Cliente",
                    apellido_paterno: "No",
                    apellido_materno: "Encontrado",
                    celular: "",
                    direccion: ""
                  };
                }
              } catch (error) {
                console.error(`Error al obtener cliente para venta ${venta.id_venta}:`, error);
                // Crear un cliente genérico para evitar errores en la interfaz
                clienteInfo = {
                  id_cliente: venta.id_cliente,
                  dni: "Error",
                  nombre: "Cliente",
                  apellido_paterno: "No",
                  apellido_materno: "Disponible",
                  celular: "",
                  direccion: ""
                };
              }
            }
            
            // Filtrar según criterios adicionales
            // Si hay filtro de cliente, verificar si coincide
            if (filtroCliente && clienteInfo) {
              const clienteNombreCompleto = `${clienteInfo.nombre} ${clienteInfo.apellido_paterno} ${clienteInfo.apellido_materno}`.toLowerCase();
              const clienteDNI = clienteInfo.dni;
              
              if (!clienteNombreCompleto.includes(filtroCliente.toLowerCase()) && 
                 !clienteDNI.includes(filtroCliente)) {
                return null;
              }
            }
            
            // Obtener detalles de combustible para la venta
            let detallesCompletos: (DetalleVenta & { combustible?: Combustible })[] = [];
            if (venta.id_venta) {
              setLoadingMessage(`Cargando detalles de venta ${venta.id_venta}...`);
              try {
                const detallesResponse = await ventasApi.getDetalleVenta(venta.id_venta);
                if (detallesResponse.data) {
                  // Para cada detalle, obtener información del combustible
                  detallesCompletos = await Promise.all(
                    detallesResponse.data.map(async (detalle) => {
                      let combustible: Combustible | undefined;
                      try {
                        const combustibleResponse = await combustiblesApi.getById(detalle.id_combustible);
                        if (combustibleResponse.data) {
                          combustible = combustibleResponse.data;
                        }
                      } catch (err) {
                        console.error(`Error al obtener combustible para detalle de venta ${venta.id_venta}:`, err);
                      }
                      return { ...detalle, combustible };
                    })
                  );
                }
              } catch (err) {
                console.error(`Error al obtener detalles para venta ${venta.id_venta}:`, err);
              }
            }
            
            return { 
              ...venta, 
              clienteInfo,
              detallesCompletos
            };
          })
        );
        
        // Filtrar nulos (ventas que no coinciden con el filtro de cliente)
        const ventasFiltradas = ventasConDetalles.filter(venta => venta !== null) as VentaCompleta[];
        
        // Filtrar por tipo de combustible si está especificado
        const ventasFiltradas2 = filtroCombustible 
          ? ventasFiltradas.filter(venta => 
              venta.detallesCompletos?.some(detalle => 
                detalle.combustible?.nombre.toLowerCase().includes(filtroCombustible.toLowerCase())))
          : ventasFiltradas;
        
        setVentas(ventasFiltradas2);
        
        // Calcular paginación (simplificado)
        setTotalPages(Math.ceil(ventasFiltradas2.length / 10));
      }
    } catch (error) {
      console.error('Error al obtener ventas:', error);
      toast.error('Error al cargar el historial de ventas');
    } finally {
      setLoading(false);
      setLoadingMessage('Cargando ventas...');
    }
  };
  
  const handleSearch = () => {
    setPage(1); // Volver a la primera página al buscar
    fetchVentas();
  };
  
  const verDetalleVenta = async (venta: VentaCompleta) => {
    setLoading(true);
    setLoadingMessage('Cargando detalles de la venta...');
    try {
      setVentaSeleccionada(venta);
      setClienteSeleccionado(venta.clienteInfo || null);
      
      // Si ya tenemos los detalles completos, usarlos directamente
      if (venta.detallesCompletos && venta.detallesCompletos.length > 0) {
        setDetallesVenta(venta.detallesCompletos);
        
        // Asegurarnos de establecer los pagos
        if (venta.pagos && venta.pagos.length > 0) {
          setPagosVenta(venta.pagos);
        } else {
          setPagosVenta([]);
        }
      }
      // Si no, obtenerlos de la API
      else if (venta.id_venta) {
        const detallesResponse = await ventasApi.getDetalleVenta(venta.id_venta);
        
        if (detallesResponse.data) {
          // Para cada detalle, obtener información del combustible
          const detallesCompletos = await Promise.all(
            detallesResponse.data.map(async (detalle) => {
              let combustible: Combustible | undefined;
              
              try {
                const combustibleResponse = await combustiblesApi.getById(detalle.id_combustible);
                if (combustibleResponse.data) {
                  combustible = combustibleResponse.data;
                }
              } catch (error) {
                console.error(`Error al obtener combustible para detalle ${detalle.id_detalle}:`, error);
              }
              
              return {
                ...detalle,
                combustible
              };
            })
          );
          
          setDetallesVenta(detallesCompletos);
        }
        
        // Establecer los pagos independientemente del resultado de los detalles
        if (venta.pagos && venta.pagos.length > 0) {
          setPagosVenta(venta.pagos);
        } else {
          setPagosVenta([]);
        }
      } else {
        // Si no hay ID de venta, establecemos un array vacío de pagos
        setPagosVenta(venta.pagos || []);
      }
      
      // Siempre abrimos el modal después de configurar todos los datos
      setDetalleModalOpen(true);
    } catch (error) {
      console.error('Error al obtener detalles de la venta:', error);
      toast.error('Error al cargar los detalles de la venta');
    } finally {
      setLoading(false);
      setLoadingMessage('Cargando ventas...');
    }
  };
  
  const metodoPagoColor = (metodo: string) => {
    switch(metodo) {
      case 'EFECTIVO': return 'bg-[#E39E36]/20 text-[#E39E36]';
      case 'TARJETA': return 'bg-[#011748]/20 text-[#011748]';
      case 'YAPE': return 'bg-[#BA2E3B]/20 text-[#BA2E3B]';
      case 'PLIN': return 'bg-[#011748]/20 text-[#011748]';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatFecha = (fecha: string) => {
    try {
      // Asegurarnos que la fecha esté en UTC para evitar problemas de zona horaria
      const fechaString = fecha.includes('T') ? fecha.split('T')[0] : fecha;
      const [year, month, day] = fechaString.split('-').map(num => parseInt(num, 10));
      
      if (!year || !month || !day) throw new Error('Formato de fecha inválido');
      
      // Crear la fecha en formato local (evitando el desplazamiento de zona horaria)
      return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    } catch (error) {
      console.error('Error al formatear fecha:', error, fecha);
      return fecha || 'Fecha no disponible';
    }
  };
  
  const getNombreCliente = (venta: VentaCompleta) => {
    if (venta.clienteInfo) {
      return `${venta.clienteInfo.nombre} ${venta.clienteInfo.apellido_paterno} ${venta.clienteInfo.apellido_materno}`;
    }
    return 'Cliente no disponible';
  };
  
  const getMetodoPago = (venta: VentaCompleta) => {
    if (venta.pagos && venta.pagos.length > 0) {
      return venta.pagos[0].metodo_pago;
    }
    return 'N/A';
  };
  
  const getCombustibleInfo = (venta: VentaCompleta) => {
    if (venta.detallesCompletos && venta.detallesCompletos.length > 0) {
      const primerDetalle = venta.detallesCompletos[0];
      if (primerDetalle.combustible) {
        return {
          nombre: primerDetalle.combustible.nombre,
          cantidad: typeof primerDetalle.cantidad === 'number' ? primerDetalle.cantidad : Number(primerDetalle.cantidad)
        };
      }
    }
    
    if (venta.detalles && venta.detalles.length > 0) {
      return {
        nombre: 'Combustible',
        cantidad: typeof venta.detalles[0].cantidad === 'number' ? venta.detalles[0].cantidad : Number(venta.detalles[0].cantidad)
      };
    }
    
    return {
      nombre: 'No disponible',
      cantidad: 0
    };
  };
  
  return (
    <div>
      <ToastContainer />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#011748]">Historial de Ventas</h1>
          <p className="text-gray-600 text-sm">Consulta y gestiona las ventas realizadas</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2.5 bg-[#011748] text-white rounded-lg hover:bg-[#011748]/90 transition duration-200 shadow-sm">
            <FaFileExcel className="mr-2" /> Exportar Excel
          </button>
          <button className="flex items-center px-4 py-2.5 bg-[#BA2E3B] text-white rounded-lg hover:bg-[#BA2E3B]/90 transition duration-200 shadow-sm">
            <FaFilePdf className="mr-2" /> Exportar PDF
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6 mb-6 border-t-4 border-[#E39E36]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-5">
          <div>
            <label className="block text-[#011748] text-sm font-semibold mb-2">Fecha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#E39E36]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="date"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className="w-full bg-[#F8F8F8] border border-gray-200 rounded-lg pl-10 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#E39E36] focus:border-[#E39E36]"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[#011748] text-sm font-semibold mb-2">Cliente</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#E39E36]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                value={filtroCliente}
                onChange={(e) => setFiltroCliente(e.target.value)}
                placeholder="Nombre o DNI"
                className="w-full bg-[#F8F8F8] border border-gray-200 rounded-lg pl-10 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#E39E36] focus:border-[#E39E36]"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[#011748] text-sm font-semibold mb-2">Combustible</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#E39E36]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <select
                value={filtroCombustible}
                onChange={(e) => setFiltroCombustible(e.target.value)}
                className="w-full bg-[#F8F8F8] border border-gray-200 rounded-lg pl-10 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#E39E36] focus:border-[#E39E36] appearance-none"
              >
                <option value="">Todos</option>
                {combustibles.map(combustible => (
                  <option key={combustible.id_combustible} value={combustible.nombre}>
                    {combustible.nombre}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="flex items-end">
            <button 
              className="flex items-center px-6 py-2.5 bg-[#011748] text-white rounded-lg hover:bg-[#011748]/90 transition duration-200 w-full justify-center shadow-md"
              onClick={handleSearch}
              disabled={loading}
            >
              <FaSearch className="mr-2" /> {loading ? 'Cargando...' : 'Buscar'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#F8F8F8] text-left border-b border-gray-200">
                <th className="py-4 px-4 text-sm font-semibold text-[#011748]"># Ticket</th>
                <th className="py-4 px-4 text-sm font-semibold text-[#011748]">Fecha</th>
                <th className="py-4 px-4 text-sm font-semibold text-[#011748]">Cliente</th>
                <th className="py-4 px-4 text-sm font-semibold text-[#011748]">DNI</th>
                <th className="py-4 px-4 text-sm font-semibold text-[#011748]">Combustible</th>
                <th className="py-4 px-4 text-sm font-semibold text-[#011748]">Cantidad</th>
                <th className="py-4 px-4 text-sm font-semibold text-[#011748]">Total</th>
                <th className="py-4 px-4 text-sm font-semibold text-[#011748]">Método Pago</th>
                <th className="py-4 px-4 text-sm font-semibold text-[#011748]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center">
                    <div className="flex justify-center items-center">
                      <svg className="animate-spin h-6 w-6 mr-3 text-[#E39E36]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-[#011748]">{loadingMessage}</span>
                    </div>
                  </td>
                </tr>
              ) : ventas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-gray-500 text-lg">No se encontraron registros de ventas</p>
                      <p className="text-gray-400 text-sm mt-1">Intente con diferentes criterios de búsqueda</p>
                    </div>
                  </td>
                </tr>
              ) : (
                ventas.map((venta) => {
                  const combustibleInfo = getCombustibleInfo(venta);
                  const metodoPago = getMetodoPago(venta);
                  
                  return (
                    <tr key={venta.id_venta} className="border-b hover:bg-gray-50 transition duration-150">
                      <td className="py-4 px-4 text-sm text-[#011748] font-medium">{venta.id_venta}</td>
                      <td className="py-4 px-4 text-sm text-gray-700">{formatFecha(venta.fecha)}</td>
                      <td className="py-4 px-4 text-sm text-gray-700 font-medium">{getNombreCliente(venta)}</td>
                      <td className="py-4 px-4 text-sm text-gray-700">{venta.clienteInfo?.dni || 'N/A'}</td>
                      <td className="py-4 px-4 text-sm text-gray-700">
                        {combustibleInfo.nombre !== 'No disponible' ? (
                          <span className="font-medium text-[#011748]">
                            {combustibleInfo.nombre}
                          </span>
                        ) : (
                          <span className="text-gray-500 italic">No disponible</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-700">
                        <span className="font-medium">
                          {combustibleInfo.cantidad && !isNaN(combustibleInfo.cantidad) 
                            ? Number(combustibleInfo.cantidad).toFixed(3) 
                            : '0.000'} gal
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm font-semibold text-[#BA2E3B]">
                        S/ {venta.total && !isNaN(Number(venta.total)) 
                          ? Number(venta.total).toFixed(2) 
                          : '0.00'}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${metodoPagoColor(metodoPago)}`}>
                          {metodoPago}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <button 
                          className="flex items-center px-3 py-1.5 text-sm bg-[#E39E36]/10 text-[#E39E36] hover:bg-[#E39E36]/20 rounded-lg transition duration-200"
                          onClick={() => verDetalleVenta(venta)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {!loading && ventas.length > 0 && (
          <div className="py-4 px-6 bg-[#F8F8F8] flex items-center justify-between border-t">
            <p className="text-sm text-[#011748]">
              Mostrando {Math.min(10, ventas.length)} de {ventas.length} registros
            </p>
            <div className="flex">
              <button 
                className="px-4 py-2 border border-[#E39E36] text-[#E39E36] font-medium rounded-l-lg hover:bg-[#E39E36]/10 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                Anterior
              </button>
              
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                const pageNum = page <= 2 ? i + 1 : page - 1 + i;
                if (pageNum <= totalPages) {
                  return (
                    <button
                      key={pageNum}
                      className={`px-4 py-2 border ${
                        pageNum === page ? 'bg-[#011748] text-white border-[#011748]' : 'border-[#E39E36] text-[#011748] hover:bg-[#E39E36]/10'
                      } transition duration-200`}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                }
                return null;
              })}
              
              <button 
                className="px-4 py-2 border border-[#E39E36] text-[#E39E36] font-medium rounded-r-lg hover:bg-[#E39E36]/10 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal para mostrar detalles de la venta */}
      <VentaDetalleModal 
        isOpen={detalleModalOpen}
        onClose={() => setDetalleModalOpen(false)}
        venta={ventaSeleccionada}
        cliente={clienteSeleccionado}
        detalles={detallesVenta}
        pagos={pagosVenta}
        empleado={user ? { nombre: user.nombre || '', apellido: '' } : null}
      />
    </div>
  );
};

export default VentasLista;
