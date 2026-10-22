import React, { useState } from 'react';
import { Incident, AffectationCategory, StatusCategory, MunicipalitySummary } from '../types';
import { X, PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';

interface AddIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  municipalities: MunicipalitySummary[];
  onAddIncident: (incident: Incident) => void;
}

export const AddIncidentModal: React.FC<AddIncidentModalProps> = ({
  isOpen,
  onClose,
  municipalities,
  onAddIncident,
}) => {
  const [municipio, setMunicipio] = useState<string>(municipalities[0]?.nombre || 'Pachuca de Soto');
  const [comunidadPunto, setComunidadPunto] = useState<string>('');
  const [ubicacion, setUbicacion] = useState<string>('');
  const [tipoAfectacion, setTipoAfectacion] = useState<AffectationCategory>('vias_accesos');
  const [estatusCategoria, setEstatusCategoria] = useState<StatusCategory>('vigente_activo');
  const [estatusOficial, setEstatusOficial] = useState<string>('ACTIVO / TRÁNSITO INTERRUMPIDO');
  const [afectacionDetalle, setAfectacionDetalle] = useState<string>('');
  const [accionAtencion, setAccionAtencion] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comunidadPunto.trim() || !afectacionDetalle.trim()) {
      alert('Por favor completa el punto/comunidad y la descripción del incidente.');
      return;
    }

    const typeLabels: Record<AffectationCategory, string> = {
      vias_accesos: 'VÍAS Y ACCESOS',
      deslaves: 'DESLAVES',
      derrumbes: 'DERRUMBES',
      socavon: 'SOCAVÓN',
      creciente_rios: 'CRECIENTE DE RÍOS',
      encharcamientos: 'ENCHARCAMIENTOS',
      caida_arboles: 'CAÍDA DE ÁRBOLES',
      suministro_electrico: 'SUMINISTRO ELÉCTRICO',
      afectaciones_estructurales: 'AFECTACIONES ESTRUCTURALES',
      personas_atrapadas: 'PERSONAS ATRAPADAS',
      personas_lesionadas: 'PERSONAS LESIONADAS',
      persona_sin_signos: 'PERSONA SIN SIGNOS VITALES',
      drenaje_colapsado: 'DRENAJE COLAPSADO',
      evacuaciones_preventivas: 'EVACUACIONES PREVENTIVAS',
      refugios_temporales: 'REFUGIOS TEMPORALES',
      monitoreo_hidrologico: 'MONITOREO HIDROLÓGICO',
      monitoreo_preventivo: 'MONITOREO PREVENTIVO',
      accidentes: 'ACCIDENTES',
      vehiculos_atrapados: 'VEHÍCULOS ATRAPADOS',
    };

    const newInc: Incident = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      municipio,
      comunidadPunto: comunidadPunto.trim(),
      ubicacion: ubicacion.trim() || comunidadPunto.trim(),
      tipoAfectacion,
      tipoAfectacionLabel: typeLabels[tipoAfectacion] || 'AFECTACIÓN METEOROLÓGICA',
      estatusOficial: estatusOficial.trim() || (estatusCategoria === 'atendido' ? 'ATENDIDO' : 'ACTIVO'),
      estatusCategoria,
      afectacionDetalle: afectacionDetalle.trim(),
      accionAtencion: accionAtencion.trim() || undefined,
      documentoOrigen: 'Reporte_Operativo_Directo.csv',
      paginaDocumento: 1,
      fechaReporte: new Date().toLocaleDateString('es-MX'),
      ultimaVerificacion: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) + ' h',
      puntosContabilizados: 1
    };

    onAddIncident(newInc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-[#531325] to-[#801e3b] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-[#BC955B]">
          <div className="flex items-center gap-2.5">
            <PlusCircle className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-sm sm:text-base font-serif">Registrar Nuevo Incidente</h3>
          </div>
          <button onClick={onClose} className="text-rose-200 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Municipio:</label>
            <select
              value={municipio}
              onChange={(e) => setMunicipio(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-[#691C32]"
            >
              {municipalities.map(m => (
                <option key={m.cve_mun} value={m.nombre}>{m.nombre} ({m.regionPC})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Comunidad / Punto:</label>
              <input
                type="text"
                required
                placeholder="Ej. Santa María Temaxcalapa"
                value={comunidadPunto}
                onChange={(e) => setComunidadPunto(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-[#691C32]"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Carretera / Tramo (opcional):</label>
              <input
                type="text"
                placeholder="Ej. Km 42+200 Carretera Estatal 105"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-[#691C32]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tipo de Afectación:</label>
              <select
                value={tipoAfectacion}
                onChange={(e) => setTipoAfectacion(e.target.value as AffectationCategory)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-[#691C32]"
              >
                <option value="vias_accesos">Vías y Accesos / Incomunicación</option>
                <option value="deslaves">Deslaves</option>
                <option value="derrumbes">Derrumbes</option>
                <option value="socavon">Socavón</option>
                <option value="creciente_rios">Creciente o Desbordamiento de Ríos</option>
                <option value="encharcamientos">Encharcamientos / Inundación</option>
                <option value="suministro_electrico">Corte de Energía Eléctrica</option>
                <option value="caida_arboles">Caída de Árboles</option>
                <option value="afectaciones_estructurales">Afectaciones Estructurales</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Estatus Operativo:</label>
              <select
                value={estatusCategoria}
                onChange={(e) => {
                  const cat = e.target.value as StatusCategory;
                  setEstatusCategoria(cat);
                  if (cat === 'vigente_activo') setEstatusOficial('ACTIVO / TRÁNSITO INTERRUMPIDO');
                  else if (cat === 'en_seguimiento') setEstatusOficial('PASO PROVISIONAL / CUADRILLA TRABAJANDO');
                  else if (cat === 'atendido') setEstatusOficial('LIBERADO / ATENDIDO AL 100%');
                }}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-[#691C32]"
              >
                <option value="vigente_activo">🔴 Vigente / Activo (Afectación activa)</option>
                <option value="en_seguimiento">🟡 En Seguimiento (Trabajos en curso)</option>
                <option value="atendido">🟢 Atendido / Resuelto</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Descripción detallada de la afectación:</label>
            <textarea
              required
              rows={2}
              placeholder="Describir las condiciones, volumen de material, si hay comunidades aisladas..."
              value={afectacionDetalle}
              onChange={(e) => setAfectacionDetalle(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-[#691C32]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Acción u operativo desplegado (opcional):</label>
            <input
              type="text"
              placeholder="Ej. Cuadrilla SIPDUS con retroexcavadora en camino"
              value={accionAtencion}
              onChange={(e) => setAccionAtencion(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-[#691C32]"
            />
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#691C32] hover:bg-[#521325] text-white rounded-lg font-bold shadow-sm"
            >
              Guardar Incidente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
