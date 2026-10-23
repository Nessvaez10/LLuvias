import React, { useState, useMemo, useEffect } from 'react';
import { 
  MunicipalitySummary, 
  Incident, 
  SemaforoLevel, 
  AffectationCategory,
  StatusCategory,
  ExtractionChangeItem
} from './types';
import { INITIAL_OFFICIAL_INCIDENTS, OFFICIAL_REPORT_METADATA } from './data/officialIncidents';
import { buildMunicipalitiesSummary } from './utils/semaforoLogic';
import { Header } from './components/Header';
import { MapComponent } from './components/MapComponent';
import { DashboardMetrics } from './components/DashboardMetrics';
import { IncidentsTable } from './components/IncidentsTable';
import { MunicipalityDetailModal } from './components/MunicipalityDetailModal';
import { SemaforoCriteriaModal } from './components/SemaforoCriteriaModal';
import { ReportUploadModal } from './components/ReportUploadModal';
import { ExecutiveReportModal } from './components/ExecutiveReportModal';
import { DownloadProjectModal } from './components/DownloadProjectModal';
import { CsvImportModal } from './components/CsvImportModal';
import { AddIncidentModal } from './components/AddIncidentModal';
import { FileText, X, ExternalLink, ShieldCheck, RotateCcw } from 'lucide-react';

const STORAGE_INCIDENTS_KEY = 'hidalgo_meteorologico_incidents_v2';
const STORAGE_OVERRIDES_KEY = 'hidalgo_meteorologico_overrides_v2';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'mapa' | 'dashboard' | 'tabla'>('mapa');

  // Load from localStorage or fallback to official initial data
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_INCIDENTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error al cargar incidentes guardados:", e);
    }
    return INITIAL_OFFICIAL_INCIDENTS;
  });

  const [userOverrides, setUserOverrides] = useState<Record<string, { semaforo: SemaforoLevel; validado: boolean; motivo: string }>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_OVERRIDES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error al cargar validaciones manuales:", e);
    }
    return {};
  });
  
  // Selected municipality for detailed inspection
  const [selectedMunicipality, setSelectedMunicipality] = useState<MunicipalitySummary | null>(null);

  // Modals state
  const [isCriteriaOpen, setIsCriteriaOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isExecutiveReportOpen, setIsExecutiveReportOpen] = useState<boolean>(false);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState<boolean>(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState<boolean>(false);
  const [isImportCsvOpen, setIsImportCsvOpen] = useState<boolean>(false);
  const [isAddIncidentOpen, setIsAddIncidentOpen] = useState<boolean>(false);
  
  // Initial category filter passed to IncidentsTable when clicked from Dashboard
  const [tableCategoryFilter, setTableCategoryFilter] = useState<AffectationCategory | 'all'>('all');

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_INCIDENTS_KEY, JSON.stringify(incidents));
    } catch (e) {
      console.error("Error guardando incidentes:", e);
    }
  }, [incidents]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_OVERRIDES_KEY, JSON.stringify(userOverrides));
    } catch (e) {
      console.error("Error guardando overrides:", e);
    }
  }, [userOverrides]);

  // Compute municipality summaries with semáforo calculation
  const municipalitiesSummary = useMemo(() => {
    return buildMunicipalitiesSummary(incidents, userOverrides);
  }, [incidents, userOverrides]);

  const totalActivos = useMemo(() => {
    return incidents.filter(i => i.estatusCategoria === 'vigente_activo' || i.estatusCategoria === 'en_seguimiento').length;
  }, [incidents]);

  const totalAtendidos = useMemo(() => {
    return incidents.filter(i => i.estatusCategoria === 'atendido').length;
  }, [incidents]);

  // Handle user manual override / validation of a municipality's status
  const handleUpdateSemaforoOverride = (
    cve_mun: string, 
    semaforo: SemaforoLevel, 
    motivo: string, 
    validado: boolean
  ) => {
    setUserOverrides(prev => ({
      ...prev,
      [cve_mun]: { semaforo, motivo, validado }
    }));

    if (selectedMunicipality && selectedMunicipality.cve_mun === cve_mun) {
      setSelectedMunicipality(prev => prev ? {
        ...prev,
        semaforo,
        motivoSemaforo: motivo,
        semaforoValidado: validado
      } : null);
    }
  };

  // Apply user-validated changes from AI extraction
  const handleApplyExtractionChanges = (validatedChanges: ExtractionChangeItem[]) => {
    const updatedIncidents = [...incidents];

    validatedChanges.forEach(change => {
      // Find matching incident
      const existingIdx = updatedIncidents.findIndex(inc => 
        inc.municipio.toLowerCase().includes(change.municipio.toLowerCase()) &&
        (inc.comunidadPunto.toLowerCase().includes(change.comunidadPunto.toLowerCase()) ||
         change.comunidadPunto.toLowerCase().includes(inc.comunidadPunto.toLowerCase()))
      );

      if (existingIdx !== -1) {
        // Update existing incident
        const existing = updatedIncidents[existingIdx];
        const isResolved = change.tipoCambio === 'resuelto';

        updatedIncidents[existingIdx] = {
          ...existing,
          estatusOficial: change.estatusNuevo,
          estatusCategoria: isResolved ? 'atendido' : 'vigente_activo',
          afectacionDetalle: `${change.detalle} (Actualizado tras reporte validado)`,
          ultimaVerificacion: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' h'
        };
      } else if (change.tipoCambio === 'nuevo') {
        // Add new incident
        updatedIncidents.push({
          id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          municipio: change.municipio,
          comunidadPunto: change.comunidadPunto,
          ubicacion: change.comunidadPunto,
          tipoAfectacion: change.tipoAfectacion,
          tipoAfectacionLabel: change.tipoAfectacion.replace('_', ' ').toUpperCase(),
          estatusOficial: change.estatusNuevo,
          estatusCategoria: 'vigente_activo',
          afectacionDetalle: change.detalle,
          accionAtencion: "Registrado e inspeccionado por cuadrilla de atención.",
          documentoOrigen: "Reporte_Actualizacion_Validado.pdf",
          paginaDocumento: change.paginaReferencia,
          fechaReporte: new Date().toLocaleDateString('es-MX'),
          ultimaVerificacion: "Recién validado",
          puntosContabilizados: 1
        });
      }
    });

    setIncidents(updatedIncidents);
  };

  // Import incidents from Excel/CSV
  const handleImportIncidents = (newIncidents: Incident[], mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      setIncidents(newIncidents);
      setUserOverrides({});
    } else {
      const updated = [...incidents];
      newIncidents.forEach(newInc => {
        const idx = updated.findIndex(existing => 
          existing.id === newInc.id ||
          (existing.municipio.toLowerCase().trim() === newInc.municipio.toLowerCase().trim() &&
           existing.comunidadPunto.toLowerCase().trim() === newInc.comunidadPunto.toLowerCase().trim())
        );
        if (idx !== -1) {
          updated[idx] = newInc;
        } else {
          updated.push(newInc);
        }
      });
      setIncidents(updated);
    }
  };

  // Quick inline status toggle for an incident
  const handleUpdateIncidentStatus = (incidentId: string, newStatus: StatusCategory) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        let estatusOficial = inc.estatusOficial;
        if (newStatus === 'atendido') {
          estatusOficial = 'ATENDIDO / LIBERADO';
        } else if (newStatus === 'en_seguimiento') {
          estatusOficial = 'EN SEGUIMIENTO / PASO PROVISIONAL';
        } else if (newStatus === 'vigente_activo') {
          estatusOficial = 'ACTIVO / TRÁNSITO INTERRUMPIDO';
        }
        return {
          ...inc,
          estatusCategoria: newStatus,
          estatusOficial,
          ultimaVerificacion: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) + ' h'
        };
      }
      return inc;
    }));
  };

  // Add single new incident
  const handleAddIncident = (newInc: Incident) => {
    setIncidents(prev => [newInc, ...prev]);
  };

  // Delete incident
  const handleDeleteIncident = (incidentId: string) => {
    setIncidents(prev => prev.filter(inc => inc.id !== incidentId));
  };

  // Reset to original factory initial data
  const handleResetToOfficialInitial = () => {
    if (window.confirm("¿Deseas restablecer todos los datos al Concentrado Oficial del 20 de Octubre? Se perderán las modificaciones no guardadas.")) {
      setIncidents(INITIAL_OFFICIAL_INCIDENTS);
      setUserOverrides({});
      localStorage.removeItem(STORAGE_INCIDENTS_KEY);
      localStorage.removeItem(STORAGE_OVERRIDES_KEY);
    }
  };

  const handleFilterByCategoryFromDashboard = (cat: AffectationCategory | 'all') => {
    setTableCategoryFilter(cat);
    setCurrentTab('tabla');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Official Government Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenCriteria={() => setIsCriteriaOpen(true)}
        onOpenExecutiveReport={() => setIsExecutiveReportOpen(true)}
        onOpenPdfOriginal={() => setIsPdfViewerOpen(true)}
        onOpenDownload={() => setIsDownloadOpen(true)}
        onOpenImportCsv={() => setIsImportCsvOpen(true)}
        totalActivos={totalActivos}
        totalAtendidos={totalAtendidos}
      />

      {/* Main Tab Content */}
      <main className="flex-1 flex flex-col">
        {currentTab === 'mapa' && (
          <MapComponent
            municipalities={municipalitiesSummary}
            incidents={incidents}
            selectedMunicipality={selectedMunicipality}
            onSelectMunicipality={(mun) => setSelectedMunicipality(mun)}
            onOpenCriteria={() => setIsCriteriaOpen(true)}
          />
        )}

        {currentTab === 'dashboard' && (
          <DashboardMetrics
            municipalities={municipalitiesSummary}
            incidents={incidents}
            reportMetadata={OFFICIAL_REPORT_METADATA}
            onSelectMunicipality={(mun) => setSelectedMunicipality(mun)}
            onFilterByCategory={handleFilterByCategoryFromDashboard}
          />
        )}

        {currentTab === 'tabla' && (
          <IncidentsTable
            incidents={incidents}
            municipalities={municipalitiesSummary}
            onSelectMunicipality={(mun) => setSelectedMunicipality(mun)}
            initialCategoryFilter={tableCategoryFilter}
            onOpenImportCsv={() => setIsImportCsvOpen(true)}
            onOpenAddIncident={() => setIsAddIncidentOpen(true)}
            onUpdateIncidentStatus={handleUpdateIncidentStatus}
            onDeleteIncident={handleDeleteIncident}
          />
        )}
      </main>

      {/* Institutional Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-3.5 px-4 sm:px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#BC955B]"></span>
            <span>
              <strong>Gobierno del Estado de Hidalgo</strong> • Secretaría de Gobierno
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 text-[11px] text-slate-500">
            <span>84 Municipios Monitoreados</span>
            <span>•</span>
            <button 
              onClick={() => setIsImportCsvOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 font-semibold underline cursor-pointer"
           


              
              onClick={handleResetToOfficialInitial}
              className="text-slate-500 hover:text-rose-400 underline cursor-pointer inline-flex items-center gap-1"
              title="Restablecer la base de datos al corte oficial inicial"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restablecer datos</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Municipality Drilldown Modal */}
      <MunicipalityDetailModal
        municipality={selectedMunicipality}
        incidents={incidents}
        onClose={() => setSelectedMunicipality(null)}
        onUpdateSemaforoOverride={handleUpdateSemaforoOverride}
      />

      {/* Semaforo Technical Criteria Modal */}
      <SemaforoCriteriaModal
        isOpen={isCriteriaOpen}
        onClose={() => setIsCriteriaOpen(false)}
      />

      {/* Report Upload & AI Extraction Modal */}
      <ReportUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onApplyChanges={handleApplyExtractionChanges}
      />

      {/* Executive Printable Situation Report Modal */}
      <ExecutiveReportModal
        isOpen={isExecutiveReportOpen}
        onClose={() => setIsExecutiveReportOpen(false)}
        municipalities={municipalitiesSummary}
        incidents={incidents}
        reportMetadata={OFFICIAL_REPORT_METADATA}
      />

      {/* Download Project & Resources Modal */}
      <DownloadProjectModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        incidents={incidents}
        municipalities={municipalitiesSummary}
        onOpenPdfOriginal={() => setIsPdfViewerOpen(true)}
        onOpenExecutiveReport={() => setIsExecutiveReportOpen(true)}
      />

      {/* CSV / Excel Import Modal */}
      <CsvImportModal
        isOpen={isImportCsvOpen}
        onClose={() => setIsImportCsvOpen(false)}
        currentIncidents={incidents}
        onImportIncidents={handleImportIncidents}
      />

      {/* Manual Quick Add Incident Modal */}
      <AddIncidentModal
        isOpen={isAddIncidentOpen}
        onClose={() => setIsAddIncidentOpen(false)}
        municipalities={municipalitiesSummary}
        onAddIncident={handleAddIncident}
      />

      {/* Official PDF Document Viewer Modal */}
      {isPdfViewerOpen && (
        <div className="fixed inset-0 z-[1400] bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col">
            <div className="bg-[#531325] px-5 py-3 text-white flex items-center justify-between border-b-2 border-[#BC955B]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#BC955B]" />
                <span className="text-sm font-bold">Documento Fuente Oficial: Concentrado Ejecutivo de Lluvias (20/10/2026)</span>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="/assets/aistudio/Concentrado_Ejecutivo_Lluvias_20Oct2026_2113_Corregido_Infraestructura_Federal_63c258fe.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-amber-200 hover:text-white flex items-center gap-1 underline"
                >
                  <span>Abrir en pestaña externa</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setIsPdfViewerOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100">
              <iframe
                src="/assets/aistudio/Concentrado_Ejecutivo_Lluvias_20Oct2026_2113_Corregido_Infraestructura_Federal_63c258fe.pdf"
                title="Concentrado Ejecutivo Oficial de Lluvias"
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
