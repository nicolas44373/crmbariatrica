import React, { useContext } from 'react';
import { AuthContext, ActiveApp } from '../App';
import { UserRole } from '../types';

const StethoscopeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-8.625 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m1.5-11.25h1.5l1.5 1.5m-3 0V3.375c0-.621.504-1.125 1.125-1.125h1.5c.621 0 1.125.504 1.125 1.125v1.5m-3 0h3m-3 0h1.5m0 0v1.5c0 .621.504 1.125 1.125 1.125h1.5c.621 0 1.125-.504 1.125-1.125v-1.5m0 0h1.5m0 0h1.5m0 0v1.5c0 .621.504 1.125 1.125 1.125h1.5c.621 0 1.125-.504 1.125-1.125v-1.5m-3 0h3m-3 0h1.5m0 0v1.5c0 .621.504-1.125 1.125-1.125h1.5c.621 0 1.125.504 1.125-1.125V5.625m-3 0h3m-3 0h1.5m0 0v1.5c0 .621.504-1.125 1.125-1.125h1.5" />
    </svg>
);
const UserGroupIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m-7.5-2.962a3.75 3.75 0 1 0-7.5 0 3.75 3.75 0 0 0 7.5 0ZM10.5 1.5a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" />
    </svg>
);
const HeartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
);
const LogOutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
    </svg>
);

interface HeaderProps {
    activeApp: ActiveApp;
    onNavigate: (app: ActiveApp) => void;
}

export default function Header({ activeApp, onNavigate }: HeaderProps) {
  const authContext = useContext(AuthContext);

  if (!authContext?.user) {
    return null;
  }

  const { user, signOut } = authContext;
  const isAdmin = user.rol === UserRole.ADMINISTRATIVO;
  const nombreCompleto = `${user.nombres} ${user.apellido}`;

  const navButtonCommonClasses = "flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors duration-200 text-sm";
  const navButtonActiveClasses = "bg-sky-600 text-white shadow-inner";
  const navButtonInactiveClasses = "bg-white text-slate-600 hover:bg-slate-100";

  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center">
            <div className="bg-sky-600 p-2 rounded-lg mr-3">
               <StethoscopeIcon />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Plenus</h1>
          </div>

          {/* Navegación */}
          <nav className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => onNavigate('clinical')}
              className={`${navButtonCommonClasses} ${activeApp === 'clinical' ? navButtonActiveClasses : navButtonInactiveClasses}`}
            >
              <StethoscopeIcon />
              Clínica
            </button>
            <button
              onClick={() => onNavigate('crm')}
              className={`${navButtonCommonClasses} ${activeApp === 'crm' ? navButtonActiveClasses : navButtonInactiveClasses}`}
            >
              <HeartIcon />
              CRM
            </button>
          </nav>

          {/* Usuario + Cerrar sesión */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`p-1.5 rounded-full ${isAdmin ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                {isAdmin ? <UserGroupIcon /> : <StethoscopeIcon />}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-700">{nombreCompleto}</p>
                <p className="text-xs text-slate-500">
                  {user.rol}{user.especialidad && ` - ${user.especialidad}`}
                </p>
              </div>
            </div>

            <button
              onClick={signOut}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 transition-colors"
              title="Cerrar sesión"
            >
              <LogOutIcon />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}