// Interfaces para los datos de la API
export interface Cliente {
  id_cliente?: number;
  dni: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  celular?: string;
  direccion?: string;
}

export interface Combustible {
  id_combustible: number;
  nombre: string;
  precio: number;
  cantidad: number;
}

export interface CombustibleCalculo {
  id_combustible: number;
  nombre: string;
  precio: number;
  monto: number;
  cantidad_galones: number;
  cantidad_litros: number;
  stock_disponible: number;
}

export interface DetalleVenta {
  id_detalle?: number;
  placa_vehiculo?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  id_combustible: number;
}

export type MetodoPago = 
  | "EFECTIVO"
  | "TARJETA"
  | "YAPE"
  | "PLIN"
  | "TRANSFERENCIA";

export type TipoComprobante = 
  | "BOLETA" 
  | "FACTURA";

export interface Pago {
  id_pago?: number;
  metodo_pago: MetodoPago;
  monto_pago: number;
  vuelto: number;
}

export interface Venta {
  id_venta?: number;
  fecha: string;
  hora: string;
  total: number;
  id_cliente: number;
  id_empleado: number;
  tipo_comprobante: TipoComprobante;
  ruc?: string;
  razon_social?: string;
  detalles: DetalleVenta[];
  pagos: Pago[];
  cliente?: Cliente;
}
