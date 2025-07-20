// Configuración base para las peticiones API
const API_BASE_URL = 'http://localhost:8000/api';

// Interfaces para las respuestas
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Interface para la respuesta de login
export interface LoginResponse {
  id_usuario: number;
  nombre_usuario: string;
  role: string;
  nombre_completo: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}

export interface Venta {
  id_venta: number;
  fecha: string;
  total: number;
  id_cliente: number;
  id_empleado: number;
  estado: string;
}

export interface DetalleVenta {
  id_detalle: number;
  id_venta: number;
  id_combustible: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

// Definición de la interfaz Cliente
export interface Cliente {
  id_cliente: number;
  nombre: string;
  apellido: string;
  dni: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}

// Definición de la interfaz Combustible
export interface Combustible {
  id_combustible: number;
  nombre: string;
  precio: number;
  stock: number;
}

// Funciones genéricas para peticiones HTTP
export const fetchData = async <T>(endpoint: string): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error(`Error al obtener datos desde ${endpoint}:`, error);
    return { error: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

export const postData = async <T>(endpoint: string, body: Record<string, unknown>): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error(`Error al enviar datos a ${endpoint}:`, error);
    return { error: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

// Servicios específicos
export const authService = {
  login: async (username: string, password: string) => {
    return await postData<LoginResponse>('login', { username, password });
  },
};

export const combustiblesService = {
  getAll: async () => {
    return await fetchData<Combustible[]>('combustibles');
  },
  getById: async (id: number) => {
    return await fetchData<Combustible>(`combustibles/${id}`);
  }
};

export const clientesService = {
  getAll: async () => {
    return await fetchData<Cliente[]>('clientes');
  },
  getByDni: async (dni: string) => {
    return await fetchData<Cliente>(`clientes/dni/${dni}`);
  },
  create: async (cliente: Record<string, unknown>) => {
    return await postData<Cliente>('clientes', cliente);
  }
};

export const ventasService = {
  getAll: async () => {
    return await fetchData<Venta[]>('ventas');
  },
  getById: async (id: number) => {
    return await fetchData<Venta>(`ventas/${id}`);
  },
  getByEmpleado: async (idEmpleado: number) => {
    return await fetchData<Venta[]>(`ventas/empleado/${idEmpleado}`);
  },
  getByFecha: async (fecha: string) => {
    return await fetchData<Venta[]>(`ventas/fecha/${fecha}`);
  },
  create: async (venta: Record<string, unknown>) => {
    return await postData<Venta>('ventas', venta);
  },
  getDetalleVenta: async (idVenta: number) => {
    return await fetchData<DetalleVenta[]>(`detalles-venta/${idVenta}`);
  }
};

