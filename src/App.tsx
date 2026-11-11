import { useState, useEffect } from 'react';
import { Table2, BarChart3, Shield, Eye, Lock, Unlock, Loader2, FileText, ClipboardList, BarChart4, Calculator } from 'lucide-react';
import type { ProcessRecord, ViewKey } from './types';
import { supabase } from './utils/supabase';
import { GranelFhoView } from './components/GranelFhoView';
import { ConsolidadoProcesosView } from './components/ConsolidadoProcesosView';
import ArchivosPlanosView from './components/ArchivosPlanosView';
import { RechazosAdminView } from './components/RechazosAdminView';
import { ConsolidadoRechazosView } from './components/ConsolidadoRechazosView';
import { CalculadoraProcesosView } from './components/CalculadoraProcesosView';

// ==========================================
// CONFIGURACIÓN DE ACCESOS Y OPERADORES
// ==========================================

// Correos con acceso exclusivo al panel de ARCHIVOS SAG
const SAG_OPERATOR_EMAILS = [
  'mpineda@higueraoriente.cl',
  // Agrega aquí más correos si necesitas darles acceso a Archivos SAG, ejemplo:
  // 'otro-operador@higueraoriente.cl',
];

// Correos que SOLO tienen acceso exclusivo a la Calculadora de Procesos
const CALCULATOR_ONLY_EMAILS = [
  '',
  // Agrega aquí los correos que solo usarán la calculadora
];

function App() {
  const [view, setView] = useState<ViewKey | 'calculadora'>('consolidado');
  const [records, setRecords] = useState<ProcessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [userRole, setUserRole] = useState<'admin' | 'viewer'>('viewer');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const lowerEmail = userEmail?.toLowerCase() || '';

  // Validaciones de roles y accesos específicos
  const isSagOperator = lowerEmail !== '' && SAG_OPERATOR_EMAILS.includes(lowerEmail);
  const isCalculatorOnly = lowerEmail !== '' && CALCULATOR_ONLY_EMAILS.includes(lowerEmail);

  useEffect(() => {
    fetchRecords();

    const channel = supabase
      .channel('public:process_records')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'process_records' }, () => {
        fetchRecords();
      })
      .subscribe();

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!error && session?.user) {
        const email = session.user.email || null;
        setUserRole('admin');
        setUserEmail(email);
        
        const emailLower = email?.toLowerCase() || '';
        if (SAG_OPERATOR_EMAILS.includes(emailLower)) {
          setView('planos');
        } else if (CALCULATOR_ONLY_EMAILS.includes(emailLower)) {
          setView('calculadora');
        } else {
          setView('granel');
        }
      }
    }).catch((err) => {
      console.warn('No se pudo verificar la sesión inicial por red:', err);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        const email = session.user.email || null;
        setUserRole('admin');
        setUserEmail(email);
        
        const emailLower = email?.toLowerCase() || '';
        if (SAG_OPERATOR_EMAILS.includes(emailLower)) {
          setView('planos');
        } else if (CALCULATOR_ONLY_EMAILS.includes(emailLower)) {
          setView('calculadora');
        }
      } else {
        setUserRole('viewer');
        setUserEmail(null);
        setView('consolidado');
      }
    });

    return () => {
      supabase.removeChannel(channel);
      subscription.unsubscribe();
    };
  }, []);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('process_records')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formatted: ProcessRecord[] = (data || []).map((r: any) => ({
        id: r.id,
        mesProduccion: r.mes_produccion || '',
        mesRecepcion: r.mes_recepcion || '',
        productor: r.productor || '',
        semana: r.semana || '',
        fechaProduccion: r.fecha_produccion || '',
        fechaRecepcion: r.fecha_recepcion || '',
        nProceso: r.n_proceso || '',
        guiaRecepcion: r.guia_recepcion || '',
        guiaAsignada: r.guia_asignada || '',
        variedad: r.variedad || '',
        recepcionKg: r.recepcion_kg || 0,
        rechazoQcKg: r.rechazo_qc_kg || 0,
        frutaProcesoKg: r.fruta_proceso_kg || 0,
        procesadoKg: r.procesado_kg || 0,
        cajas: r.cajas || [],
        deshidrataKg: r.deshidrata_kg || 0,
        frutaIqfKg: r.fruta_iqf_kg || 0,
        mermaKg: r.merma_kg || 0,
        nTarjas: r.n_tarjas || 0,
        observaciones: r.observaciones || '',
        traspasoCajas: r.traspaso_cajas || '',
        ajustarDiferencia: r.ajustar_diferencia || '',
      }));

      setRecords(formatted);
    } catch (err) {
      console.error('Error al cargar registros:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput,
        password: passwordInput,
      });

      if (error) throw error;

      setShowLoginModal(false);
      setEmailInput('');
      setPasswordInput('');

      const loggedEmail = (data.user?.email || emailInput).toLowerCase();

      if (SAG_OPERATOR_EMAILS.includes(loggedEmail)) {
        setView('planos');
      } else if (CALCULATOR_ONLY_EMAILS.includes(loggedEmail)) {
        setView('calculadora');
      } else {
        setView('granel');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Correo o contraseña incorrectos');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('consolidado');
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-xs font-medium text-gray-500">Cargando Sistema de Arándanos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
          <div className="flex w-full items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-200 p-1.5">
                <svg viewBox="0 0 100 100" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 15 C45 25, 20 25, 10 40 C25 45, 45 35, 50 15 Z" fill="#27ae60" />
                  <path d="M55 18 C60 28, 85 28, 95 43 C80 48, 60 38, 55 18 Z" fill="#2ecc71" />
                  <circle cx="38" cy="45" r="16" fill="#1b4f72" />
                  <path d="M38 34 L40 38 L44 38 L41 41 L42 45 L38 43 L34 45 L35 41 L32 38 L36 38 Z" fill="#154360" />
                  <circle cx="65" cy="55" r="22" fill="#2980b9" />
                  <path d="M65 42 L68 47 L74 47 L69 51 L71 57 L65 53 L59 57 L61 51 L56 47 L62 47 Z" fill="#154360" />
                  <circle cx="40" cy="70" r="24" fill="#1f618d" />
                  <path d="M40 56 L43 61 L49 61 L44 65 L46 71 L40 67 L34 71 L36 65 L31 61 L37 61 Z" fill="#154360" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-black tracking-tight text-slate-900 leading-tight">
                    ARÁNDANOS
                  </h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Temporada 2026-2027
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500">Sistema de Control y Cuadratura (Nube en Tiempo Real)</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {userRole === 'admin' ? (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                  <Shield className="h-4 w-4 text-emerald-600" />
                  <div className="text-left">
                    <p className="text-[10px] text-emerald-600 font-medium">
                      {isSagOperator ? 'Operador Archivos SAG' : isCalculatorOnly ? 'Usuario Calculadora' : 'Administrador'}
                    </p>
                    <p className="text-xs font-bold text-emerald-900">{userEmail}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="ml-2 flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <Lock className="h-3 w-3" /> Salir
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                  <Eye className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-medium text-amber-800">Modo Visualizador (Público)</span>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="ml-2 flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-blue-700"
                  >
                    <Unlock className="h-3 w-3" /> Iniciar Sesión Admin
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Menú de Navegación Uniforme */}
          <div className="px-6">
            <nav className="flex gap-1 overflow-x-auto scrollbar-none">
              {isSagOperator ? (
                <TabButton
                  active={view === 'planos'}
                  onClick={() => setView('planos')}
                  icon={<FileText className="h-4 w-4" />}
                  label="Archivos SAG"
                />
              ) : isCalculatorOnly ? (
                <TabButton
                  active={view === 'calculadora'}
                  onClick={() => setView('calculadora')}
                  icon={<Calculator className="h-4 w-4" />}
                  label="Calculadora de Procesos"
                />
              ) : (
                <>
                  {userRole === 'admin' && (
                    <TabButton
                      active={view === 'granel'}
                      onClick={() => setView('granel')}
                      icon={<Table2 className="h-4 w-4" />}
                      label="Granel FHO"
                    />
                  )}
                  
                  <TabButton
                    active={view === 'consolidado'}
                    onClick={() => setView('consolidado')}
                    icon={<BarChart3 className="h-4 w-4" />}
                    label="Consolidado Procesos GRANEL"
                  />

                  {userRole === 'admin' && (
                    <TabButton
                      active={view === 'rechazos'}
                      onClick={() => setView('rechazos')}
                      icon={<ClipboardList className="h-4 w-4" />}
                      label="Gestión Rechazos ASQUE"
                    />
                  )}

                  <TabButton
                    active={view === 'consolidado-rechazos'}
                    onClick={() => setView('consolidado-rechazos')}
                    icon={<BarChart4 className="h-4 w-4" />}
                    label="Consolidado Rechazos ASQUE"
                  />

                  {userRole === 'admin' && (
                    <TabButton
                      active={view === 'calculadora'}
                      onClick={() => setView('calculadora')}
                      icon={<Calculator className="h-4 w-4" />}
                      label="Calculadora de Procesos"
                    />
                  )}

                  {userRole === 'admin' && (
                    <TabButton
                      active={view === 'planos'}
                      onClick={() => setView('planos')}
                      icon={<FileText className="h-4 w-4" />}
                      label="Archivos SAG"
                    />
                  )}
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="w-full px-6 py-6">
          {isSagOperator ? (
            <ArchivosPlanosView />
          ) : isCalculatorOnly ? (
            <CalculadoraProcesosView />
          ) : (
            <>
              {userRole === 'admin' && view === 'granel' && <GranelFhoView records={records} userRole={userRole} onRefresh={fetchRecords} />}
              {userRole === 'admin' && view === 'rechazos' && <RechazosAdminView />}
              {view === 'consolidado-rechazos' && <ConsolidadoRechazosView />}
              {userRole === 'admin' && view === 'calculadora' && <CalculadoraProcesosView />}
              {userRole === 'admin' && view === 'planos' && <ArchivosPlanosView />}
              {view === 'consolidado' && <ConsolidadoProcesosView records={records} />}
            </>
          )}
        </main>
      </div>

      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Iniciar Sesión</h3>
                <p className="text-xs text-gray-500">Ingresa con tus credenciales de Supabase</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Correo electrónico</label>
                <input
                  type="email"
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="tu-correo@fho.cl"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Contraseña</label>
                <input
                  type="password"
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  required
                />
                {errorMsg && <p className="mt-1.5 text-xs font-semibold text-red-600">{errorMsg}</p>}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowLoginModal(false); setErrorMsg(''); }}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Entrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="border-t border-gray-200 bg-white py-4 px-6">
        <div className="flex flex-col items-center justify-center gap-1 text-center text-xs text-gray-400">
          <p>ARÁNDANOS — Sistema de Control y Cuadratura · Sincronizado en tiempo real con Supabase</p>
          <p className="text-[11px] font-medium text-gray-500">
            Creado y Desarrollado por <span className="font-bold text-slate-700">Felipe Ibarra</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

TabButton.displayName = 'TabButton';

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-800'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default App;
