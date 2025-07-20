import React, { useRef } from 'react';
import { FaPrint, FaFilePdf, FaTimes } from 'react-icons/fa';
import type { Venta, Cliente, DetalleVenta, Pago, Combustible } from '../types/venta';
import './ComprobanteStyles.css';
import { useReactToPrint } from 'react-to-print';
import logoRepsol from '../assets/images/repsol-209.jpg';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface VentaDetalleModalProps {
  isOpen: boolean;
  onClose: () => void;
  venta: Venta | null;
  cliente: Cliente | null;
  detalles: (DetalleVenta & { combustible?: Combustible })[];
  pagos: Pago[];
  empleado?: { nombre: string; apellido: string } | null;
}

const VentaDetalleModal: React.FC<VentaDetalleModalProps> = ({ 
  isOpen, 
  onClose, 
  venta, 
  cliente, 
  detalles, 
  pagos,
  empleado
}) => {
  const comprobanteRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: comprobanteRef,
    documentTitle: venta ? `${venta.tipo_comprobante}-${venta.id_venta}` : '',
    onAfterPrint: () => console.log('Impresión completada')
  });

  const handleExportPDF = async () => {
    if (!comprobanteRef.current) return;
    
    try {
      // Mostrar algún indicador de carga si es necesario
      console.log('Generando PDF...');
      
      const canvas = await html2canvas(comprobanteRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Calcular la relación de aspecto para mantenerla en el PDF
      const imgWidth = 210; // A4 width in mm (210mm)
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Guardar el PDF con un nombre descriptivo
      const fileName = venta ? `${venta.tipo_comprobante}_${venta.id_venta}.pdf` : 'comprobante.pdf';
      pdf.save(fileName);
      
      console.log('PDF generado con éxito');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor intente nuevamente.');
    }
  };

  // No mostrar nada si el modal no está abierto o no hay venta seleccionada
  if (!isOpen) return null;
  
  // Verificar que tengamos los datos mínimos necesarios
  if (!venta) {
    console.error("Error: No se proporcionó objeto de venta al modal");
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-96">
          <h3 className="text-xl font-bold text-[#011748] mb-4">Error</h3>
          <p className="text-gray-600 mb-4">No se pudieron cargar los detalles de la venta.</p>
          <button 
            onClick={onClose} 
            className="w-full bg-[#011748] text-white py-2 rounded-lg hover:bg-[#011748]/90"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

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

  const getMetodoPago = () => {
    if (!pagos || pagos.length === 0) return 'N/A';
    return pagos[0].metodo_pago;
  };

  // Asegurarnos de que venta.total sea un número válido
  const total = venta.total && !isNaN(Number(venta.total)) ? Number(venta.total) : 0;
  
  // Calcular valores para la factura
  const subtotal = venta.tipo_comprobante === 'FACTURA' 
    ? total / 1.18 
    : total;
  
  const igv = venta.tipo_comprobante === 'FACTURA' 
    ? total - subtotal 
    : 0;

  // Determinar si es factura o boleta para mostrar la información correcta
  const esFactura = venta.tipo_comprobante === 'FACTURA';
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 my-8 border-t-4 border-[#E39E36]">
        {/* Cabecera del modal */}
        <div className="flex justify-between items-center border-b border-[#E39E36]/30 p-4 no-print bg-[#F8F8F8]">
          <h3 className="text-xl font-bold text-[#011748]">
            Repsol - {esFactura ? 'Factura' : 'Boleta de Venta'} #{venta.id_venta}
          </h3>
          <div className="flex space-x-2">
            <button 
              onClick={handlePrint} 
              className="p-2 bg-[#011748]/10 text-[#011748] rounded-lg hover:bg-[#011748]/20 transition-colors"
              title="Imprimir"
            >
              <FaPrint />
            </button>
            <button 
              onClick={handleExportPDF}
              className="p-2 bg-[#BA2E3B]/10 text-[#BA2E3B] rounded-lg hover:bg-[#BA2E3B]/20 transition-colors"
              title="Exportar PDF"
            >
              <FaFilePdf />
            </button>
            <button 
              onClick={onClose} 
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              title="Cerrar"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Contenido imprimible del comprobante */}
        <div ref={comprobanteRef} className="comprobante-print-section p-8">
          {/* Encabezado del comprobante */}
          <div className="mb-6 border-b pb-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <img src={logoRepsol} alt="Logo Repsol" className="w-24 h-24 mr-4" />
                <div>
                  <h2 className="text-2xl font-bold text-[#011748]">ESTACIÓN DE SERVICIOS</h2>
                  <h3 className="text-xl font-bold text-[#E39E36]">REPSOL</h3>
                  <p className="text-sm text-gray-600">R.U.C. 20548756921</p>
                  <p className="text-sm text-gray-600">Av. La Marina 1234, San Miguel - Lima</p>
                  <p className="text-sm text-gray-600">Telf: (01) 555-1234</p>
                </div>
              </div>
              <div className="border-2 border-[#011748] px-6 py-4 rounded-md bg-[#F8F8F8]">
                <p className="font-bold text-lg text-center mb-2 text-[#011748]">{esFactura ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA'}</p>
                <p className="font-bold text-lg text-center text-[#BA2E3B]">REPSOL N° {String(venta.id_venta).padStart(8, '0')}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <div className="flex">
                  <p className="text-sm w-32 font-semibold">Fecha emisión:</p>
                  <p className="text-sm">{formatFecha(venta.fecha)}</p>
                </div>
                <div className="flex">
                  <p className="text-sm w-32 font-semibold">Hora emisión:</p>
                  <p className="text-sm">{venta.hora}</p>
                </div>
                <div className="flex">
                  <p className="text-sm w-32 font-semibold">Atendido por:</p>
                  <p className="text-sm">{empleado ? `${empleado.nombre} ${empleado.apellido}` : 'Vendedor'}</p>
                </div>
                <div className="flex mt-2">
                  <p className="text-sm w-32 font-semibold">Método de pago:</p>
                  <p className="text-sm">{getMetodoPago()}</p>
                </div>
              </div>
              <div>
                <div className="flex">
                  <p className="text-sm w-32 font-semibold">{esFactura ? 'Razón Social:' : 'Cliente:'}</p>
                  <p className="text-sm">{
                    esFactura 
                      ? venta.razon_social 
                      : cliente ? `${cliente.nombre} ${cliente.apellido_paterno} ${cliente.apellido_materno}` : 'Cliente General'
                  }</p>
                </div>
                <div className="flex">
                  <p className="text-sm w-32 font-semibold">{esFactura ? 'RUC:' : 'DNI:'}</p>
                  <p className="text-sm">{
                    esFactura 
                      ? venta.ruc 
                      : cliente?.dni || 'Sin documento'
                  }</p>
                </div>
                {esFactura && cliente && (
                  <>
                    <div className="flex mt-2">
                      <p className="text-sm w-32 font-semibold">Cliente:</p>
                      <p className="text-sm">{`${cliente.nombre} ${cliente.apellido_paterno} ${cliente.apellido_materno}`}</p>
                    </div>
                    {cliente.direccion && (
                      <div className="flex">
                        <p className="text-sm w-32 font-semibold">Dirección:</p>
                        <p className="text-sm">{cliente.direccion}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Detalle de productos */}
          <div className="mb-6">
            <h4 className="font-bold text-[#011748] mb-3">DETALLE DE COMBUSTIBLES</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-[#E39E36]/30 rounded-md shadow-sm">
                <thead>
                  <tr className="bg-[#011748] text-white uppercase text-sm">
                    <th className="py-3 px-4 text-left">DESCRIPCIÓN</th>
                    <th className="py-3 px-4 text-right">CANT.</th>
                    <th className="py-3 px-4 text-right">UNI.</th>
                    <th className="py-3 px-4 text-right">P. UNIT</th>
                    <th className="py-3 px-4 text-right">SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm">
                  {detalles.map((detalle, index) => {
                    // Asegurar que los valores sean números
                    const cantidad = typeof detalle.cantidad === 'number' ? detalle.cantidad : Number(detalle.cantidad);
                    const precioUnitario = typeof detalle.precio_unitario === 'number' ? detalle.precio_unitario : Number(detalle.precio_unitario);
                    const subtotal = typeof detalle.subtotal === 'number' ? detalle.subtotal : Number(detalle.subtotal);
                    
                    return (
                      <tr key={index} className={`border-b border-[#E39E36]/10 ${index % 2 === 0 ? 'bg-[#F8F8F8]' : 'bg-white'}`}>
                        <td className="py-3 px-4 font-medium text-[#011748]">{detalle.combustible?.nombre || 'Combustible'}</td>
                        <td className="py-3 px-4 text-right">{!isNaN(cantidad) ? cantidad.toFixed(3) : '0.000'}</td>
                        <td className="py-3 px-4 text-right">GAL</td>
                        <td className="py-3 px-4 text-right">S/ {!isNaN(precioUnitario) ? precioUnitario.toFixed(2) : '0.00'}</td>
                        <td className="py-3 px-4 text-right font-medium">S/ {!isNaN(subtotal) ? subtotal.toFixed(2) : '0.00'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totales e información adicional */}
          <div className="grid grid-cols-2 gap-8">
            {/* Información adicional */}
            <div className="text-sm">
              <div className="mb-4">
                {detalles.length > 0 && detalles[0].placa_vehiculo && (
                  <div className="flex">
                    <p className="w-32 font-semibold">Placa:</p>
                    <p>{detalles[0].placa_vehiculo}</p>
                  </div>
                )}
                {pagos.length > 0 && pagos[0].metodo_pago === 'EFECTIVO' && (
                  <>
                    <div className="flex">
                      <p className="w-32 font-semibold">Monto recibido:</p>
                      <p>S/ {typeof pagos[0].monto_pago === 'number' ? pagos[0].monto_pago.toFixed(2) : Number(pagos[0].monto_pago).toFixed(2)}</p>
                    </div>
                    <div className="flex">
                      <p className="w-32 font-semibold">Vuelto:</p>
                      <p>S/ {typeof pagos[0].vuelto === 'number' ? pagos[0].vuelto.toFixed(2) : Number(pagos[0].vuelto).toFixed(2)}</p>
                    </div>
                  </>
                )}
              </div>
              
              <div className="mt-6 p-4 bg-[#F8F8F8] rounded-md border-l-4 border-[#E39E36]">
                <p className="font-semibold mb-2 text-[#011748]">Información importante:</p>
                <p className="text-sm text-gray-600 mb-1">• Asegúrese de revisar la cantidad y tipo de combustible.</p>
                <p className="text-sm text-gray-600 mb-1">• No se aceptan devoluciones después de surtido el combustible.</p>
                <p className="text-sm text-gray-600">• Repsol: Para consultas o reclamos comuníquese al (01) 555-1234.</p>
              </div>
            </div>
            
            {/* Totales */}
            <div>
              <div className="border-t border-[#E39E36]/30 pt-3 ml-auto" style={{ width: '250px' }}>
                {esFactura ? (
                  <>
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold text-[#011748]">OP. GRAVADA:</span>
                      <span>S/ {!isNaN(subtotal) ? subtotal.toFixed(2) : '0.00'}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold text-[#011748]">IGV (18%):</span>
                      <span>S/ {!isNaN(igv) ? igv.toFixed(2) : '0.00'}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-[#011748]">SUBTOTAL:</span>
                    <span>S/ {!isNaN(subtotal) ? subtotal.toFixed(2) : '0.00'}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-[#E39E36] pt-2 mt-2">
                  <span className="text-[#011748]">TOTAL:</span>
                  <span className="text-[#BA2E3B]">S/ {!isNaN(Number(venta.total)) ? Number(venta.total).toFixed(2) : '0.00'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-[#E39E36]/30 text-gray-600 text-sm">
            <div className="text-center">
              <p className="font-medium mb-1 text-[#011748]">¡Gracias por su preferencia!</p>
              <p>Este documento es un comprobante electrónico válido de su compra.</p>
              <p className="mt-2">REPSOL - Autorizado mediante R.S. N° 203-2020/SUNAT</p>
            </div>
            
            {esFactura && (
              <div className="mt-6 bg-[#F8F8F8] p-4 rounded-md text-xs">
                <p className="font-semibold text-[#011748] mb-2">INFORMACIÓN ADICIONAL:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Representación impresa de la Factura Electrónica</li>
                  <li>Puede consultar este documento en: www.repsol.com.pe/consulta</li>
                  <li>El emisor electrónico puede validar este documento en el portal de SUNAT (www.sunat.gob.pe)</li>
                  <li>Esta factura se considerará aceptada si no se recibe reclamo en el plazo de 7 días.</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VentaDetalleModal;
