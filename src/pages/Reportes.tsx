import React, { useState, useEffect } from 'react';
import { FaChartLine, FaUsers, FaMoneyBillWave, FaCalendarAlt, FaSpinner, FaHistory } from 'react-icons/fa';
import { 
  getResumenVentasDiarias, 
  getVentasRecientes, 
  getCombustiblesDisponibles, 
  getTotalClientes
} from '../api/reportesApi';
import type { ResumenDiario, ResumenGeneral } from '../api/reportesApi';
import type { Venta } from '../types/venta';
import { obtenerFechaActualPeru, fechaAFormatoISO, formatearFecha } from '../utils/fechaUtils';

// La interfaz VentaConCliente ya no es necesaria porque hemos actualizado
// la interfaz Venta para incluir la propiedad cliente directamente

const formatCurrency = (value: number | unknown): string => {
  // Verificar si es un número válido
  if (typeof value !== 'number' || isNaN(value)) {
    console.warn('formatCurrency recibió un valor no numérico:', value);
    return 'S/ 0.00'; // Valor por defecto si no es un número
  }
  return `S/ ${value.toFixed(2)}`;
};

// Utilizamos la función formatearFecha de nuestras utilidades
const formatFecha = formatearFecha;

const Reportes: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [resumenDiario, setResumenDiario] = useState<ResumenDiario | null>(null);
  const [resumenGeneral, setResumenGeneral] = useState<ResumenGeneral | null>(null);
  
  // Usar la fecha actual de Perú (UTC-5) desde nuestra utilidad
  const [fechaActual] = useState<string>(() => {
    const fechaPeru = obtenerFechaActualPeru();
    
    // Log para depurar
    console.log("*** DEPURACIÓN FECHAS ***");
    console.log("Fecha original:", new Date().toString());
    console.log("Fecha en Perú:", fechaPeru.toString());
    console.log("Fecha actual en Perú (formato):", fechaPeru.toLocaleDateString('es-PE'));
    console.log("*************************");
    
    // Formatear fecha como YYYY-MM-DD usando la utilidad
    return fechaAFormatoISO(fechaPeru);
  });

  useEffect(() => {
    const cargarResumenes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log("Cargando resumen para fecha:", fechaActual);
        // Obtener datos del backend
        // Obtener resumen diario de ventas
        const resumenDiarioResponse = await getResumenVentasDiarias(fechaActual);
        if (resumenDiarioResponse.error) {
          throw new Error(`Error al obtener resumen diario: ${resumenDiarioResponse.error}`);
        }
        
        // Obtener las 6 ventas más recientes sin filtrar por fecha
        const ventasRecientesResponse = await getVentasRecientes(6);
        if (ventasRecientesResponse.error) {
          throw new Error(`Error al obtener ventas recientes: ${ventasRecientesResponse.error}`);
        }
        
        // Ya no necesitamos ventas específicas por fecha
        
        // Obtener combustibles disponibles
        const combustiblesResponse = await getCombustiblesDisponibles();
        if (combustiblesResponse.error) {
          throw new Error(`Error al obtener combustibles: ${combustiblesResponse.error}`);
        }
        
        // Obtener total de clientes
        const clientesResponse = await getTotalClientes();
        if (clientesResponse.error) {
          throw new Error(`Error al obtener total de clientes: ${clientesResponse.error}`);
        }
        
        console.log("Datos cargados del backend:");
        console.log("Resumen diario:", resumenDiarioResponse.data);
        console.log("Ventas recientes:", ventasRecientesResponse.data);
        
        // Imprimir detalle de los clientes para cada venta
        if (Array.isArray(ventasRecientesResponse.data)) {
          ventasRecientesResponse.data.forEach(venta => {
            if (venta.cliente) {
              console.log(`Venta ${venta.id_venta} - Cliente: ${venta.cliente.nombre} ${venta.cliente.apellido_paterno} - DNI: ${venta.cliente.dni}`);
            } else {
              console.log(`Venta ${venta.id_venta} - SIN INFORMACIÓN DE CLIENTE`);
            }
          });
        }
        console.log("Combustibles:", combustiblesResponse.data);
        console.log("Total clientes:", clientesResponse.data);
        
        // Aseguramos que total_ventas sea un número
        let totalVentas = 0;
        if (resumenDiarioResponse.data?.total_ventas !== undefined) {
          // Convertimos a número si viene como string
          totalVentas = typeof resumenDiarioResponse.data.total_ventas === 'string' 
            ? parseFloat(resumenDiarioResponse.data.total_ventas) 
            : resumenDiarioResponse.data.total_ventas;
          
          console.log('Total ventas (original):', resumenDiarioResponse.data.total_ventas);
          console.log('Total ventas (convertido):', totalVentas);
        }
        
        // Siempre usamos los datos del backend
        const resumenDiario = {
          fecha: fechaActual,
          total_ventas: totalVentas,
          cantidad_ventas: resumenDiarioResponse.data?.cantidad_ventas || 0,
          combustibles_vendidos: Array.isArray(resumenDiarioResponse.data?.combustibles_vendidos) 
            ? resumenDiarioResponse.data.combustibles_vendidos 
            : []
        };
        
        // Simplemente tomamos las ventas más recientes sin filtrar por fecha
        let ventasRecientes: Venta[] = [];
        
        if (ventasRecientesResponse.data && Array.isArray(ventasRecientesResponse.data)) {
          ventasRecientes = [...ventasRecientesResponse.data];
          // Ordenamos por fecha y hora más recientes primero
          ventasRecientes.sort((a, b) => {
            // Convertir las fechas a objetos Date para una comparación más precisa
            const fechaA = new Date(`${a.fecha}T${a.hora || '00:00:00'}`);
            const fechaB = new Date(`${b.fecha}T${b.hora || '00:00:00'}`);
            
            // Si alguna fecha es inválida, usar el método anterior de comparación
            if (isNaN(fechaA.getTime()) || isNaN(fechaB.getTime())) {
              console.warn('Fechas inválidas al ordenar, usando comparación de strings');
              // Comparar primero por fecha en orden descendente
              if (a.fecha !== b.fecha) {
                return b.fecha.localeCompare(a.fecha);
              }
              // Si las fechas son iguales, comparar por hora
              return b.hora ? b.hora.localeCompare(a.hora || '') : -1;
            }
            
            // Comparar fechas como objetos Date (más reciente primero)
            return fechaB.getTime() - fechaA.getTime();
          });
          
          // Log para verificar el orden correcto
          console.log('Ventas ordenadas por fecha y hora:', 
            ventasRecientes.map(v => ({
              id: v.id_venta,
              fecha: v.fecha,
              hora: v.hora,
              fechaCompleta: `${v.fecha}T${v.hora || '00:00:00'}`
            }))
          );
          
          // Limitamos a 6 ventas más recientes
          ventasRecientes = ventasRecientes.slice(0, 6);
        }
        
        // Aseguramos que el resumen general tenga todas las propiedades necesarias
        const resumenGeneral = {
          total_clientes: clientesResponse.data || 0,
          combustibles_disponibles: Array.isArray(combustiblesResponse.data) 
            ? combustiblesResponse.data 
            : [],
          ventas_recientes: ventasRecientes
        };
        
        setResumenDiario(resumenDiario);
        setResumenGeneral(resumenGeneral);
      } catch (err) {
        console.error('Error al cargar resumen:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar los datos del resumen');
      } finally {
        setIsLoading(false);
      }
    };

    cargarResumenes();
  }, [fechaActual]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <FaSpinner className="animate-spin text-[#011748] text-4xl mb-4" />
        <p className="text-gray-600">Cargando datos del resumen...</p>
      </div>
    );
  }

  if (error || !resumenDiario || !resumenGeneral) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
        <p>{error || 'Error al cargar los datos del resumen'}</p>
      </div>
    );
  }

  // Obtener la fecha actual en formato legible directamente
  const fechaActualFormateada = formatFecha(fechaActual);
  
  // Agregamos un log adicional para verificar la fecha que se está mostrando
  console.log("Fecha actual formateada para mostrar:", fechaActualFormateada);
  console.log("Fecha actual (ISO):", fechaActual);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#011748] mb-2">Resumen de Ventas</h1>
        <p className="text-gray-600 flex items-center">
          <FaCalendarAlt className="mr-2" /> 
          Fecha: {fechaActualFormateada}
        </p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Ventas del día */}
        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#E39E36]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-gray-500 text-sm">Ventas realizadas hoy</p>
              <h3 className="text-3xl font-bold text-[#011748]">{resumenDiario.cantidad_ventas}</h3>
            </div>
            <div className="bg-[#E39E36]/10 p-3 rounded-full text-[#E39E36]">
              <FaChartLine size={24} />
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600">
              {resumenDiario.cantidad_ventas > 0 
                ? 'Las ventas del día están progresando bien' 
                : 'No hay ventas registradas para el día de hoy'}
            </p>
          </div>
        </div>

        {/* Total Ingresos */}
        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#BA2E3B]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-gray-500 text-sm">Total ingresos</p>
              <h3 className="text-3xl font-bold text-[#011748]">{formatCurrency(resumenDiario.total_ventas)}</h3>
            </div>
            <div className="bg-[#BA2E3B]/10 p-3 rounded-full text-[#BA2E3B]">
              <FaMoneyBillWave size={24} />
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600">
              {resumenDiario.total_ventas > 0 
                ? 'Ingresos generados durante el día de hoy' 
                : 'No se han registrado ingresos para hoy'}
            </p>
          </div>
        </div>

        {/* Total Clientes */}
        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#011748]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-gray-500 text-sm">Total clientes</p>
              <h3 className="text-3xl font-bold text-[#011748]">{resumenGeneral.total_clientes}</h3>
            </div>
            <div className="bg-[#011748]/10 p-3 rounded-full text-[#011748]">
              <FaUsers size={24} />
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600">
              {resumenGeneral.total_clientes > 0 
                ? 'Clientes registrados en el sistema' 
                : 'No hay clientes registrados'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Ventas recientes */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-[#011748] text-white px-6 py-4">
            <h3 className="text-lg font-semibold flex items-center">
              <FaHistory className="mr-2" /> Ventas Recientes
            </h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b-2 border-[#011748]/20">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Cliente</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">DNI</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Tipo</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Fecha</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {resumenGeneral.ventas_recientes.map((venta) => (
                    <tr key={venta.id_venta} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-[#011748] font-medium">
                        {venta.cliente 
                          ? `${venta.cliente.nombre || ''} ${venta.cliente.apellido_paterno || ''} ${venta.cliente.apellido_materno || ''}`.trim() || 'Cliente sin nombre'
                          : 'Cliente no disponible'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {venta.cliente 
                          ? venta.cliente.dni || 'N/A'
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          venta.tipo_comprobante === 'FACTURA' 
                            ? 'bg-[#011748]/10 text-[#011748]' 
                            : 'bg-[#E39E36]/10 text-[#E39E36]'
                        }`}>
                          {venta.tipo_comprobante}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-600">
                        <div>{formatFecha(venta.fecha)}</div>
                        <div className="text-xs text-gray-500">{venta.hora ? venta.hora.substring(0, 5) : ''}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-[#BA2E3B]">{formatCurrency(venta.total)}</td>
                    </tr>
                  ))}
                  {resumenGeneral.ventas_recientes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-gray-500">No hay ventas recientes para mostrar</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reportes;
