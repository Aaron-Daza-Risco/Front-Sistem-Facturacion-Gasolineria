import type { Cliente, Combustible, Venta, DetalleVenta, CombustibleCalculo } from '../types/venta';

// Configuración base para las peticiones API
const API_BASE_URL = 'http://localhost:8000/api';

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
    // Log detallado para depuración
    console.log(`Enviando a ${endpoint}:`, JSON.stringify(body, null, 2));
    
    // Manejo especial para facturas
    if (endpoint === 'ventas/' && body.tipo_comprobante === 'FACTURA') {
      console.log('Detectada FACTURA en postData. Preparando datos especiales.');
      
      // Extraemos ruc y razon_social, asegurándonos de que sean strings válidos
      const ruc = typeof body.ruc === 'string' ? body.ruc.trim() : String(body.ruc || '');
      const razonSocial = typeof body.razon_social === 'string' ? body.razon_social.trim() : String(body.razon_social || '');
      
      // Eliminamos estos campos del body original para evitar duplicación
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { ruc: _ruc, razon_social: _razonSocial, tipo_comprobante: _tipoComprobante, ...restoDatos } = body;
      
      // Construimos un nuevo objeto con el orden específico
      const facturaBody = {
        ruc: ruc,
        razon_social: razonSocial,
        tipo_comprobante: 'FACTURA',
        ...restoDatos
      };
      
      console.log('Datos de factura preparados:', JSON.stringify(facturaBody, null, 2));
      
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(facturaBody),
      });
      
      if (!response.ok) {
        // Manejo de errores mejorado
        let errorMessage = `Error: ${response.status} ${response.statusText}`;
        
        try {
          // Intentamos leer el cuerpo del error como JSON
          const errorBody = await response.json();
          console.error('Error detallado de la API para factura:', errorBody);
          errorMessage += ` - ${JSON.stringify(errorBody)}`;
        } catch {
          // Si no es JSON, leemos como texto
          const errorText = await response.text();
          if (errorText) {
            errorMessage += ` - ${errorText}`;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      return { data };
    }
    
    // Para el resto de casos (no facturas)
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      // Manejo de errores mejorado
      let errorMessage = `Error: ${response.status} ${response.statusText}`;
      
      try {
        // Intentamos leer el cuerpo del error como JSON
        const errorBody = await response.json();
        console.error('Error detallado de la API:', errorBody);
        errorMessage += ` - ${JSON.stringify(errorBody)}`;
      } catch {
        // Si no es JSON, leemos como texto
        const errorText = await response.text();
        if (errorText) {
          errorMessage += ` - ${errorText}`;
        }
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error(`Error al enviar datos a ${endpoint}:`, error);
    return { error: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

// API para combustibles
export const combustiblesApi = {
  getAll: async (): Promise<ApiResponse<Combustible[]>> => {
    return fetchData<Combustible[]>('combustibles/');
  },
  getById: async (id: number): Promise<ApiResponse<Combustible>> => {
    return fetchData<Combustible>(`combustibles/${id}`);
  },
  calcularPorMonto: async (idCombustible: number, monto: number): Promise<ApiResponse<CombustibleCalculo>> => {
    return fetchData<CombustibleCalculo>(`combustibles/calcular/${idCombustible}?monto=${monto}`);
  },
  litrosAGalones: async (litros: number): Promise<ApiResponse<{litros: number, galones: number}>> => {
    return fetchData<{litros: number, galones: number}>(`combustibles/conversion/litros-galones?litros=${litros}`);
  },
  galonesALitros: async (galones: number): Promise<ApiResponse<{galones: number, litros: number}>> => {
    return fetchData<{galones: number, litros: number}>(`combustibles/conversion/galones-litros?galones=${galones}`);
  }
};

// API para clientes
export const clientesApi = {
  getAll: async (): Promise<ApiResponse<Cliente[]>> => {
    return fetchData<Cliente[]>('clientes');
  },
  getByDni: async (dni: string): Promise<ApiResponse<Cliente>> => {
    return fetchData<Cliente>(`clientes/dni/${dni}`);
  },
  getById: async (id: number): Promise<ApiResponse<Cliente>> => {
    return fetchData<Cliente>(`clientes/${id}`);
  },
  create: async (cliente: Record<string, unknown>): Promise<ApiResponse<Cliente>> => {
    // Solución temporal para evitar el error 405 Method Not Allowed
    const response = await fetch(`${API_BASE_URL}/clientes/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cliente),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    return { data };
  }
};

// API para ventas
export const ventasApi = {
  getAll: async (): Promise<ApiResponse<Venta[]>> => {
    return fetchData<Venta[]>('ventas');
  },
  getById: async (id: number): Promise<ApiResponse<Venta>> => {
    return fetchData<Venta>(`ventas/${id}`);
  },
  getByEmpleado: async (idEmpleado: number): Promise<ApiResponse<Venta[]>> => {
    return fetchData<Venta[]>(`ventas/empleado/${idEmpleado}`);
  },
  getByFecha: async (fecha: string): Promise<ApiResponse<Venta[]>> => {
    return fetchData<Venta[]>(`ventas/fecha/${fecha}`);
  },
  create: async (venta: Record<string, unknown>): Promise<ApiResponse<Venta>> => {
    try {
      // Enfoque simplificado para todos los tipos de comprobante
      if (venta.tipo_comprobante === 'FACTURA') {
        console.log('Creando factura con método mejorado');
        
        // Extraemos los datos principales y validamos
        const rucValue = typeof venta.ruc === 'string' ? venta.ruc.trim() : String(venta.ruc || '');
        const razonSocialValue = typeof venta.razon_social === 'string' ? venta.razon_social.trim() : String(venta.razon_social || '');
        
        // Validaciones explícitas en el cliente antes de enviar
        if (!rucValue || rucValue.length !== 11) {
          console.error('RUC inválido para factura:', rucValue);
          return { error: 'El RUC debe tener exactamente 11 dígitos' };
        }
        
        if (!razonSocialValue) {
          console.error('Razón social inválida para factura:', razonSocialValue);
          return { error: 'La razón social no puede estar vacía' };
        }

        // Construimos un objeto JSON con orden estricto usando string para mayor control
        const ventaFacturaJSON = JSON.stringify({
          ruc: rucValue,
          razon_social: razonSocialValue,
          tipo_comprobante: 'FACTURA',
          fecha: venta.fecha,
          hora: venta.hora,
          total: venta.total,
          id_cliente: venta.id_cliente,
          id_empleado: venta.id_empleado,
          detalles: venta.detalles,
          pagos: venta.pagos
        });
        
        console.log('Enviando factura ordenada (JSON string):', ventaFacturaJSON);
        
        // Aquí ya no usamos postData, sino que hacemos una petición directa para tener control total
        const response = await fetch(`${API_BASE_URL}/ventas/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: ventaFacturaJSON // Usamos directamente el string JSON ya formateado
        });
        
        if (!response.ok) {
          let errorMessage = `Error al crear factura: ${response.status} ${response.statusText}`;
          try {
            const errorBody = await response.json();
            console.error('Error detallado de la API para factura:', errorBody);
            errorMessage += ` - ${JSON.stringify(errorBody)}`;
          } catch {
            const errorText = await response.text();
            if (errorText) {
              errorMessage += ` - ${errorText}`;
            }
          }
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        return { data };
      }
      
      // Para BOLETAS u otros tipos, seguimos usando el flujo normal
      console.log('Creando venta estándar (no FACTURA)');
      return await postData<Venta>('ventas/', venta);
    } catch (error) {
      console.error(`Error al crear venta:`, error);
      return { error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  },
  getDetalleVenta: async (idVenta: number): Promise<ApiResponse<DetalleVenta[]>> => {
    return fetchData<DetalleVenta[]>(`detalles-venta/${idVenta}`);
  }
};
