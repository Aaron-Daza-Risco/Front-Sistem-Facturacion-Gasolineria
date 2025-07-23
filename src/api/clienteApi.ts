import type { Cliente } from '../types/venta';

// Configuración base para las peticiones API
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Interfaces para las respuestas
export interface ApiResponse<T> {
  data?: T;
  error?: string;
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Error: ${response.status} ${response.statusText}`
      );
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error(`Error al enviar datos a ${endpoint}:`, error);
    return { error: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

export const putData = async <T>(endpoint: string, body: Record<string, unknown>): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Error: ${response.status} ${response.statusText}`
      );
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error(`Error al actualizar datos en ${endpoint}:`, error);
    return { error: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

export const deleteData = async <T>(endpoint: string): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Error: ${response.status} ${response.statusText}`
      );
    }
    
    // Para respuestas 204 No Content
    if (response.status === 204) {
      return { data: {} as T };
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error(`Error al eliminar datos en ${endpoint}:`, error);
    return { error: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

// Funciones específicas para Clientes
export const getClientes = async (): Promise<ApiResponse<Cliente[]>> => {
  return fetchData<Cliente[]>('cliente/');
};

export const getClienteById = async (id: number): Promise<ApiResponse<Cliente>> => {
  return fetchData<Cliente>(`cliente/${id}`);
};

export const getClienteByDni = async (dni: string): Promise<ApiResponse<Cliente>> => {
  return fetchData<Cliente>(`cliente/dni/${dni}`);
};

export const createCliente = async (cliente: Cliente): Promise<ApiResponse<Cliente>> => {
  return postData<Cliente>('cliente/', cliente as unknown as Record<string, unknown>);
};

export const updateCliente = async (id: number, cliente: Partial<Cliente>): Promise<ApiResponse<Cliente>> => {
  return putData<Cliente>(`cliente/${id}`, cliente as unknown as Record<string, unknown>);
};

export const deleteCliente = async (id: number): Promise<ApiResponse<void>> => {
  return deleteData<void>(`cliente/${id}`);
};
