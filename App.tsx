import React, { useState, useEffect, useRef, createContext, useCallback } from 'react';
import { PacienteFiliatorio, Profesional, UserRole, WhatsAppConversacion } from './types';
import { api } from './services/supabaseApi';
import { supabase } from './services/supabaseClient';
import Header from './components/Header';
import Dashboard, { CrmDashboard } from './components/Dashboard';
import PatientDossier from './components/PatientDossier';
import LoginPage from './components/LoginPage';
import WhatsAppInbox from './components/WhatsAppInbox';
import { infoDerivacion } from './components/WhatsAppBotPanels';

interface AuthContextType {
  user: Profesional | null;
  setUser: (user: Profesional | null) => void;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
export type ActiveApp = 'clinical' | 'crm' | 'whatsapp';

const WHATSAPP_POLL_MS = 15000;

function playAvisoBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.15;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
    osc.onended = () => ctx.close();
  } catch {
    // Si el navegador bloquea el audio, no interrumpimos la app por eso.
  }
}

function notificarDerivacion(conv: WhatsAppConversacion) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    const d = infoDerivacion(conv.derivadoMotivo);
    new Notification(d.urgente ? 'Plenus · URGENTE: síntomas' : `Plenus · ${d.corto}`, {
      body: `${conv.nombreContacto || conv.telefono}: ${d.detalle || 'Consulta derivada a secretaría'}`,
      requireInteraction: d.urgente,
    });
  } catch {
    // Notification puede fallar en algunos navegadores/contextos; no es crítico.
  }
}

export default function App() {
  const [user, setUser] = useState<Profesional | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PacienteFiliatorio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeApp, setActiveApp] = useState<ActiveApp>('clinical');
  const [returnToApp, setReturnToApp] = useState<ActiveApp>('clinical');
  const [pendientesWhatsApp, setPendientesWhatsApp] = useState<WhatsAppConversacion[]>([]);
  const seenDerivadosRef = useRef<Set<string>>(new Set());
  const firstWhatsAppPollRef = useRef(true);
  const notifPedidaRef = useRef(false);

  // Al cargar la app, verificar si hay sesión activa en Supabase
  useEffect(() => {
    api.getCurrentUser()
      .then(prof => { if (prof) setUser(prof); })
      .finally(() => setIsLoading(false));

    // Escuchar cambios de sesión (login/logout desde otra pestaña)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setSelectedPatient(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Redirigir según rol
  useEffect(() => {
    if (user) {
      const goToCrm = user.rol === UserRole.ADMINISTRATIVO || user.rol === UserRole.SUPERADMIN;
      setActiveApp(goToCrm ? 'crm' : 'clinical');
    }
  }, [user]);

  // Polling de conversaciones de WhatsApp derivadas y pendientes: alimenta el
  // badge del botón "WhatsApp" y dispara notificación + sonido ante una nueva.
  useEffect(() => {
    if (!user) return;

    if (!notifPedidaRef.current && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      notifPedidaRef.current = true;
      Notification.requestPermission().catch(() => {});
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const pendientes = await api.getWhatsAppPendientes();
        if (cancelled) return;

        if (!firstWhatsAppPollRef.current) {
          const nuevos = pendientes.filter(c => !seenDerivadosRef.current.has(c.telefono));
          nuevos.forEach(c => {
            playAvisoBeep();
            notificarDerivacion(c);
          });
        }
        firstWhatsAppPollRef.current = false;
        seenDerivadosRef.current = new Set(pendientes.map(c => c.telefono));
        setPendientesWhatsApp(pendientes);
      } catch {
        // Si falla el polling (sin conexión, etc.), no interrumpimos el resto de la app.
      }
    };

    poll();
    const id = setInterval(poll, WHATSAPP_POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [user]);

  const handleSignOut = useCallback(async () => {
    await api.signOut();
    setUser(null);
    setSelectedPatient(null);
  }, []);

  const handleSelectPatient = (patient: PacienteFiliatorio) => {
    setReturnToApp(activeApp);
    setSelectedPatient(patient);
    setActiveApp('clinical');
  };

  const handleSelectPatientById = (idPaciente: string) => {
    setReturnToApp(activeApp);
    setSelectedPatient({ idPaciente } as PacienteFiliatorio);
    setActiveApp('clinical');
  };

  const handleBackToDashboard = () => {
    setSelectedPatient(null);
    setActiveApp(returnToApp);
    setReturnToApp('clinical');
  };
  const handleNavigate = (app: ActiveApp) => {
    setActiveApp(app);
    setSelectedPatient(null);
  };

  // Pantalla de carga inicial
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div className="text-xl font-semibold text-slate-700">Cargando...</div>
      </div>
    );
  }

  // Si no hay usuario autenticado, mostrar login
  if (!user) {
    return <LoginPage onLoginSuccess={setUser} />;
  }

  return (
    <AuthContext.Provider value={{ user, setUser, signOut: handleSignOut }}>
      <div className="min-h-screen bg-slate-100">
        <Header activeApp={activeApp} onNavigate={handleNavigate} whatsappPendientes={pendientesWhatsApp.length} />
        <main className="p-4 sm:p-6 lg:p-8">
          {selectedPatient && (
            <PatientDossier patientId={selectedPatient.idPaciente} onBack={handleBackToDashboard} />
          )}
          <div style={{ display: (!selectedPatient && activeApp === 'clinical') ? 'block' : 'none' }}>
            <Dashboard onSelectPatient={handleSelectPatient} onNavigateToCrm={() => handleNavigate('crm')} />
          </div>
          <div style={{ display: (!selectedPatient && activeApp === 'crm') ? 'block' : 'none' }}>
            <CrmDashboard onSelectPatient={handleSelectPatient} selectedPatient={selectedPatient} />
          </div>
          {!selectedPatient && activeApp === 'whatsapp' && (
            <WhatsAppInbox onSelectPatient={handleSelectPatientById} />
          )}
        </main>
      </div>
    </AuthContext.Provider>
  );
}