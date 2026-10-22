import React, { useState } from 'react';
import { 
  Download, 
  X, 
  FolderArchive, 
  FileCode2, 
  Terminal, 
  ExternalLink, 
  CheckCircle2, 
  Settings, 
  Folder, 
  Share2, 
  Sparkles,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { downloadProjectAsZip } from '../utils/projectZipGenerator';
import { Incident, MunicipalitySummary } from '../types';
import { exportIncidentsToCSV, exportMunicipalitiesToCSV } from '../utils/exportUtils';

interface DownloadProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: Incident[];
  municipalities: MunicipalitySummary[];
  onOpenPdfOriginal: () => void;
  onOpenExecutiveReport: () => void;
}

export const DownloadProjectModal: React.FC<DownloadProjectModalProps> = ({
  isOpen,
  onClose,
  incidents,
  municipalities,
  onOpenPdfOriginal,
  onOpenExecutiveReport,
}) => {
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [zipStatus, setZipStatus] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownloadZip = async () => {
    try {
      setIsGeneratingZip(true);
      setDownloadSuccess(false);
      await downloadProjectAsZip((status) => setZipStatus(status));
      setDownloadSuccess(true);
    } catch (err) {
      console.error(err);
      setZipStatus('Error al generar el archivo ZIP.');
    } finally {
      setIsGeneratingZip(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#531325] via-[#691C32] to-[#801e3b] text-white px-5 py-4 flex items-center justify-between border-b-2 border-[#BC955B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center border border-amber-300/30">
              <Download className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-serif leading-tight text-white">
                Descargar Proyecto y Recursos
              </h3>
              <p className="text-xs text-rose-200">
                Código fuente completo, datos de incidentes, GeoJSON y reportes oficiales
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-rose-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-slate-700 text-sm">
          {/* Main Action: 1-Click Code ZIP Download */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-amber-600 text-white px-2 py-0.5 rounded">
                    Opción Directa
                  </span>
                  <h4 className="font-bold text-slate-900 text-base">
                    Descargar Código Fuente (.ZIP)
                  </h4>
                </div>
                <p className="text-xs text-slate-600">
                  Incluye todos los archivos React, TypeScript, Leaflet, Tailwind CSS, GeoJSON de los 84 municipios, datos oficiales y README de instalación.
                </p>
              </div>

              <button
                onClick={handleDownloadZip}
                disabled={isGeneratingZip}
                className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 active:scale-95 text-white font-semibold text-xs rounded-lg shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <FolderArchive className="w-4 h-4 text-white" />
                <span>{isGeneratingZip ? 'Empaquetando...' : 'Descargar ZIP Ahora'}</span>
              </button>
            </div>

            {zipStatus && (
              <div className="mt-3 pt-3 border-t border-amber-200/60 flex items-center gap-2 text-xs font-medium text-amber-900">
                {downloadSuccess ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
                )}
                <span>{zipStatus}</span>
              </div>
            )}
          </div>

          {/* AI Studio Interface Guide (Explaining their screenshot) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-semibold">
              <Sparkles className="w-4 h-4 text-[#801e3b]" />
              <h4>Dónde están las opciones en la pantalla de Google AI Studio</h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              En tu barra superior actual (la barra negra de Google AI Studio):
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-2xs space-y-1">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <div className="p-1 rounded bg-slate-100 text-slate-700">
                    <Settings className="w-3.5 h-3.5" />
                  </div>
                  <span>Ícono de Engrane ⚙️ (Arriba a la derecha)</span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Ubicado a la derecha del botón <strong>Publish</strong>. Al hacer clic ahí accedes a la configuración y exportación.
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-2xs space-y-1">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <div className="p-1 rounded bg-slate-100 text-slate-700">
                    <Folder className="w-3.5 h-3.5" />
                  </div>
                  <span>Ícono de Carpeta 📁 / Código &lt;&gt;</span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  A la izquierda, junto a <strong>Preview</strong>. Te permite ver y copiar todos los archivos individuales del proyecto.
                </p>
              </div>
            </div>
          </div>

          {/* Quick instructions to run locally */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-900 text-slate-200 space-y-2.5 font-mono text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-sans font-semibold text-xs">
              <Terminal className="w-4 h-4" />
              <span>Cómo ejecutar el proyecto descargado en tu computadora</span>
            </div>
            <div className="space-y-1.5 text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <p className="text-slate-500 font-sans text-[11px]"># 1. Descomprime el archivo ZIP y abre la terminal en esa carpeta:</p>
              <p className="text-emerald-400">cd sistema-monitoreo-hidalgo</p>
              <p className="text-slate-500 font-sans text-[11px] pt-1"># 2. Instala las librerías:</p>
              <p className="text-emerald-400">npm install</p>
              <p className="text-slate-500 font-sans text-[11px] pt-1"># 3. Arranca la aplicación en desarrollo:</p>
              <p className="text-emerald-400">npm run dev</p>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              La aplicación se abrirá automáticamente en tu navegador en <span className="text-amber-200 underline">http://localhost:3000</span>.
            </p>
          </div>

          {/* Other Downloads: Reports and Data */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Descargar Datos y Documentos Oficiales
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => exportIncidentsToCSV(incidents)}
                className="flex items-center justify-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors cursor-pointer text-center"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Base Incidentes (CSV)</span>
              </button>

              <button
                onClick={() => exportMunicipalitiesToCSV(municipalities)}
                className="flex items-center justify-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors cursor-pointer text-center"
              >
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>Semáforo 84 Mpios (CSV)</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenExecutiveReport();
                }}
                className="flex items-center justify-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors cursor-pointer text-center"
              >
                <FileCode2 className="w-3.5 h-3.5 text-rose-700" />
                <span>Boletín Oficial (PDF)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
