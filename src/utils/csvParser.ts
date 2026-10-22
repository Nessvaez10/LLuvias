import { Incident, AffectationCategory, StatusCategory } from '../types';

/**
 * Robust CSV parser that handles:
 * - Commas (,) or Semicolons (;) delimiter
 * - Quoted fields with escaped quotes ("") and line breaks
 * - Flexible header name matching (case-insensitive, accents)
 */
export function parseCSVToRows(text: string): string[][] {
  const cleanText = text.replace(/^\uFEFF/, '').trim();
  if (!cleanText) return [];

  // Determine delimiter: comma or semicolon based on first non-empty line
  const firstLine = cleanText.split(/\r\n|\n|\r/)[0];
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ';' : ',';

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < cleanText.length) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i += 2;
        continue;
      } else if (char === '"') {
        inQuotes = false;
        i++;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = '';
        i++;
        continue;
      } else if (char === '\r' || char === '\n') {
        if (char === '\r' && nextChar === '\n') {
          i += 2;
        } else {
          i++;
        }
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some(field => field.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  // Push final field/row if any
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(field => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function normalizeHeaderName(header: string): string {
  return header
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function normalizeStatusCategory(raw: string): StatusCategory {
  const s = raw.toLowerCase().trim();
  if (s.includes('atendid') || s.includes('resuelt') || s.includes('limpi') || s.includes('verde') || s.includes('abierto')) {
    return 'atendido';
  }
  if (s.includes('seguim') || s.includes('curso') || s.includes('parcial') || s.includes('provisional') || s.includes('amarill') || s.includes('trabaj')) {
    return 'en_seguimiento';
  }
  if (s.includes('pendiente') || s.includes('confirm')) {
    return 'pendiente_confirmacion';
  }
  return 'vigente_activo';
}

function normalizeAffectationCategory(raw: string): { key: AffectationCategory; label: string } {
  const s = raw.toLowerCase().trim();
  if (s.includes('deslave')) return { key: 'deslaves', label: 'DESLAVES' };
  if (s.includes('derrumbe')) return { key: 'derrumbes', label: 'DERRUMBES' };
  if (s.includes('socavon') || s.includes('socavón')) return { key: 'socavon', label: 'SOCAVÓN' };
  if (s.includes('rio') || s.includes('río') || s.includes('desborda')) return { key: 'creciente_rios', label: 'CRECIENTE DE RÍOS' };
  if (s.includes('via') || s.includes('vía') || s.includes('carretera') || s.includes('incomunica')) return { key: 'vias_accesos', label: 'VÍAS Y ACCESOS' };
  if (s.includes('encharca') || s.includes('inunda')) return { key: 'encharcamientos', label: 'ENCHARCAMIENTOS / INUNDACIONES' };
  if (s.includes('arbol') || s.includes('árbol')) return { key: 'caida_arboles', label: 'CAÍDA DE ÁRBOLES' };
  if (s.includes('luz') || s.includes('electr') || s.includes('cfe') || s.includes('suministro')) return { key: 'suministro_electrico', label: 'SUMINISTRO ELÉCTRICO' };
  if (s.includes('refugio') || s.includes('albergue')) return { key: 'refugios_temporales', label: 'REFUGIOS TEMPORALES' };
  if (s.includes('evacua')) return { key: 'evacuaciones_preventivas', label: 'EVACUACIONES PREVENTIVAS' };
  if (s.includes('persona') && s.includes('atrapad')) return { key: 'personas_atrapadas', label: 'PERSONAS ATRAPADAS' };
  if (s.includes('persona') && s.includes('sin signos')) return { key: 'persona_sin_signos', label: 'PERSONAS SIN SIGNOS VITALES' };
  if (s.includes('drenaje')) return { key: 'drenaje_colapsado', label: 'DRENAJE COLAPSADO' };
  return { key: 'vias_accesos', label: raw.toUpperCase() || 'AFECTACIÓN METEOROLÓGICA' };
}

export interface ParseCSVResult {
  incidents: Incident[];
  errors: string[];
  totalRowsParsed: number;
  stats: {
    activos: number;
    enSeguimiento: number;
    atendidos: number;
    municipiosCount: number;
  };
}

export function parseIncidentsFromCSV(csvText: string): ParseCSVResult {
  const rows = parseCSVToRows(csvText);
  const errors: string[] = [];

  if (rows.length < 2) {
    return {
      incidents: [],
      errors: ['El archivo CSV no contiene suficientes renglones o está vacío.'],
      totalRowsParsed: 0,
      stats: { activos: 0, enSeguimiento: 0, atendidos: 0, municipiosCount: 0 }
    };
  }

  const rawHeaders = rows[0];
  const colMap = new Map<string, number>();

  rawHeaders.forEach((h, idx) => {
    colMap.set(normalizeHeaderName(h), idx);
  });

  // Find column indices
  const getCol = (possibleNames: string[]): number => {
    for (const name of possibleNames) {
      const normalized = normalizeHeaderName(name);
      if (colMap.has(normalized)) {
        return colMap.get(normalized)!;
      }
    }
    return -1;
  };

  const idCol = getCol(['id', 'codigo', 'clave']);
  const munCol = getCol(['municipio', 'mpo', 'nombremunicipio']);
  const tipoCol = getCol(['tipodeafectacion', 'tipoafectacion', 'tipo', 'afectacion']);
  const comunidadCol = getCol(['comunidadpunto', 'comunidad', 'punto', 'localidad']);
  const ubicacionCol = getCol(['ubicacionespecifica', 'ubicacion', 'tramo', 'carretera']);
  const estatusOficialCol = getCol(['estatusoficial', 'estatus', 'situacion', 'estadotramo']);
  const estatusCatCol = getCol(['categoriaestatus', 'categoria', 'semaforo', 'estatuscategoria']);
  const detalleCol = getCol(['descripciondelaafectacion', 'descripcion', 'detalle', 'afectaciondetalle', 'observaciones']);
  const accionCol = getCol(['acciondeatencionoperativo', 'accionatencion', 'accion', 'operativo', 'atencion']);
  const docCol = getCol(['documentoorigen', 'origen', 'fuente', 'documento']);
  const pagCol = getCol(['pagina', 'pag']);
  const fechaCol = getCol(['fechadelreporte', 'fechareporte', 'fecha']);
  const sipdusCol = getCol(['referenciasipdus', 'sipdus']);
  const ultVerifCol = getCol(['ultimaverificacion', 'verificacion', 'actualizado']);

  if (munCol === -1) {
    return {
      incidents: [],
      errors: ['No se encontró la columna obligatoria "Municipio" en el archivo CSV.'],
      totalRowsParsed: 0,
      stats: { activos: 0, enSeguimiento: 0, atendidos: 0, municipiosCount: 0 }
    };
  }

  const incidents: Incident[] = [];
  const uniqueMunicipios = new Set<string>();
  let activos = 0;
  let enSeguimiento = 0;
  let atendidos = 0;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const municipio = (row[munCol] || '').trim();
    if (!municipio) continue; // Skip blank municipality rows

    uniqueMunicipios.add(municipio.toLowerCase());

    const id = idCol !== -1 && row[idCol] ? row[idCol].trim() : `csv-${r}-${Date.now().toString(36)}`;
    const tipoRaw = tipoCol !== -1 ? row[tipoCol] || '' : 'Afectación vial';
    const { key: tipoAfectacion, label: tipoAfectacionLabel } = normalizeAffectationCategory(tipoRaw);

    const comunidadPunto = comunidadCol !== -1 && row[comunidadCol] ? row[comunidadCol].trim() : 'Cabecera / Tramo municipal';
    const ubicacion = ubicacionCol !== -1 && row[ubicacionCol] ? row[ubicacionCol].trim() : comunidadPunto;
    const estatusOficial = estatusOficialCol !== -1 && row[estatusOficialCol] ? row[estatusOficialCol].trim() : 'ACTIVO';
    
    // Determine category status
    let estatusCategoria: StatusCategory = 'vigente_activo';
    if (estatusCatCol !== -1 && row[estatusCatCol]) {
      estatusCategoria = normalizeStatusCategory(row[estatusCatCol]);
    } else {
      estatusCategoria = normalizeStatusCategory(estatusOficial);
    }

    if (estatusCategoria === 'vigente_activo') activos++;
    else if (estatusCategoria === 'en_seguimiento') enSeguimiento++;
    else if (estatusCategoria === 'atendido') atendidos++;

    const afectacionDetalle = detalleCol !== -1 && row[detalleCol] ? row[detalleCol].trim() : 'Reporte de afectación meteorológica registrado.';
    const accionAtencion = accionCol !== -1 && row[accionCol] ? row[accionCol].trim() : undefined;
    const documentoOrigen = docCol !== -1 && row[docCol] ? row[docCol].trim() : 'Corte_Diario_Excel.csv';
    const paginaDocumento = pagCol !== -1 && row[pagCol] && !isNaN(parseInt(row[pagCol])) ? parseInt(row[pagCol]) : 1;
    const fechaReporte = fechaCol !== -1 && row[fechaCol] ? row[fechaCol].trim() : new Date().toLocaleDateString('es-MX');
    const referenciaSIPDUS = sipdusCol !== -1 && row[sipdusCol] ? row[sipdusCol].trim() : undefined;
    const ultimaVerificacion = ultVerifCol !== -1 && row[ultVerifCol] ? row[ultVerifCol].trim() : 'Actualizado vía CSV';

    incidents.push({
      id,
      municipio,
      comunidadPunto,
      ubicacion,
      tipoAfectacion,
      tipoAfectacionLabel,
      estatusOficial,
      estatusCategoria,
      afectacionDetalle,
      accionAtencion,
      documentoOrigen,
      paginaDocumento,
      fechaReporte,
      referenciaSIPDUS,
      ultimaVerificacion,
      puntosContabilizados: 1
    });
  }

  return {
    incidents,
    errors,
    totalRowsParsed: incidents.length,
    stats: {
      activos,
      enSeguimiento,
      atendidos,
      municipiosCount: uniqueMunicipios.size
    }
  };
}
