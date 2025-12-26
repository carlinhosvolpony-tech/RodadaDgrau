
import React from 'react';
import { Ticket } from '../types';

interface TicketHistoryProps {
  tickets: Ticket[];
  onDelete: (id: string) => void;
}

const TicketHistory: React.FC<TicketHistoryProps> = ({ tickets, onDelete }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <h2 className="text-3xl font-black italic uppercase text-center mb-8">
        <span className="text-emerald-500">MEUS</span> COMPROVANTES
      </h2>
      
      {tickets.length === 0 ? (
        <div className="glass p-16 rounded-3xl text-center border-emerald-500/5">
          <i className="fa-solid fa-ticket-simple text-5xl mb-4 text-emerald-500/20"></i>
          <p className="font-black uppercase text-[10px] text-emerald-500/40 tracking-[0.2em]">Nenhum bilhete encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {tickets.map(t => (
            <div key={t.id} className="relative group">
              <div className="bg-white text-black p-4 rounded-sm shadow-2xl font-mono border-t-8 border-emerald-600 relative overflow-hidden">
                <div className="bg-emerald-950 text-emerald-400 p-2 text-center mb-4 rounded-sm">
                   <div className="text-lg font-black leading-tight uppercase">INVISTA R${t.cost.toFixed(0)}</div>
                   <div className="text-2xl font-black leading-tight uppercase">E GANHE R${t.potential_prize.toLocaleString()}!</div>
                </div>

                <div className="text-center border-b border-black pb-4 mb-4">
                   <h3 className="text-3xl font-black tracking-tighter leading-none mb-1">D'GRAU</h3>
                   <h3 className="text-3xl font-black tracking-tighter leading-none mb-2">APOSTAS</h3>
                   <p className="text-[10px] font-black uppercase">SEU PALPITE CERTO</p>
                </div>

                <div className="border border-black">
                  <div className="grid grid-cols-12 bg-gray-100 border-b border-black font-black text-[10px] text-center">
                    <div className="col-span-9 border-r border-black p-1 uppercase">Escolha</div>
                    <div className="col-span-1 border-r border-black p-1">C</div>
                    <div className="col-span-1 border-r border-black p-1">E</div>
                    <div className="col-span-1 p-1">F</div>
                  </div>
                  {t.picks.map((pick, i) => (
                    <div key={i} className="grid grid-cols-12 border-b border-black text-[10px] items-center">
                      <div className="col-span-9 border-r border-black px-2 py-1 truncate font-bold uppercase">
                        {t.match_info[i]?.home} X {t.match_info[i]?.away}
                      </div>
                      <div className="col-span-1 border-r border-black text-center font-black h-full flex items-center justify-center">
                        {pick === 'H' ? 'X' : ''}
                      </div>
                      <div className="col-span-1 border-r border-black text-center font-black h-full flex items-center justify-center">
                        {pick === 'D' ? 'X' : ''}
                      </div>
                      <div className="col-span-1 text-center font-black h-full flex items-center justify-center">
                        {pick === 'A' ? 'X' : ''}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 mt-4 text-[10px] font-black border-t border-black pt-2 gap-2">
                  <div className="border border-black p-1 flex justify-between">
                    <span>DATA:</span>
                    <span>{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="border border-black p-1 flex justify-between">
                    <span>CÓDIGO:</span>
                    <span className="text-emerald-800">{t.id}</span>
                  </div>
                </div>

                <div className={`absolute top-20 right-[-30px] rotate-45 px-10 py-1 text-[10px] font-black uppercase text-center ${
                  t.status === 'VALIDATED' ? 'bg-green-600 text-white' : 
                  t.status === 'WON' ? 'bg-yellow-400 text-black' : 
                  t.status === 'LOST' ? 'bg-red-500 text-white' : 'bg-gray-400 text-white'
                }`}>
                  {t.status === 'VALIDATED' ? 'Pago' : t.status === 'WON' ? 'Ganhador' : t.status === 'LOST' ? 'Perdeu' : 'Pendente'}
                </div>
              </div>

              <button 
                onClick={() => onDelete(t.id)}
                className="absolute -top-4 -right-4 bg-red-500 w-10 h-10 rounded-full shadow-lg border-4 border-[#050505] text-white hover:scale-110 transition-transform"
              >
                <i className="fa-solid fa-trash-can text-sm"></i>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TicketHistory;
