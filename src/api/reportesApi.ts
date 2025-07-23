import type { Cliente } from '../types/venta';
import type { Combustible, Venta } from '../types/venta';

// Configuración base para las peticiones API
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Interfaces para las respuestas
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Interfaces para los reportes
export interface ResumenDiario {
  fecha: string;
  total_ventas: number;
  cantidad_ventas: number;
  combustibles_vendidos: {
    id_combustible: number;
    nombre: string;
    cantidad_total: number;
    monto_total: number;
  }[];
}

export interface ResumenGeneral {
  total_clientes: number;
  combustibles_disponibles: Combustible[];
  ventas_recientes: Venta[];
}

// Funciones genéricas para peticiones HTTP
export const fetchData = async <T>(endpoint: string, options?: { silent?: boolean }): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    // Solo mostrar errores en consola si no está en modo silencioso
    if (!options?.silent) {
      console.error(`Error al obtener datos desde ${endpoint}:`, error);
    }
    return { error: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

// Funciones para obtener reportes
export const getVentasPorFecha = async (fecha: string): Promise<ApiResponse<Venta[]>> => {
  return fetchData<Venta[]>(`ventas/fecha/${fecha}`);
};

interface ResumenDiarioRaw {
  fecha?: string;
  total_ventas?: number | string;
  cantidad_ventas?: number | string;
  combustibles_vendidos?: Array<{
    id_combustible: number;
    nombre: string;
    cantidad_total: number | string;
    monto_total: number | string;
  }>;
}

export const getResumenVentasDiarias = async (fecha: string): Promise<ApiResponse<ResumenDiario>> => {
  try {
    // Obtenemos el resumen diario del backend
    const response = await fetchData<ResumenDiarioRaw>(`reportes/ventas/diario/${fecha}`);
    
    if (response.error) {
      return response as ApiResponse<ResumenDiario>;
    }
    
    if (!response.data) {
      return { data: { 
        fecha: fecha,
        total_ventas: 0,
        cantidad_ventas: 0,
        combustibles_vendidos: []
      }};
    }
    
    // Asegurar que los valores numéricos sean números
    const resumenProcesado: ResumenDiario = {
      fecha: response.data.fecha || fecha,
      total_ventas: typeof response.data.total_ventas === 'string' 
        ? parseFloat(response.data.total_ventas) 
        : (response.data.total_ventas || 0),
      cantidad_ventas: typeof response.data.cantidad_ventas === 'string'
        ? parseInt(response.data.cantidad_ventas)
        : (response.data.cantidad_ventas || 0),
      combustibles_vendidos: Array.isArray(response.data.combustibles_vendidos)
        ? response.data.combustibles_vendidos.map((c) => ({
            id_combustible: c.id_combustible,
            nombre: c.nombre,
            cantidad_total: typeof c.cantidad_total === 'string' ? parseFloat(c.cantidad_total) : c.cantidad_total,
            monto_total: typeof c.monto_total === 'string' ? parseFloat(c.monto_total) : c.monto_total
          }))
        : []
    };
    
    return { data: resumenProcesado };
  } catch (error) {
    console.error('Error en getResumenVentasDiarias:', error);
    return { error: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

export const getVentasRecientes = async (limit: number = 5): Promise<ApiResponse<Venta[]>> => {
  try {
    console.log(`Solicitando ${limit} ventas recientes del backend...`);
    // Obtenemos las ventas recientes con la relación de cliente ya cargada desde el backend
    const response = await fetchData<Venta[]>(`reportes/ventas/recientes?limit=${limit}`);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    if (!response.data || !Array.isArray(response.data)) {
      console.warn('No se recibieron datos de ventas recientes');
      return { data: [] };
    }
    
    console.log(`Recibidas ${response.data.length} ventas recientes:`, response.data);
    
    // Asegurar que los campos numéricos sean números y no strings
    const ventasConDataCorrecta = response.data.map(venta => {
      // Asegurarnos de que total sea un número
      const totalNumerico = typeof venta.total === 'string' ? parseFloat(venta.total) : venta.total || 0;
      
      // Verificar que la propiedad cliente esté presente y completa
      if (venta.cliente && venta.cliente.id_cliente) {
        console.log(`Venta ${venta.id_venta} tiene cliente:`, venta.cliente.id_cliente, venta.cliente.nombre);
      } else {
        console.warn(`Venta ${venta.id_venta} NO tiene cliente o tiene datos incompletos`);
      }
      
      // Asegurarnos de que la fecha y hora estén presentes
      if (!venta.fecha) {
        console.warn(`Venta ${venta.id_venta} no tiene fecha definida`);
      }
      
      return {
        ...venta,
        total: totalNumerico,
        // Mantenemos el cliente tal como viene del backend o undefined si no existe
        cliente: venta.cliente
      };
    });
    
    return { data: ventasConDataCorrecta };
  } catch (error) {
    console.error('Error en getVentasRecientes:', error);
    return { error: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

export const getCombustiblesDisponibles = async (): Promise<ApiResponse<Combustible[]>> => {
  // Asumiendo que hay un endpoint para obtener combustibles, si no existe, debemos manejarlo
  return fetchData<Combustible[]>('combustible/');
};

export const getTotalClientes = async (): Promise<ApiResponse<number>> => {
  return fetchData<number>('reportes/clientes/count');
};

// Función para obtener todos los datos necesarios para el resumen
export const getResumenGeneral = async (): Promise<ApiResponse<ResumenGeneral>> => {
  try {
    // Obtener combustibles disponibles
    const combustiblesResponse = await getCombustiblesDisponibles();
    if (combustiblesResponse.error) throw new Error(combustiblesResponse.error);

    // Obtener ventas recientes
    const ventasResponse = await getVentasRecientes();
    if (ventasResponse.error) throw new Error(ventasResponse.error);

    // Obtener total de clientes
    const clientesResponse = await getTotalClientes();
    if (clientesResponse.error) throw new Error(clientesResponse.error);

    // Construir y retornar el resumen
    return {
      data: {
        total_clientes: clientesResponse.data || 0,
        combustibles_disponibles: combustiblesResponse.data || [],
        ventas_recientes: ventasResponse.data || [],
      }
    };
  } catch (error) {
    console.error('Error al obtener resumen general:', error);
    return { error: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

// Esta función simulará obtener datos para el resumen cuando no existen algunos endpoints
export const getResumenSimulado = async (fecha: string): Promise<{resumenDiario: ResumenDiario, resumenGeneral: ResumenGeneral}> => {
  try {
    // Intentar obtener datos reales primero
    const combustiblesResponse = await getCombustiblesDisponibles();
    const ventasResponse = await getVentasRecientes();
    
    // Obtener clientes reales
    const clientesResponse = await fetchData<Cliente[]>('cliente/');
    const totalClientes = clientesResponse.data ? clientesResponse.data.length : 0;
    
    // Verificar si tenemos datos reales de combustibles
    const combustibles = combustiblesResponse.data || [
      { id_combustible: 1, nombre: 'Gasohol 90', precio: 15.50, cantidad: 1000 },
      { id_combustible: 2, nombre: 'Gasohol 95', precio: 16.80, cantidad: 800 },
      { id_combustible: 3, nombre: 'Gasohol 97', precio: 17.50, cantidad: 600 },
      { id_combustible: 4, nombre: 'Diesel B5 S-50', precio: 14.20, cantidad: 1200 },
      { id_combustible: 5, nombre: 'GLP', precio: 7.50, cantidad: 2000 }
    ];
    
    // Construir datos simulados para ventas si no tenemos datos reales
    const ventasRecientes = ventasResponse.data || [
      { 
        id_venta: 1, 
        fecha: fecha, 
        hora: '09:00', // Simulated hour
        total: 155.00, 
        id_cliente: 1, 
        id_empleado: 1, 
        tipo_comprobante: 'BOLETA',
        detalles: [{ id_combustible: 1, cantidad: 10, precio_unitario: 15.50, subtotal: 155.00 }],
        pagos: [] // Simulated empty payments
      },
      { 
        id_venta: 2, 
        fecha: fecha, 
        hora: '10:30',
        total: 168.00, 
        id_cliente: 2, 
        id_empleado: 1, 
        tipo_comprobante: 'FACTURA',
        detalles: [{ id_combustible: 2, cantidad: 10, precio_unitario: 16.80, subtotal: 168.00 }],
        cliente: { id_cliente: 2, nombre: 'María', apellido_paterno: 'López', apellido_materno: 'Gómez', dni: '78945612' },
        pagos: []
      },
      { 
        id_venta: 3, 
        fecha: fecha, 
        hora: '11:15',
        total: 175.00, 
        id_cliente: 3, 
        id_empleado: 2, 
        tipo_comprobante: 'BOLETA',
        detalles: [{ id_combustible: 3, cantidad: 10, precio_unitario: 17.50, subtotal: 175.00 }],
        cliente: { id_cliente: 3, nombre: 'Pedro', apellido_paterno: 'Suárez', apellido_materno: 'Vargas', dni: '15975364' },
        pagos: []
      },
    ];
    
    // Crear resumen diario simulado
    const resumenDiario: ResumenDiario = {
      fecha: fecha,
      total_ventas: ventasRecientes.reduce((acc, venta) => acc + venta.total, 0),
      cantidad_ventas: ventasRecientes.length,
      combustibles_vendidos: combustibles.map(c => ({
        id_combustible: c.id_combustible,
        nombre: c.nombre,
        cantidad_total: Math.floor(Math.random() * 100) + 50, // Cantidad simulada
        monto_total: (Math.floor(Math.random() * 100) + 50) * c.precio
      }))
    };
    
    // Crear resumen general
    const resumenGeneral: ResumenGeneral = {
      total_clientes: totalClientes,
      combustibles_disponibles: combustibles,
      ventas_recientes: ventasRecientes
    };
    
    return {
      resumenDiario,
      resumenGeneral
    };
  } catch (error) {
    console.error('Error al generar resumen simulado:', error);
    // Retornar datos totalmente simulados en caso de error
    return {
      resumenDiario: {
        fecha: fecha,
        total_ventas: 3500,
        cantidad_ventas: 10,
        combustibles_vendidos: [
          { id_combustible: 1, nombre: 'Gasohol 90', cantidad_total: 120, monto_total: 1860 },
          { id_combustible: 2, nombre: 'Gasohol 95', cantidad_total: 80, monto_total: 1344 },
          { id_combustible: 4, nombre: 'Diesel B5 S-50', cantidad_total: 60, monto_total: 852 }
        ]
      },
      resumenGeneral: {
        total_clientes: 5,
        combustibles_disponibles: [
          { id_combustible: 1, nombre: 'Gasohol 90', precio: 15.50, cantidad: 1000 },
          { id_combustible: 2, nombre: 'Gasohol 95', precio: 16.80, cantidad: 800 },
          { id_combustible: 3, nombre: 'Gasohol 97', precio: 17.50, cantidad: 600 },
          { id_combustible: 4, nombre: 'Diesel B5 S-50', precio: 14.20, cantidad: 1200 },
          { id_combustible: 5, nombre: 'GLP', precio: 7.50, cantidad: 2000 }
        ],
        ventas_recientes: [
          { 
            id_venta: 1, 
            fecha: fecha, 
            hora: '09:00',
            total: 155.00, 
            id_cliente: 1, 
            id_empleado: 1, 
            tipo_comprobante: 'BOLETA',
            detalles: [{ id_combustible: 1, cantidad: 10, precio_unitario: 15.50, subtotal: 155.00 }],
            pagos: []
          },
          { 
            id_venta: 2, 
            fecha: fecha, 
            hora: '10:30',
            total: 168.00, 
            id_cliente: 2, 
            id_empleado: 1, 
            tipo_comprobante: 'FACTURA',
            detalles: [{ id_combustible: 2, cantidad: 10, precio_unitario: 16.80, subtotal: 168.00 }],
            pagos: []
          }
        ]
      }
    };
  }
};
