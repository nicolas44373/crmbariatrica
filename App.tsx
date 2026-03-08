import React, { useState, useEffect, createContext, useCallback } from 'react';
import { PacienteFiliatorio, Profesional, UserRole } from './types';
import { api } from './services/supabaseApi';
import { supabase } from './services/supabaseClient';
import Header from './components/Header';
import Dashboard, { CrmDashboard } from './components/Dashboard';
import PatientDossier from './components/PatientDossier';
import LoginPage from './components/LoginPage';

interface AuthContextType {
  user: Profesional | null;
  setUser: (user: Profesional | null) => void;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
export type ActiveApp = 'clinical' | 'crm';

export default function App() {
  const [user, setUser] = useState<Profesional | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PacienteFiliatorio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeApp, setActiveApp] = useState<ActiveApp>('clinical');

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
      setActiveApp(user.rol === UserRole.ADMINISTRATIVO ? 'crm' : 'clinical');
    }
  }, [user]);

  const handleSignOut = useCallback(async () => {
    await api.signOut();
    setUser(null);
    setSelectedPatient(null);
  }, []);

  const handleSelectPatient = (patient: PacienteFiliatorio) => {
    setSelectedPatient(patient);
  };

  const handleBackToDashboard = () => setSelectedPatient(null);
  const handleNavigate = (app: ActiveApp) => setActiveApp(app);

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
        <Header activeApp={activeApp} onNavigate={handleNavigate} />
        <main className="p-4 sm:p-6 lg:p-8">
          {activeApp === 'clinical' ? (
            selectedPatient ? (
              <PatientDossier patientId={selectedPatient.idPaciente} onBack={handleBackToDashboard} />
            ) : (
              <Dashboard onSelectPatient={handleSelectPatient} />
            )
          ) : (
            <CrmDashboard onSelectPatient={handleSelectPatient} selectedPatient={selectedPatient} />
          )}
        </main>
      </div>
    </AuthContext.Provider>
  );
}