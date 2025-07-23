import React, { useState, useEffect } from 'react';
import { FaSearch, FaPlus, FaExchangeAlt, FaGasPump } from 'react-icons/fa';
import { clientesApi, combustiblesApi, ventasApi } from '../api/ventasApi';
import type { Cliente, Combustible, TipoComprobante, MetodoPago, CombustibleCalculo } from '../types/venta';
import { useAuth } from '../context/useAuth';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ClienteModal from '../components/ClienteModal';
import { obtenerFechaActualPeru, fechaAFormatoISO } from '../utils/fechaUtils';

const NuevaVenta: React.FC = () => {
  const [clienteDNI, setClienteDNI] = useState('');
  const [dniError, setDniError] = useState('');
  const [placaVehiculo, setPlacaVehiculo] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [montoIngresado, setMontoIngresado] = useState('');
  const [modoPorMonto, setModoPorMonto] = useState(false);
  const [unidadMedida, setUnidadMedida] = useState<'GALONES' | 'LITROS'>('GALONES');
  const [metodoPago, setMetodoPago] = useState('');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobante>('BOLETA');
  // Estados para facturación
  const [ruc, setRuc] = useState<string>('');
  const [razonSocial, setRazonSocial] = useState<string>('');
  
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [vuelto, setVuelto] = useState(0);
  
  const [clienteEncontrado, setClienteEncontrado] = useState(false);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(false);
  const [combustibles, setCombustibles] = useState<Combustible[]>([]);
  const [combustibleSeleccionado, setCombustibleSeleccionado] = useState<Combustible | null>(null);
  const [calculoResultado, setCalculoResultado] = useState<CombustibleCalculo | null>(null);
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  
  const { user } = useAuth();
  
  // Cargar combustibles al inicio
  useEffect(() => {
    const fetchCombustibles = async () => {
      try {
        setLoading(true);
        const response = await combustiblesApi.getAll();
        if (response.data) {
          setCombustibles(response.data);
        }
      } catch (error) {
        console.error('Error al cargar combustibles:', error);
        toast.error('Error al cargar combustibles');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCombustibles();
  }, []);
  
  const buscarCliente = async () => {
    if (!clienteDNI || clienteDNI.length !== 8) {
      toast.warning('Ingrese un DNI válido de 8 dígitos');
      return;
    }
    
    try {
      setLoading(true);
      const response = await clientesApi.getByDni(clienteDNI);
      
      if (response.data) {
        setCliente(response.data);
        setClienteEncontrado(true);
      } else {
        setClienteEncontrado(false);
        toast.info('Cliente no encontrado');
      }
    } catch (error) {
      console.error('Error al buscar cliente:', error);
      toast.error('Error al buscar cliente');
      setClienteEncontrado(false);
    } finally {
      setLoading(false);
    }
  };
  
  // Esta función ahora se utiliza principalmente para el cálculo por cantidad y para 
  // actualizar el vuelto, ya que el cálculo por monto se maneja directamente en el onChange
  const calcularTotal = async () => {
    if (combustibleSeleccionado) {
      const precio = combustibleSeleccionado.precio;
      
      if (modoPorMonto && montoIngresado) {
        try {
          setLoading(true);
          // Usamos la API para calcular la cantidad de combustible a partir del monto
          const montoNum = parseFloat(montoIngresado);
          
          // Si el monto no es válido, limpiamos los resultados y salimos
          if (isNaN(montoNum) || montoNum <= 0) {
            setCantidad("");
            setSubtotal(0);
            setTotal(0);
            setCalculoResultado(null);
            setLoading(false);
            return;
          }
          
          // Llamada a la API para obtener el cálculo preciso
          const response = await combustiblesApi.calcularPorMonto(
            combustibleSeleccionado.id_combustible, 
            montoNum
          );
          
          if (response.data) {
            const calculo = response.data;
            setCalculoResultado(calculo);
            
            // Actualizamos el campo de cantidad según la unidad seleccionada
            const cantidadCalculada = unidadMedida === 'GALONES' ? 
              parseFloat(calculo.cantidad_galones.toString()) : 
              parseFloat(calculo.cantidad_litros.toString());
            
            setCantidad(cantidadCalculada.toFixed(3));
            
            // Calculamos el subtotal y total
            const subtotalCalc = montoNum;
            const totalCalc = subtotalCalc;
            
            setSubtotal(subtotalCalc);
            setTotal(totalCalc);
          }
        } catch (error) {
          console.error('Error al calcular combustible:', error);
          toast.error('Error al calcular la cantidad de combustible');
        } finally {
          setLoading(false);
        }
      } else if (!modoPorMonto && cantidad) {
        try {
          // Cálculo normal por cantidad según unidad de medida
          const cantidadNum = parseFloat(cantidad);
          let cantidadEnGalones = cantidadNum;
          
          // Si la unidad es litros, convertimos a galones para el cálculo
          if (unidadMedida === 'LITROS') {
            // Convertimos litros a galones (1 galón ≈ 3.785 litros) - cálculo inmediato
            cantidadEnGalones = cantidadNum / 3.785;
            
            try {
              // Intentamos usar la API para una conversión más precisa
              const response = await combustiblesApi.litrosAGalones(cantidadNum);
              if (response.data) {
                // Actualizamos con el valor de la API si está disponible
                cantidadEnGalones = response.data.galones;
              }
            } catch (error) {
              console.error('Error al convertir litros a galones:', error);
              // Ya tenemos el fallback configurado arriba
            }
          }
          
          // Verificamos que la cantidad sea válida
          if (isNaN(cantidadEnGalones) || cantidadEnGalones <= 0) {
            setSubtotal(0);
            setTotal(0);
            return;
          }
          
          // Calculamos el subtotal basado en la cantidad en galones y el precio por galón
          const subtotalCalc = precio * cantidadEnGalones;
          const totalCalc = subtotalCalc;
          
          setSubtotal(subtotalCalc);
          setTotal(totalCalc);
          
          // También guardamos el resultado para mostrar la conversión si es necesario
          setCalculoResultado({
            id_combustible: combustibleSeleccionado.id_combustible,
            nombre: combustibleSeleccionado.nombre,
            precio: precio,
            monto: subtotalCalc,
            cantidad_galones: cantidadEnGalones,
            cantidad_litros: unidadMedida === 'LITROS' ? cantidadNum : cantidadEnGalones * 3.785,
            stock_disponible: combustibleSeleccionado.cantidad
          });
        } catch (error) {
          console.error('Error al calcular total por cantidad:', error);
          toast.error('Error al calcular el total');
        }
      }
      
      // Cálculo del vuelto si es necesario
      if (montoRecibido) {
        const montoNum = parseFloat(montoRecibido);
        setVuelto(montoNum - total);
      }
    }
  };
  
  // Manejar cambio de combustible
  const handleCombustibleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    if (id) {
      const selectedCombustible = combustibles.find(c => c.id_combustible === id);
      if (selectedCombustible) {
        setCombustibleSeleccionado(selectedCombustible);
        
        // Actualizar precio inmediatamente
        const precio = selectedCombustible.precio;
        
        // Si estamos en modo cantidad y no hay una cantidad, ponemos 1 galón por defecto
        if (!modoPorMonto) {
          // Si no hay una cantidad o es menor o igual a cero, establecemos 1
          const cantidadNum = !cantidad || parseFloat(cantidad) <= 0 ? 1 : parseFloat(cantidad);
          setCantidad(cantidadNum.toString());
          
          // Calculamos el total inmediatamente para esta cantidad
          const subtotalCalc = precio * cantidadNum;
          setSubtotal(subtotalCalc);
          setTotal(subtotalCalc);
          
          // También guardamos el resultado para mostrar la conversión
          setCalculoResultado({
            id_combustible: selectedCombustible.id_combustible,
            nombre: selectedCombustible.nombre,
            precio: precio,
            monto: subtotalCalc,
            cantidad_galones: cantidadNum,
            cantidad_litros: unidadMedida === 'LITROS' ? cantidadNum : cantidadNum * 3.785,
            stock_disponible: selectedCombustible.cantidad
          });
        } else if (modoPorMonto) {
          // En modo monto, solo limpiamos los valores y esperamos a que el usuario calcule manualmente
          // después de completar el monto deseado
          setCantidad("");
          setSubtotal(0);
          setTotal(0);
          setCalculoResultado(null);
          
          // Mantenemos el valor del monto ingresado para que el usuario no tenga que volver a escribirlo
          // pero necesitará presionar el botón "Calcular cantidad" para obtener los resultados
          // con el nuevo combustible seleccionado
        }
      }
    } else {
      setCombustibleSeleccionado(null);
      setCantidad("");
      setSubtotal(0);
      setTotal(0);
      setCalculoResultado(null);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cliente) {
      toast.error("Debe seleccionar un cliente");
      return;
    }
    
    if (!combustibleSeleccionado) {
      toast.error("Debe seleccionar un combustible");
      return;
    }
    
    if (modoPorMonto && (!montoIngresado || parseFloat(montoIngresado) <= 0)) {
      toast.error("Debe ingresar un monto válido");
      return;
    }
    
    if (!modoPorMonto && (!cantidad || parseFloat(cantidad) <= 0)) {
      toast.error(`Debe ingresar una cantidad válida en ${unidadMedida.toLowerCase()}`);
      return;
    }
    
    if (!calculoResultado && modoPorMonto) {
      toast.error("Debe calcular primero la cantidad de combustible");
      return;
    }
    
    if (!metodoPago) {
      toast.error("Debe seleccionar un método de pago");
      return;
    }
    
    if (metodoPago === "EFECTIVO" && (!montoRecibido || parseFloat(montoRecibido) < total)) {
      toast.error("El monto recibido debe ser mayor o igual al total");
      return;
    }
    
    // Validaciones específicas para FACTURA - Validación estricta
    if (tipoComprobante === "FACTURA") {
      // Si ruc es nulo, indefinido, o no tiene exactamente 11 dígitos después de eliminar espacios
      if (!ruc || typeof ruc !== 'string') {
        toast.error("Para emitir una factura, debe ingresar un RUC válido");
        return;
      }
      
      const rucLimpio = ruc.trim();
      if (rucLimpio.length !== 11 || !/^\d+$/.test(rucLimpio)) {
        toast.error("El RUC debe contener exactamente 11 dígitos numéricos");
        return;
      }
      
      // Si razonSocial es nulo, indefinido, o es una cadena vacía después de eliminar espacios
      if (!razonSocial || typeof razonSocial !== 'string' || razonSocial.trim() === '') {
        toast.error("Para emitir una factura, debe ingresar la razón social");
        return;
      }
      
      // Mensaje de confirmación para depuración
      console.log("Validación de RUC y Razón Social exitosa:", {
        ruc: rucLimpio,
        razon_social: razonSocial.trim()
      });
    }
    
    try {
      setLoading(true);
      
      // Obtener fecha y hora actual de Perú
      const fecha = obtenerFechaActualPeru();
      const hora = fecha.toTimeString().split(' ')[0];
      
      // Fecha en formato ISO que se enviará al backend
      const fechaISO = fechaAFormatoISO(fecha);
      
      // Log para depurar
      console.log("=== NUEVA VENTA - INFORMACIÓN DE FECHA ===");
      console.log("Fecha actual Perú (objeto Date):", fecha.toString());
      console.log("Fecha actual Perú (formato local):", fecha.toLocaleDateString('es-PE'));
      console.log("Fecha formato ISO para enviar al backend:", fechaISO);
      console.log("Hora actual Perú:", hora);
      console.log("==========================================");
      
      // Obtener la cantidad final en galones, que es la unidad de la base de datos
      let cantidadFinal = parseFloat(cantidad);
      
      // Si la venta fue por monto y tenemos el cálculo, usamos esa cantidad en galones
      if (modoPorMonto && calculoResultado) {
        cantidadFinal = calculoResultado.cantidad_galones;
      } else if (!modoPorMonto && unidadMedida === 'LITROS') {
        // Si la cantidad fue ingresada en litros, convertimos a galones
        try {
          const response = await combustiblesApi.litrosAGalones(cantidadFinal);
          if (response.data) {
            cantidadFinal = response.data.galones;
          }
        } catch (error) {
          console.error('Error al convertir litros a galones:', error);
          toast.error('Error al convertir las unidades');
          return;
        }
      }
      
      const detalleVenta = {
        placa_vehiculo: placaVehiculo || undefined,
        cantidad: cantidadFinal,
        precio_unitario: typeof combustibleSeleccionado.precio === 'number' 
          ? combustibleSeleccionado.precio 
          : Number(combustibleSeleccionado.precio),
        subtotal: subtotal,
        id_combustible: combustibleSeleccionado.id_combustible
      };
      
      const pago = {
        metodo_pago: metodoPago as MetodoPago,
        monto_pago: metodoPago === "EFECTIVO" ? parseFloat(montoRecibido) : total,
        vuelto: metodoPago === "EFECTIVO" ? vuelto : 0
      };
      
      // Preparamos los datos de la venta asegurándonos de que los campos sean correctos para cada tipo de comprobante
      // Nota: Eliminamos la variable ventaDataBase ya que ahora construimos ventaData directamente
      
      // Preparamos un objeto de venta diferente según el tipo de comprobante
      let ventaData;
      
      if (tipoComprobante === "FACTURA") {
        // Para facturas, aseguramos que RUC y razón social estén presentes y sean strings
        ventaData = {
          // Primero los campos requeridos para la validación de factura
          ruc: ruc.trim(),
          razon_social: razonSocial.trim(),
          tipo_comprobante: tipoComprobante,
          // Luego el resto de campos
          fecha: fechaISO, // Usamos la variable que hemos creado arriba
          hora: hora,
          total: total,
          id_cliente: cliente.id_cliente,
          id_empleado: user?.id || 1,
          detalles: [detalleVenta],
          pagos: [pago]
        };
      } else {
        // Para boletas u otros tipos de comprobantes
        ventaData = {
          fecha: fechaISO, // Usamos la variable que hemos creado arriba
          hora: hora,
          total: total,
          id_cliente: cliente.id_cliente,
          id_empleado: user?.id || 1,
          tipo_comprobante: tipoComprobante,
          // Enviamos valores vacíos o null para estos campos
          ruc: null,
          razon_social: null,
          detalles: [detalleVenta],
          pagos: [pago]
        };
      }
      
      // Log para debugging detallado
      console.log("Enviando datos de venta:", JSON.stringify(ventaData, null, 2));
      console.log("Tipo comprobante:", tipoComprobante);
      console.log("RUC:", ruc, "Longitud:", ruc?.length, "Tipo:", typeof ruc);
      console.log("Razón Social:", razonSocial, "Tipo:", typeof razonSocial);
      
      if (tipoComprobante === "FACTURA") {
        // Log especial para confirmar que se está enviando como factura
        console.log("FACTURA - Verificación adicional:", {
          esFactura: tipoComprobante === "FACTURA",
          rucEnviado: ventaData.ruc,
          razonSocialEnviada: ventaData.razon_social
        });
      }
      
      try {
        // Creamos un objeto de venta con tipado correcto para TypeScript
        type VentaDataType = {
          fecha: string;
          hora: string;
          total: number;
          id_cliente: number;
          id_empleado: number;
          tipo_comprobante: TipoComprobante;
          detalles: Array<Record<string, unknown>>;
          pagos: Array<Record<string, unknown>>;
          ruc?: string;
          razon_social?: string;
        };
        
        // Para facturas, cuidado especial con el orden de los campos
        if (tipoComprobante === 'FACTURA') {
          console.log("Preparando factura con orden estricto de campos");
          
          // Validaciones explícitas antes de enviar
          if (!ruc || ruc.trim().length !== 11) {
            toast.error("El RUC debe tener exactamente 11 dígitos");
            setLoading(false);
            return;
          }
          
          if (!razonSocial || razonSocial.trim() === '') {
            toast.error("La razón social es obligatoria para facturas");
            setLoading(false);
            return;
          }
          
          // Para facturas, creamos primero un objeto con los campos en orden específico
          const ventaFactura = {
            // IMPORTANTE: Primero estos tres campos en este orden exacto
            ruc: ruc.trim(),
            razon_social: razonSocial.trim(),
            tipo_comprobante: 'FACTURA' as const,
            // Después el resto de campos
            fecha: fecha.toISOString().split('T')[0],
            hora: hora,
            total: total,
            id_cliente: cliente?.id_cliente || 0,
            id_empleado: user?.id || 1,
            detalles: [detalleVenta],
            pagos: [pago]
          };
          
          console.log("Datos de factura con orden estricto:", JSON.stringify(ventaFactura, null, 2));
          
          // Envío directo para facturas
          const facturaResponse = await fetch(`http://localhost:8000/api/ventas/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            // Enviamos como string JSON para mantener el orden exacto
            body: JSON.stringify(ventaFactura)
          });
          
          if (!facturaResponse.ok) {
            let errorInfo = "";
            try {
              const errorJson = await facturaResponse.json();
              errorInfo = JSON.stringify(errorJson);
            } catch {
              errorInfo = await facturaResponse.text();
            }
            
            console.error("Error al registrar factura:", facturaResponse.status, errorInfo);
            throw new Error(`Error: ${facturaResponse.status} ${facturaResponse.statusText} - ${errorInfo}`);
          }
          
          toast.success("Factura registrada con éxito");
          setLoading(false);
        } else {
          // Para boletas, usamos el flujo normal
          const ventaData: VentaDataType = {
            fecha: fecha.toISOString().split('T')[0],
            hora: hora,
            total: total,
            id_cliente: cliente?.id_cliente || 0,
            id_empleado: user?.id || 1,
            tipo_comprobante: tipoComprobante,
            detalles: [detalleVenta],
            pagos: [pago]
          };
          
          const response = await ventasApi.create(ventaData);
          
          if (response.error) {
            throw new Error(response.error);
          }
          
          toast.success("Boleta registrada con éxito");
          setLoading(false);
        }
        
        // Reiniciar formulario para todos los tipos
        setClienteDNI('');
        setPlacaVehiculo('');
        setCantidad('');
        setMontoIngresado('');
        setMetodoPago('');
        setMontoRecibido('');
        setSubtotal(0);
        setTotal(0);
        setVuelto(0);
        setClienteEncontrado(false);
        setCliente(null);
        setCombustibleSeleccionado(null);
        setCalculoResultado(null);
        setModoPorMonto(false);
        setUnidadMedida('GALONES');
        setRuc('');
        setRazonSocial('');
      } catch (error) {
        console.error(`Error al registrar la ${tipoComprobante.toLowerCase()}:`, error);
        toast.error(`Error al registrar la ${tipoComprobante.toLowerCase()}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        setLoading(false);
      }
      
      // Reiniciar formulario
      setClienteDNI('');
      setPlacaVehiculo('');
      setCantidad('');
      setMontoIngresado('');
      setMetodoPago('');
      setMontoRecibido('');
      setSubtotal(0);
      setTotal(0);
      setVuelto(0);
      setClienteEncontrado(false);
      setCliente(null);
      setCombustibleSeleccionado(null);
      setCalculoResultado(null);
      setModoPorMonto(false);
      setUnidadMedida('GALONES');
      
    } catch (error) {
      console.error("Error al registrar venta:", error);
      toast.error("Error al registrar la venta: " + (error instanceof Error ? error.message : "Error desconocido"));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <ToastContainer />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#011748]">Nueva Venta</h1>
        <p className="text-gray-600 text-sm">Registro de venta de combustible</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-[#E39E36]">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#011748] mb-4 flex items-center">
                <span className="h-5 w-1 bg-[#BA2E3B] rounded-full mr-2"></span>
                Datos del Cliente
              </h2>
              
              <div className="mb-4">
                <div className="flex items-center">
                  <div className="flex-1 mr-2">
                    <label className="block text-[#011748] text-sm font-semibold mb-2">DNI Cliente</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={clienteDNI}
                        onChange={(e) => {
                          // Solo permitir números
                          const value = e.target.value.replace(/[^\d]/g, '');
                          setClienteDNI(value);
                          // Validar en tiempo real
                          if (!/^\d{8}$/.test(value)) {
                            setDniError('El DNI debe tener 8 números');
                          } else {
                            setDniError('');
                          }
                        }}
                        className={`flex-1 bg-[#F8F8F8] border ${dniError ? 'border-[#BA2E3B]' : 'border-gray-200'} rounded-l-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#E39E36] focus:border-[#E39E36]`}
                        maxLength={8}
                        placeholder="Ingrese DNI"
                        disabled={loading}
                        inputMode="numeric"
                        pattern="\d*"
                      />
                      {dniError && (
                        <div className="w-full text-xs text-[#BA2E3B] mt-1">{dniError}</div>
                      )}
                      <button
                        type="button"
                        onClick={buscarCliente}
                        className="bg-[#011748] text-white px-4 py-2.5 rounded-r-lg hover:bg-[#011748]/90 transition duration-200"
                        disabled={loading}
                      >
                        <FaSearch />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <button 
                      type="button" 
                      className="bg-[#E39E36] text-white px-3 py-2 rounded-lg flex items-center hover:bg-[#E39E36]/90 transition duration-200 shadow-md group relative"
                      disabled={loading}
                      onClick={() => setIsClienteModalOpen(true)}
                    >
                      <FaPlus className="mr-1" />
                      <span className="text-sm font-medium">Nuevo Cliente</span>
                      <span className="absolute -bottom-8 left-0 w-32 bg-[#011748] text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">
                        Registrar cliente
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              
              {clienteEncontrado && cliente && (
                <div className="bg-[#F8F8F8] p-4 rounded-lg mb-4 border-l-4 border-[#011748] shadow-sm">
                  <p className="font-medium text-[#011748]">Cliente encontrado:</p>
                  <p className="text-gray-700 font-semibold">
                    {cliente.nombre} {cliente.apellido_paterno} {cliente.apellido_materno}
                  </p>
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-[#011748] text-sm font-semibold mb-2">Placa Vehículo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#E39E36]" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h6a1 1 0 001-1v-5a1 1 0 00-.293-.707L14.414 4H13a1 1 0 00-1-1H3z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={placaVehiculo}
                    onChange={(e) => setPlacaVehiculo(e.target.value)}
                    className="w-full bg-[#F8F8F8] border border-gray-200 rounded-lg pl-10 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#E39E36] focus:border-[#E39E36]"
                    placeholder="Ej: ABC-123"
                    disabled={loading}
                  />
                </div>
              </div>

              <h2 className="text-lg font-bold text-[#011748] mb-4 flex items-center mt-8">
                <span className="h-5 w-1 bg-[#BA2E3B] rounded-full mr-2"></span>
                Método de Pago
              </h2>
              
              <div className="mb-5">
                <label className="block text-[#011748] text-sm font-semibold mb-2">Forma de Pago</label>
                <div className="grid grid-cols-3 gap-3">
                  <div 
                    className={`p-3 border rounded-lg cursor-pointer flex flex-col items-center justify-center transition duration-200 ${metodoPago === 'EFECTIVO' ? 'bg-[#F8F8F8] border-[#E39E36] shadow-sm' : 'border-gray-300 hover:bg-gray-50'}`}
                    onClick={() => !loading && setMetodoPago('EFECTIVO')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 mb-1 ${metodoPago === 'EFECTIVO' ? 'text-[#E39E36]' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    <span className={`text-xs ${metodoPago === 'EFECTIVO' ? 'text-[#011748] font-medium' : 'text-gray-600'}`}>Efectivo</span>
                  </div>
                  
                  <div 
                    className={`p-3 border rounded-lg cursor-pointer flex flex-col items-center justify-center transition duration-200 ${metodoPago === 'TARJETA' ? 'bg-[#F8F8F8] border-[#E39E36] shadow-sm' : 'border-gray-300 hover:bg-gray-50'}`}
                    onClick={() => !loading && setMetodoPago('TARJETA')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 mb-1 ${metodoPago === 'TARJETA' ? 'text-[#E39E36]' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span className={`text-xs ${metodoPago === 'TARJETA' ? 'text-[#011748] font-medium' : 'text-gray-600'}`}>Tarjeta</span>
                  </div>
                  
                  <div 
                    className={`p-3 border rounded-lg cursor-pointer flex flex-col items-center justify-center transition duration-200 ${metodoPago === 'YAPE' ? 'bg-[#F8F8F8] border-[#E39E36] shadow-sm' : 'border-gray-300 hover:bg-gray-50'}`}
                    onClick={() => !loading && setMetodoPago('YAPE')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 mb-1 ${metodoPago === 'YAPE' ? 'text-[#E39E36]' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className={`text-xs ${metodoPago === 'YAPE' ? 'text-[#011748] font-medium' : 'text-gray-600'}`}>Yape</span>
                  </div>
                  
                  <div 
                    className={`p-3 border rounded-lg cursor-pointer flex flex-col items-center justify-center transition duration-200 ${metodoPago === 'PLIN' ? 'bg-[#F8F8F8] border-[#E39E36] shadow-sm' : 'border-gray-300 hover:bg-gray-50'}`}
                    onClick={() => !loading && setMetodoPago('PLIN')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 mb-1 ${metodoPago === 'PLIN' ? 'text-[#E39E36]' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className={`text-xs ${metodoPago === 'PLIN' ? 'text-[#011748] font-medium' : 'text-gray-600'}`}>Plin</span>
                  </div>
                  
                  <div 
                    className={`p-3 border rounded-lg cursor-pointer flex flex-col items-center justify-center transition duration-200 ${metodoPago === 'TRANSFERENCIA' ? 'bg-[#F8F8F8] border-[#E39E36] shadow-sm' : 'border-gray-300 hover:bg-gray-50'}`}
                    onClick={() => !loading && setMetodoPago('TRANSFERENCIA')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 mb-1 ${metodoPago === 'TRANSFERENCIA' ? 'text-[#E39E36]' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span className={`text-xs ${metodoPago === 'TRANSFERENCIA' ? 'text-[#011748] font-medium' : 'text-gray-600'}`}>Transferencia</span>
                  </div>
                </div>
              </div>
              
              {metodoPago === 'EFECTIVO' && (
                <div className="mb-4">
                  <label className="block text-[#011748] text-sm font-semibold mb-2">Monto Recibido</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-[#E39E36] font-bold">S/</span>
                    </div>
                    <input
                      type="number"
                      value={montoRecibido}
                      onChange={(e) => {
                        const nuevoMontoRecibido = e.target.value;
                        setMontoRecibido(nuevoMontoRecibido);
                        
                        // Calculamos el vuelto directamente con el nuevo valor
                        if (nuevoMontoRecibido && parseFloat(nuevoMontoRecibido) >= 0) {
                          const montoNum = parseFloat(nuevoMontoRecibido);
                          setVuelto(montoNum - total);
                        } else {
                          setVuelto(0);
                        }
                      }}
                      step="0.01"
                      min="0"
                      className="w-full bg-[#F8F8F8] border border-gray-200 rounded-lg pl-10 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#E39E36] focus:border-[#E39E36]"
                      placeholder="0.00"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}
              <div>
              <h2 className="text-lg font-bold text-[#011748] mb-4 flex items-center mt-8">
                <span className="h-5 w-1 bg-[#BA2E3B] rounded-full mr-2"></span>
                Resumen de Venta
              </h2>
              
              <div className="bg-[#F8F8F8] p-5 rounded-lg mb-4 shadow-sm border-l-4 border-[#E39E36]">
                {combustibleSeleccionado && (
                  <div className="mb-3 pb-3 border-b border-gray-300">
                    <div className="flex justify-between py-1">
                      <span className="text-[#011748] font-medium">Combustible:</span>
                      <span className="font-semibold text-[#011748]">{combustibleSeleccionado.nombre}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#011748] font-medium">Precio por galón:</span>
                      <span className="font-semibold text-[#011748]">S/ {Number(combustibleSeleccionado.precio).toFixed(2)}</span>
                    </div>
                    {!modoPorMonto && cantidad && (
                      <div className="flex justify-between py-1">
                        <span className="text-[#011748] font-medium">Cantidad:</span>
                        <span className="font-semibold text-[#011748]">
                          {parseFloat(cantidad).toFixed(3)} {unidadMedida === 'GALONES' ? 'galones' : 'litros'}
                        </span>
                      </div>
                    )}
                    {modoPorMonto && montoIngresado && (
                      <div className="flex justify-between py-1">
                        <span className="text-[#011748] font-medium">Monto pagado:</span>
                        <span className="font-semibold text-[#011748]">S/ {parseFloat(montoIngresado).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between py-2">
                  <span className="text-[#011748] font-medium">Subtotal:</span>
                  <span className="font-semibold text-[#011748]">S/ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-300 mt-1">
                  <span className="text-[#011748] font-medium text-lg">Total a pagar:</span>
                  <span className="font-bold text-lg text-[#BA2E3B]">S/ {total.toFixed(2)}</span>
                </div>
                
                {metodoPago === 'EFECTIVO' && montoRecibido && (
                  <div className="flex justify-between py-2 border-t border-gray-300 mt-1">
                    <span className="text-[#011748] font-medium">Vuelto:</span>
                    <span className="font-bold text-[#E39E36]">S/ {vuelto.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
            </div>
            
            <div>
              <h2 className="text-lg font-bold text-[#011748] mb-4 flex items-center">
                <span className="h-5 w-1 bg-[#BA2E3B] rounded-full mr-2"></span>
                Detalles de la Venta
              </h2>
              
              <div className="mb-4">
                <label className="block text-[#011748] text-sm font-semibold mb-2">Tipo de Combustible</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#E39E36]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <select
                    value={combustibleSeleccionado?.id_combustible || ""}
                    onChange={handleCombustibleChange}
                    className="w-full bg-[#F8F8F8] border border-gray-200 rounded-lg pl-10 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#E39E36] focus:border-[#E39E36] appearance-none"
                    disabled={loading}
                  >
                    <option value="">Seleccione combustible</option>
                    {combustibles.map(c => (
                      <option key={c.id_combustible} value={c.id_combustible}>
                        {c.nombre} - S/ {Number(c.precio).toFixed(2)}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                {combustibleSeleccionado && (
                  <div className="mt-2 p-3 bg-white border border-[#E39E36]/30 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <div className="rounded-full bg-[#E39E36]/20 p-2 mr-3">
                        <FaGasPump className="h-5 w-5 text-[#E39E36]" />
                      </div>
                      <div>
                        <p className="text-[#011748] font-semibold">
                          {combustibleSeleccionado.nombre}
                        </p>
                        <div className="flex space-x-4">
                          <span className="text-sm text-gray-600">
                            Precio: <span className="font-semibold text-[#BA2E3B]">S/ {Number(combustibleSeleccionado.precio).toFixed(2)}</span>
                          </span>
                          <span className="text-sm text-gray-600">
                            Stock: <span className="font-semibold">{Number(combustibleSeleccionado.cantidad).toFixed(2)} gal</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-gray-700 text-sm font-medium">
                    {modoPorMonto ? "Monto en Soles" : `Cantidad (${unidadMedida.toLowerCase()})`}
                  </label>
                  <div className="flex space-x-2">
                    {!modoPorMonto && (
                      <select
                        value={unidadMedida}
                        onChange={(e) => {
                          const nuevaUnidad = e.target.value as 'GALONES' | 'LITROS';
                          setUnidadMedida(nuevaUnidad);
                          
                          // Actualizar inmediatamente si hay un combustible seleccionado y una cantidad
                          if (combustibleSeleccionado && cantidad && cantidad !== "") {
                            // Obtener la cantidad actual
                            const cantidadActual = parseFloat(cantidad);
                            
                            // Si cambiamos de galones a litros o viceversa, ajustamos la cantidad mostrada
                            if (nuevaUnidad === 'LITROS' && unidadMedida === 'GALONES') {
                              // Convertir de galones a litros (aproximadamente)
                              const cantidadEnLitros = cantidadActual * 3.785;
                              setCantidad(cantidadEnLitros.toFixed(2));
                            } else if (nuevaUnidad === 'GALONES' && unidadMedida === 'LITROS') {
                              // Convertir de litros a galones (aproximadamente)
                              const cantidadEnGalones = cantidadActual / 3.785;
                              setCantidad(cantidadEnGalones.toFixed(2));
                            }
                            
                            // Recalculamos inmediatamente sin esperar
                            calcularTotal();
                          }
                        }}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                      >
                        <option value="GALONES">Galones</option>
                        <option value="LITROS">Litros</option>
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const nuevoModo = !modoPorMonto;
                        setModoPorMonto(nuevoModo);
                        
                        // Limpiar campos al cambiar modo
                        if (nuevoModo) {
                          // Cambiando a modo monto
                          setCantidad("");
                          setMontoIngresado("");
                          setSubtotal(0);
                          setTotal(0);
                          setCalculoResultado(null);
                        } else {
                          // Cambiando a modo cantidad
                          setMontoIngresado("");
                          
                          // Si hay un combustible seleccionado, ponemos 1 galón por defecto y calculamos
                          if (combustibleSeleccionado) {
                            setCantidad("1");
                            
                            // Calculamos inmediatamente
                            const precio = combustibleSeleccionado.precio;
                            const subtotalCalc = precio * 1; // 1 galón
                            setSubtotal(subtotalCalc);
                            setTotal(subtotalCalc);
                            
                            // También guardamos el resultado para mostrar la conversión
                            setCalculoResultado({
                              id_combustible: combustibleSeleccionado.id_combustible,
                              nombre: combustibleSeleccionado.nombre,
                              precio: precio,
                              monto: subtotalCalc,
                              cantidad_galones: 1,
                              cantidad_litros: 3.785, // 1 galón ≈ 3.785 litros
                              stock_disponible: combustibleSeleccionado.cantidad
                            });
                          } else {
                            setCantidad("");
                            setSubtotal(0);
                            setTotal(0);
                            setCalculoResultado(null);
                          }
                        }
                      }}
                      className="mt-2 flex items-center bg-[#F8F8F8] text-[#011748] border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-100 transition duration-200"
                    >
                      <FaExchangeAlt className="mr-2 text-[#E39E36]" />
                      <span className="text-sm">Cambiar a {modoPorMonto ? "Cantidad" : "Monto"}</span>
                    </button>
                  </div>
                </div>
                
                {modoPorMonto ? (
                  <div className="relative mt-3">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-[#E39E36] font-bold">S/</span>
                    </div>
                    <input
                      type="number"
                      value={montoIngresado}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setMontoIngresado(newValue);
                      }}
                      onBlur={() => {
                        // Solo realizamos el cálculo cuando el usuario termina de ingresar (al perder el foco)
                        if (combustibleSeleccionado && montoIngresado && parseFloat(montoIngresado) > 0) {
                          const montoNum = parseFloat(montoIngresado);
                          
                          (async () => {
                            try {
                              setLoading(true);
                              const response = await combustiblesApi.calcularPorMonto(
                                combustibleSeleccionado.id_combustible, 
                                montoNum
                              );
                              
                              if (response.data) {
                                const calculo = response.data;
                                setCalculoResultado(calculo);
                                
                                const cantidadCalculada = unidadMedida === 'GALONES' ? 
                                  parseFloat(calculo.cantidad_galones.toString()) : 
                                  parseFloat(calculo.cantidad_litros.toString());
                                
                                setCantidad(cantidadCalculada.toFixed(3));
                                setSubtotal(montoNum);
                                setTotal(montoNum);
                              }
                            } catch (error) {
                              console.error('Error al calcular combustible:', error);
                              toast.error('Error al calcular la cantidad de combustible');
                            } finally {
                              setLoading(false);
                            }
                          })();
                        }
                      }}
                      onKeyPress={(e) => {
                        // Calcular también cuando se presiona Enter
                        if (e.key === 'Enter' && combustibleSeleccionado && montoIngresado && parseFloat(montoIngresado) > 0) {
                          e.currentTarget.blur(); // Quita el foco para activar onBlur
                        }
                      }}
                      step="0.01"
                      min="0"
                      className="w-full bg-[#F8F8F8] border border-gray-200 rounded-lg pl-10 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#E39E36] focus:border-[#E39E36]"
                      placeholder="0.00"
                      disabled={loading || !combustibleSeleccionado}
                    />
                  </div>
                ) : (

<div className="relative mt-3">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-[#E39E36]">{unidadMedida === 'GALONES' ? 'G' : 'L'}</span>
                    </div>
                    <input
                      type="number"
                      value={cantidad}
                      onChange={(e) => {
                        const nuevoValor = e.target.value;
                        setCantidad(nuevoValor);
                        
                        // Si hay un combustible seleccionado y el valor es válido, actualizamos inmediatamente
                        if (combustibleSeleccionado && nuevoValor && nuevoValor !== "") {
                          const cantidadNum = parseFloat(nuevoValor);
                          if (!isNaN(cantidadNum) && cantidadNum > 0) {
                            // Calculamos inmediatamente sin esperar al efecto async
                            const precio = combustibleSeleccionado.precio;
                            let cantidadEnGalones = cantidadNum;
                            
                            // Si la unidad es litros, convertimos a galones para el cálculo inmediato
                            if (unidadMedida === 'LITROS') {
                              cantidadEnGalones = cantidadNum / 3.785;
                            }
                            
                            // Actualizamos el subtotal y total inmediatamente
                            const subtotalCalc = precio * cantidadEnGalones;
                            setSubtotal(subtotalCalc);
                            setTotal(subtotalCalc);
                            
                            // Actualizamos el resultado para la conversión
                            setCalculoResultado({
                              id_combustible: combustibleSeleccionado.id_combustible,
                              nombre: combustibleSeleccionado.nombre,
                              precio: precio,
                              monto: subtotalCalc,
                              cantidad_galones: cantidadEnGalones,
                              cantidad_litros: unidadMedida === 'LITROS' ? cantidadNum : cantidadEnGalones * 3.785,
                              stock_disponible: combustibleSeleccionado.cantidad
                            });
                          }
                          
                          // También ejecutamos el cálculo completo con la API para mayor precisión
                          calcularTotal();
                        } else if (nuevoValor === "" || parseFloat(nuevoValor) <= 0) {
                          // Si se borra la cantidad, reseteamos los valores
                          setSubtotal(0);
                          setTotal(0);
                          setCalculoResultado(null);
                        }
                      }}
                      step="0.01"
                      min="0"
                      className="w-full bg-[#F8F8F8] border border-gray-200 rounded-lg pl-10 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#E39E36] focus:border-[#E39E36]"
                      placeholder={`Cantidad en ${unidadMedida.toLowerCase()}`}
                      disabled={loading}
                    />
                  </div>
                )}
                
                {modoPorMonto && (
                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (combustibleSeleccionado && montoIngresado && parseFloat(montoIngresado) > 0) {
                          const montoNum = parseFloat(montoIngresado);
                          
                          (async () => {
                            try {
                              setLoading(true);
                              const response = await combustiblesApi.calcularPorMonto(
                                combustibleSeleccionado.id_combustible, 
                                montoNum
                              );
                              
                              if (response.data) {
                                const calculo = response.data;
                                setCalculoResultado(calculo);
                                
                                const cantidadCalculada = unidadMedida === 'GALONES' ? 
                                  parseFloat(calculo.cantidad_galones.toString()) : 
                                  parseFloat(calculo.cantidad_litros.toString());
                                
                                setCantidad(cantidadCalculada.toFixed(3));
                                setSubtotal(montoNum);
                                setTotal(montoNum);
                              }
                            } catch (error) {
                              console.error('Error al calcular combustible:', error);
                              toast.error('Error al calcular la cantidad de combustible');
                            } finally {
                              setLoading(false);
                            }
                          })();
                        } else {
                          toast.warning('Ingrese un monto válido primero');
                        }
                      }}
                      className="w-full bg-blue-600 text-white text-sm px-4 py-1 rounded-lg hover:bg-blue-700 mb-1"
                      disabled={loading || !combustibleSeleccionado || !montoIngresado}
                    >
                      Calcular cantidad
                    </button>
                    
                    {calculoResultado && (
                      <div className="text-xs bg-blue-50 p-2 rounded-lg">
                        <p className="text-blue-700">
                          Recibirá: <span className="font-semibold">{parseFloat(calculoResultado.cantidad_galones.toString()).toFixed(3)} galones</span> 
                          <span> ≈ {parseFloat(calculoResultado.cantidad_litros.toString()).toFixed(3)} litros</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {!modoPorMonto && cantidad && parseFloat(cantidad) > 0 && combustibleSeleccionado && (
                  <div className="mt-1 text-xs bg-blue-50 p-2 rounded-lg">
                    {unidadMedida === 'LITROS' ? (
                      <p className="text-blue-700">
                        <span className="font-semibold">{parseFloat(cantidad).toFixed(2)} litros</span> ≈ 
                        {calculoResultado ? (
                          <span> {parseFloat(calculoResultado.cantidad_galones.toString()).toFixed(3)} galones</span>
                        ) : (
                          <span> {(parseFloat(cantidad) / 3.785).toFixed(3)} galones</span>
                        )}
                      </p>
                    ) : (
                      <p className="text-blue-700">
                        <span className="font-semibold">{parseFloat(cantidad).toFixed(2)} galones</span> ≈ 
                        {calculoResultado ? (
                          <span> {parseFloat(calculoResultado.cantidad_litros.toString()).toFixed(3)} litros</span>
                        ) : (
                          <span> {(parseFloat(cantidad) * 3.785).toFixed(3)} litros</span>
                        )}
                      </p>
                    )}
                    <p className="text-blue-700 mt-1">
                      <span className="font-semibold">Total a pagar:</span> S/ {total.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              <div className="mb-5">
                <h3 className="text-[#011748] text-sm font-semibold mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Tipo de Comprobante
                </h3>
                <div className="flex space-x-4">
                  <div 
                    className={`flex-1 p-3 border rounded-lg cursor-pointer flex items-center transition duration-200 ${tipoComprobante === 'BOLETA' ? 'bg-[#F8F8F8] border-[#E39E36] shadow-sm' : 'border-gray-300 hover:bg-gray-50'}`}
                    onClick={() => !loading && setTipoComprobante('BOLETA')}
                  >
                    <div className={`w-4 h-4 rounded-full border ${tipoComprobante === 'BOLETA' ? 'border-[#E39E36]' : 'border-gray-400'} mr-2 flex items-center justify-center`}>
                      {tipoComprobante === 'BOLETA' && <div className="w-2 h-2 rounded-full bg-[#E39E36]"></div>}
                    </div>
                    <span className={`text-sm ${tipoComprobante === 'BOLETA' ? 'text-[#011748] font-medium' : 'text-gray-600'}`}>Boleta</span>
                  </div>
                  <div 
                    className={`flex-1 p-3 border rounded-lg cursor-pointer flex items-center transition duration-200 ${tipoComprobante === 'FACTURA' ? 'bg-[#F8F8F8] border-[#E39E36] shadow-sm' : 'border-gray-300 hover:bg-gray-50'}`}
                    onClick={() => !loading && setTipoComprobante('FACTURA')}
                  >
                    <div className={`w-4 h-4 rounded-full border ${tipoComprobante === 'FACTURA' ? 'border-[#E39E36]' : 'border-gray-400'} mr-2 flex items-center justify-center`}>
                      {tipoComprobante === 'FACTURA' && <div className="w-2 h-2 rounded-full bg-[#E39E36]"></div>}
                    </div>
                    <span className={`text-sm ${tipoComprobante === 'FACTURA' ? 'text-[#011748] font-medium' : 'text-gray-600'}`}>Factura</span>
                  </div>
                </div>
              </div>

              {tipoComprobante === "FACTURA" && (
                <>
                  <div className="mb-3">
                    <label className="block text-[#011748] text-sm font-semibold mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                      RUC <span className="text-[#BA2E3B] ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={ruc}
                      onChange={(e) => setRuc(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#E39E36] focus:border-[#E39E36]"
                      placeholder="Ingrese RUC (11 dígitos)"
                      maxLength={11}
                      disabled={loading}
                      required
                    />
                    {ruc && ruc.length !== 11 && (
                      <p className="text-xs text-[#BA2E3B] mt-1">El RUC debe contener 11 dígitos</p>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="block text-[#011748] text-sm font-semibold mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Razón Social <span className="text-[#BA2E3B] ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={razonSocial}
                      onChange={(e) => setRazonSocial(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#E39E36] focus:border-[#E39E36]"
                      placeholder="Ingrese Razón Social"
                      disabled={loading}
                      required
                    />
                    {razonSocial && razonSocial.trim() === '' && (
                      <p className="text-xs text-[#BA2E3B] mt-1">La razón social es obligatoria</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          
         
          
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-[#011748] font-medium hover:bg-[#F8F8F8] transition duration-200"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#BA2E3B] text-white font-medium rounded-lg hover:bg-[#BA2E3B]/90 transition duration-200 shadow-md flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registrando...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Registrar Venta
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de creación de cliente */}
      <ClienteModal 
        isOpen={isClienteModalOpen}
        onClose={() => setIsClienteModalOpen(false)}
        onClienteCreated={(nuevoCliente) => {
          setCliente(nuevoCliente);
          setClienteDNI(nuevoCliente.dni);
          setClienteEncontrado(true);
          setIsClienteModalOpen(false);
          toast.success('Cliente registrado con éxito');
        }}
      />
    </div>
  );
};

export default NuevaVenta;
