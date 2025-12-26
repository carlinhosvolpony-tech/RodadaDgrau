
import React, { useState } from 'react';
import { User, AppSettings } from '../types';

interface WalletProps {
  user: User;
  settings: AppSettings;
  users: User[];
  onBalanceAdded: (amount: number) => void;
}

const Wallet: React.FC<WalletProps> = ({ user, settings, users, onBalanceAdded }) => {
  const [amount, setAmount] = useState('10.00');
  const [showQR, setShowQR] = useState(false);

  let effectivePixKey = settings.pix_key;
  let responsibleName = "Administração";

  if (user.parent_id) {
    const parent = users.find(u => u.id === user.parent_id);
    if (parent && parent.pix_key) {
      effectivePixKey = parent.pix_key;
      responsibleName = `Cambista ${parent.name}`;
    }
  }

  const handleDeposit = () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return;
    onBalanceAdded(numericAmount);
    setShowQR(true);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="glass p-8 rounded-3xl border border-emerald-500/20 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mb-4">
            <i className="fa-solid fa-wallet text-2xl"></i>
          </div>
          <h2 className="text-3xl font-black italic tracking-tight text-white uppercase">MINHA <span className="text-emerald-500">CARTEIRA</span></h2>
        </div>

        <div className="bg-black/60 p-6 rounded-2xl border border-emerald-500/10 mb-8 text-center">
          <span className="text-[10px] text-emerald-500/60 font-black uppercase tracking-widest">Saldo Atual</span>
          <div className="text-4xl font-black text-white">R$ {user.balance.toFixed(2)}</div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-emerald-500 text-lg">R$</span>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-black/60 border border-emerald-500/20 rounded-xl pl-12 pr-4 py-3 font-black text-2xl text-white outline-none focus:border-emerald-500" />
          </div>

          {!showQR ? (
            <button onClick={handleDeposit} className="w-full py-4 bg-emerald-500 text-black font-black uppercase rounded-2xl shadow-lg">GERAR PIX</button>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white p-4 rounded-xl flex items-center justify-center">
                 <i className="fa-solid fa-qrcode text-8xl text-slate-800"></i>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-emerald-500/60">Destino: {responsibleName}</label>
                <div className="flex gap-2">
                  <input readOnly value={effectivePixKey} className="flex-1 bg-black/80 border border-emerald-500/20 rounded-xl px-4 py-3 font-mono text-xs text-emerald-400" />
                  <button onClick={() => { navigator.clipboard.writeText(effectivePixKey || ''); alert('Copiado!'); }} className="bg-emerald-500 text-black px-4 rounded-xl"><i className="fa-solid fa-copy"></i></button>
                </div>
              </div>
              <p className="text-[10px] text-amber-500 font-black uppercase text-center italic">Após o pagamento, o saldo será liberado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;
