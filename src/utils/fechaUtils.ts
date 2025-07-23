/**
 * Utilidades para el manejo de fechas en la aplicación considerando la zona horaria de Perú (UTC-5)
 */

/**
 * Obtiene la fecha actual en Perú (UTC-5)
 * @returns {Date} Fecha actual en zona horaria de Perú
 */
export const obtenerFechaActualPeru = (): Date => {
  // Obtener la fecha actual en UTC y ajustar a la zona horaria de Perú (UTC-5)
  const now = new Date();
  // Obtenemos la fecha y hora en UTC
  const anioUTC = now.getUTCFullYear();
  const mesUTC = now.getUTCMonth(); // 0-11
  const diaUTC = now.getUTCDate();
  const horaUTC = now.getUTCHours();
  const minutosUTC = now.getUTCMinutes();
  const segundosUTC = now.getUTCSeconds();

  // Ajustamos la hora UTC a hora peruana (UTC-5)
  let horaPeru = horaUTC - 5;
  let diaPeru = diaUTC;
  let mesPeru = mesUTC;
  let anioPeru = anioUTC;

  if (horaPeru < 0) {
    horaPeru += 24;
    diaPeru -= 1;
    if (diaPeru < 1) {
      mesPeru -= 1;
      if (mesPeru < 0) {
        mesPeru = 11; // Diciembre
        anioPeru -= 1;
      }
      const ultimoDiaMesAnterior = new Date(anioPeru, mesPeru + 1, 0).getDate();
      diaPeru = ultimoDiaMesAnterior;
    }
  }
  // Crear la fecha peruana con los valores calculados
  const fechaPeru = new Date(anioPeru, mesPeru, diaPeru, horaPeru, minutosUTC, segundosUTC);
  return fechaPeru;
};

/**
 * Formatea una fecha en formato ISO o string a formato DD/MM/YYYY (formato peruano)
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @returns {string} Fecha formateada en DD/MM/YYYY
 */
export const formatearFecha = (fecha: string): string => {
  try {
    // Parsear la fecha manualmente para evitar problemas con zonas horarias
    const [year, month, day] = fecha.split('-').map(num => parseInt(num, 10));
    
    // Validar que los componentes de la fecha sean válidos
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      console.error('Formato de fecha inválido:', fecha);
      return 'Fecha inválida';
    }
    
    // Restar 1 al mes porque en JavaScript los meses van de 0 a 11
    const date = new Date(year, month - 1, day);
    
    // Verificar si la fecha resultante es válida
    if (isNaN(date.getTime())) {
      console.error('Fecha inválida después de parsear:', fecha);
      return 'Fecha inválida';
    }
    
    // Formato de fecha en Perú: DD/MM/YYYY
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  } catch (error) {
    console.error('Error al formatear fecha:', error, fecha);
    return 'Error de formato';
  }
};

/**
 * Convierte una fecha a formato ISO (YYYY-MM-DD)
 * @param {Date} fecha - Objeto Date
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const fechaAFormatoISO = (fecha: Date): string => {
  // Devuelve la fecha en formato YYYY-MM-DD
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};