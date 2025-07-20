// API base URL - consistente con apiService.ts
const API_BASE_URL = 'http://localhost:8000/api';

export interface Combustible {
  id_combustible: number;
  nombre: string;
  precio: number;
  cantidad: number;
}

export interface CombustibleCreate {
  nombre: string;
  precio: number;
  cantidad: number;
}

export interface CombustibleUpdate {
  nombre?: string;
  precio?: number;
  cantidad?: number;
}

// Funciones auxiliares específicas para este servicio
const get = async <T>(endpoint: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
};

const post = async <T, D = unknown>(endpoint: string, data: D): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
};

const put = async <T, D = unknown>(endpoint: string, data: D): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
};

const del = async <T>(endpoint: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }
  
  if (response.status === 204) {
    return {} as T; // No content
  }
  
  return await response.json();
};

export const combustibleApi = {
  getAll: async (): Promise<Combustible[]> => {
    return get<Combustible[]>('/combustible');
  },

  getById: async (id: number): Promise<Combustible> => {
    return get<Combustible>(`/combustible/${id}`);
  },

  create: async (combustible: CombustibleCreate): Promise<Combustible> => {
    return post<Combustible>('/combustible', combustible);
  },

  update: async (id: number, combustible: CombustibleUpdate): Promise<Combustible> => {
    return put<Combustible>(`/combustible/${id}`, combustible);
  },

  updatePrecio: async (id: number, precio: number): Promise<Combustible> => {
    return put<Combustible>(`/combustible/${id}`, { precio });
  },

  updateCantidad: async (id: number, cantidad: number): Promise<Combustible> => {
    return put<Combustible>(`/combustible/${id}`, { cantidad });
  },

  delete: async (id: number): Promise<void> => {
    return del<void>(`/combustible/${id}`);
  }
};
