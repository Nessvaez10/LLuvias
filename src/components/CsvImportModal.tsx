import React, { useState, useRef } from 'react';
import { Incident } from '../types';
import { parseIncidentsFromCSV, ParseCSVResult } from '../utils/csvParser';
import { exportIncidentsToCSV } from '../utils/exportUtils';
import { 
  X, 
  FileSpreadsheet, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  FileCheck, 
  ArrowRight,
  Database,
  RefreshCw,
  Info
} from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentIncidents: Incident[];
  onImportIncidents: (newIncidents: Incident[], mode: 'replace' | 'merge') => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  currentIncidents,
  onImportIncidents,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseCSVResult | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const result = parseIncidentsFromCSV(text);
        setParseResult(result);
      } catch (err) {
        console.error("Error al procesar archivo CSV:", err);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setIsProcessing(false);
      alert("Hubo un error al leer el archivo seleccionado.");
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv') || file.type.includes('csv') || file.type.includes('excel')) {
        handleFileProcess(file);
      } else {
        alert("Por favor selecciona un archivo con extensión .csv (valores separados por comas o punto y coma).");
      }
    }
  };

  const handleApply = () => {
    if (!parseResult || parseResult.incidents.length === 0) return;
    onImportIncidents(parseResult.incidents, importMode);
    onClose();
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParseResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1e4620] via-[#2d5f2a] to-[#15803d] text-white px-5 py-4 flex items-center justify-between border-b-2 border-emerald-400">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center border border-emerald-300/30">
              <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-serif leading-tight text-white">
                Actualizar Corte Diario vía Excel / CSV
              </h3>
              <p className="text-xs text-emerald-100">
                Flujo operativo de oficina: edita en Excel, arrastra el archivo y actualiza el semáforo al instante
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-100 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-700 text-sm">
          {/* Step 1: Export template */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">1</span>
                <span className="font-bold text-slate-800 text-xs">¿Necesitas la plantilla o el corte actual para editar?</span>
              </div>
              <p className="text-[11px] text-slate-600 pl-7">
                Descarga el archivo actual para abrirlo en Microsoft Excel o Google Sheets, actualizar las celdas de estatus y guardarlo como .CSV.
              </p>
            </div>
            <button
              onClick={() => exportIncidentsToCSV(currentIncidents, `corte_diario_hidalgo_${new Date().toISOString().split('T')[0]}.csv`)}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Descargar Base Actual (CSV)</span>
            </button>
          </div>

          {/* Step 2: Upload Zone */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center">2</span>
              <span className="font-bold text-slate-800 text-xs">Cargar el archivo CSV modificado de hoy</span>
            </div>

            {!selectedFile ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  dragOver 
                    ? 'border-emerald-500 bg-emerald-50/60' 
                    : 'border-slate-300 hover:border-emerald-400 bg-slate-50 hover:bg-white'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept=".csv,text/csv,application/vnd.ms-excel" 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileProcess(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-2 shadow-2xs">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-slate-800 text-sm">
                  Arrastra tu archivo .CSV aquí o haz clic para explorar
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Soporta archivos generados por Excel separados por comas o punto y coma (;).
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{selectedFile.name}</p>
                      <p className="text-[11px] text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    className="text-xs text-slate-500 hover:text-red-600 underline cursor-pointer"
                  >
                    Cambiar archivo
                  </button>
                </div>

                {isProcessing ? (
                  <div className="py-4 text-center text-xs text-slate-600 flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Analizando columnas y validando registros...</span>
                  </div>
                ) : parseResult ? (
                  parseResult.errors.length > 0 ? (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>No se pudo procesar el archivo:</span>
                      </div>
                      {parseResult.errors.map((err, i) => (
                        <p key={i} className="pl-5 text-red-600">{err}</p>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Summary stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="block text-[10px] text-slate-500 uppercase font-semibold">Total Registros</span>
                          <span className="text-base font-bold text-slate-800">{parseResult.totalRowsParsed}</span>
                        </div>
                        <div className="bg-red-50 p-2.5 rounded-lg border border-red-200">
                          <span className="block text-[10px] text-red-700 uppercase font-semibold">Vigentes / Activos</span>
                          <span className="text-base font-bold text-red-700">{parseResult.stats.activos}</span>
                        </div>
                        <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                          <span className="block text-[10px] text-amber-700 uppercase font-semibold">En Seguimiento</span>
                          <span className="text-base font-bold text-amber-700">{parseResult.stats.enSeguimiento}</span>
                        </div>
                        <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                          <span className="block text-[10px] text-emerald-700 uppercase font-semibold">Atendidos</span>
                          <span className="text-base font-bold text-emerald-700">{parseResult.stats.atendidos}</span>
                        </div>
                      </div>

                      {/* Import mode options */}
                      <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                        <span className="block font-bold text-xs text-slate-800">Modo de aplicación:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                            importMode === 'replace' ? 'bg-emerald-50/70 border-emerald-500 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}>
                            <input 
                              type="radio" 
                              name="importMode" 
                              checked={importMode === 'replace'} 
                              onChange={() => setImportMode('replace')}
                              className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                            />
                            <div>
                              <p className="font-semibold text-xs">Reemplazar base completa</p>
                              <p className="text-[11px] text-slate-500">Recomendado para el corte diario de Protección Civil.</p>
                            </div>
                          </label>

                          <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                            importMode === 'merge' ? 'bg-emerald-50/70 border-emerald-500 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}>
                            <input 
                              type="radio" 
                              name="importMode" 
                              checked={importMode === 'merge'} 
                              onChange={() => setImportMode('merge')}
                              className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                            />
                            <div>
                              <p className="font-semibold text-xs">Fusionar / Actualizar</p>
                              <p className="text-[11px] text-slate-500">Actualiza coincidencias y conserva los demás incidentes.</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Small preview table */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase">Vista previa (Primeros 3 registros):</span>
                        <div className="border border-slate-200 rounded-lg overflow-x-auto text-[11px] bg-white">
                          <table className="w-full text-left">
                            <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                              <tr>
                                <th className="py-1.5 px-2">Municipio</th>
                                <th className="py-1.5 px-2">Punto / Tramo</th>
                                <th className="py-1.5 px-2">Estatus</th>
                                <th className="py-1.5 px-2">Categoría</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {parseResult.incidents.slice(0, 3).map((inc, i) => (
                                <tr key={i}>
                                  <td className="py-1.5 px-2 font-semibold text-slate-800">{inc.municipio}</td>
                                  <td className="py-1.5 px-2 text-slate-600 truncate max-w-[150px]">{inc.comunidadPunto}</td>
                                  <td className="py-1.5 px-2 text-slate-600 truncate max-w-[120px]">{inc.estatusOficial}</td>
                                  <td className="py-1.5 px-2">
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                      inc.estatusCategoria === 'vigente_activo' ? 'bg-red-100 text-red-800' :
                                      inc.estatusCategoria === 'en_seguimiento' ? 'bg-amber-100 text-amber-800' :
                                      'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      {inc.estatusCategoria}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )
                ) : null}
              </div>
            )}
          </div>

          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 border border-slate-200 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p>
              Al hacer clic en <strong>«Aplicar al Sistema»</strong>, todos los 84 municipios recalcularán su semáforo de riesgo (rojo, naranja, amarillo, verde) de forma automática e inmediata, y los cambios se guardarán en tu navegador.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleApply}
            disabled={!parseResult || parseResult.incidents.length === 0}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:scale-95 text-white text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Aplicar {parseResult?.totalRowsParsed || 0} Registros al Sistema</span>
          </button>
        </div>
      </div>
    </div>
  );
};
