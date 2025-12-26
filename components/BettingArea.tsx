
import React, { useState } from 'react';
import { Match, AppSettings } from '../types';
import { getVolponyIndicaPicks } from '../geminiService';

interface BettingAreaProps {
  matches: Match[];
  settings: AppSettings;
  onPlaceTicket: (picks: ('H' | 'D' | 'A')[]) => void;
  userBalance: number;
}

const BettingArea: React.FC<BettingAreaProps> = ({ matches, settings, onPlaceTicket, userBalance }) => {
  const [picks, setPicks] = useState<('H' | 'D' | 'A' | null)[]>(Array(12).fill(null));
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handlePick = (index: number, value: 'H' | 'D' | 'A') => {
    if (settings.betting_blocked) return;
    const newPicks = [...picks];
    newPicks[index] = value;
    setPicks(newPicks);
  };

  const handleAiFill = async () => {
    if (settings.betting_blocked) return;
    setIsAiLoading(true);
    const aiPicks = await getVolponyIndicaPicks(matches);
    setPicks(aiPicks);
    setIsAiLoading(false);
  };

  const isComplete = picks.every(p => p !== null);
  const hasBalance = userBalance >= settings.ticket_price;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-4xl md:text-5xl font-black italic text-white mb-2 tracking-tight uppercase">CRAVE O <span className="text-emerald-500">12/12</span></h2>
        <p className="text-emerald-500 font-bold bg-emerald-500/10 inline-block px-4 py-1 rounded-full border border-emerald-500/30 animate-pulse-subtle">
          PRÊMIO ACUMULADO: R$ {settings.jackpot_prize.toLocaleString()}
        </p>
      </div>

      {settings.betting_blocked && (
        <div className="bg-red-500/20 border border-red-500 text-red-500 p-4 rounded-xl mb-6 text-center font-bold">
          <i className="fa-solid fa-circle-exclamation mr-2"></i> AS APOSTAS ESTÃO BLOQUEADAS NO MOMENTO. OS JOGOS JÁ INICIARAM.
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 glass p-4 rounded-xl border border-emerald-500/10">
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-bold text-sm">Valor: <span className="text-white">R$ {settings.ticket_price.toFixed(2)}</span></span>
            {hasBalance ? (
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-emerald-500/30">
                <i className="fa-solid fa-bolt mr-1"></i> Validação Automática
              </span>
            ) : (
              <span className="bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-amber-500/30">
                <i className="fa-solid fa-handshake mr-1"></i> Pagamento em Mãos
              </span>
            )}
          </div>
          {!hasBalance && (
            <p className="text-[10px] text-amber-500 font-bold italic opacity-70">Saldo insuficiente para auto-validar. Pague ao cambista após finalizar.</p>
          )}
        </div>
        
        <button 
          onClick={handleAiFill}
          disabled={isAiLoading || settings.betting_blocked}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-500 px-4 py-2 rounded-lg font-black text-sm uppercase tracking-tighter hover:scale-105 active:scale-95 transition-all disabled:opacity-50 w-full md:w-auto justify-center text-black"
        >
          <i className={`fa-solid ${isAiLoading ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
          {isAiLoading ? 'Analisando...' : 'Volpony Indica'}
        </button>
      </div>

      <div className="space-y-3">
        {matches.map((match, idx) => (
          <div key={match.id} className="glass rounded-2xl overflow-hidden group hover:bg-emerald-900/10 transition-all border-l-4 border-l-transparent hover:border-l-emerald-500">
            <div className="bg-black/60 px-4 py-1 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">{match.league}</span>
              <span className="text-[10px] text-gray-500 font-bold">{match.date}</span>
            </div>
            
            <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6 flex-1 w-full justify-center md:justify-start">
                <div className="flex flex-col items-center gap-1 flex-1 text-center md:text-left md:items-start">
                  <span className="text-lg font-bold truncate w-full text-white">{match.home_team}</span>
                  <span className="text-[10px] uppercase text-gray-500 font-black">Casa</span>
                </div>
                
                <div className="flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full border border-emerald-500/20">
                  <span className="text-xs font-black italic text-emerald-500">VS</span>
                </div>

                <div className="flex flex-col items-center gap-1 flex-1 text-center md:text-right md:items-end">
                  <span className="text-lg font-bold truncate w-full text-white">{match.away_team}</span>
                  <span className="text-[10px] uppercase text-gray-500 font-black">Fora</span>
                </div>
              </div>

              <div className="flex gap-2">
                {[
                  { label: 'Casa', value: 'H' as const },
                  { label: 'Empate', value: 'D' as const },
                  { label: 'Fora', value: 'A' as const },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handlePick(idx, opt.value)}
                    disabled={settings.betting_blocked}
                    className={`w-16 h-12 rounded-xl flex flex-col items-center justify-center transition-all border ${
                      picks[idx] === opt.value
                        ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                        : 'bg-white/5 border-white/5 text-gray-500 hover:border-emerald-500/50 hover:text-emerald-400'
                    }`}
                  >
                    <span className="text-xs font-black">{opt.value}</span>
                    <span className="text-[8px] uppercase font-black">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-6 mt-8 flex justify-center">
        <button
          onClick={() => isComplete && onPlaceTicket(picks as ('H' | 'D' | 'A')[])}
          disabled={!isComplete || settings.betting_blocked}
          className={`px-12 py-4 rounded-2xl font-black text-xl uppercase tracking-widest shadow-2xl transition-all ${
            isComplete && !settings.betting_blocked
              ? 'bg-emerald-500 text-black hover:scale-105 active:scale-95 shadow-emerald-500/30'
              : 'bg-emerald-950 text-emerald-800 border border-emerald-900/50 cursor-not-allowed opacity-50'
          }`}
        >
          {isComplete ? 'FINALIZAR BILHETE' : `${picks.filter(p => p !== null).length}/12 PALPITES`}
        </button>
      </div>
    </div>
  );
};

export default BettingArea;
