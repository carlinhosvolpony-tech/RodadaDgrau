
import React from 'react';
import { User, UserRole } from '../types';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  setView: (view: 'BET' | 'ADMIN' | 'BOOKIE' | 'WALLET' | 'TICKETS') => void;
  activeView: string;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, setView, activeView }) => {
  return (
    <nav className="glass sticky top-0 z-50 border-b border-emerald-500/10 px-4 py-3">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setView('BET')}
        >
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-black shadow-[0_0_15px_rgba(16,185,129,0.4)] group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-futbol text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-black italic tracking-tighter leading-none text-white">D'GRAU<span className="text-emerald-500">APOSTAS</span></h1>
            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-emerald-500/60">Seu Palpite Certo</p>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <button 
            onClick={() => setView('BET')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeView === 'BET' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'hover:bg-white/5 text-gray-400'}`}
          >
            <i className="fa-solid fa-house"></i> Início
          </button>
          
          <button 
            onClick={() => setView('TICKETS')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeView === 'TICKETS' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'hover:bg-white/5 text-gray-400'}`}
          >
            <i className="fa-solid fa-ticket"></i> Bilhetes
          </button>

          {user.role === UserRole.ADMIN && (
            <button 
              onClick={() => setView('ADMIN')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeView === 'ADMIN' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'hover:bg-white/5 text-gray-400'}`}
            >
              <i className="fa-solid fa-lock"></i> Admin
            </button>
          )}

          {user.role === UserRole.BOOKIE && (
            <button 
              onClick={() => setView('BOOKIE')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeView === 'BOOKIE' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'hover:bg-white/5 text-gray-400'}`}
            >
              <i className="fa-solid fa-users-gear"></i> Cambista
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div 
            onClick={() => setView('WALLET')}
            className="flex flex-col items-end cursor-pointer hover:opacity-80 transition-opacity"
          >
            <span className="text-[10px] text-gray-400 font-bold uppercase">Saldo Disponível</span>
            <span className="text-emerald-500 font-black">R$ {user.balance.toFixed(2)}</span>
          </div>
          
          <button 
            onClick={onLogout}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
