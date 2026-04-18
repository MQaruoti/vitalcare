import React, { useState } from 'react';
import { Activity, Lock, User, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { User as UserType } from '../types';

export default function Login({ onLogin }: { onLogin: (user: UserType) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const resp = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (resp.ok) {
        const user = await resp.json();
        onLogin(user);
        // Log login
        fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, action: 'LOGIN', details: `User ${user.username} logged in as ${user.role}` })
        });
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-high-bg flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded border border-high-border shadow-xl overflow-hidden">
          <div className="bg-high-sidebar p-8 text-white text-center border-b border-high-border">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded border border-white/20 mb-4 backdrop-blur-sm">
              <Activity size={24} />
            </div>
            <h2 className="text-[18px] font-bold uppercase tracking-tight">MediTrack AI Platform</h2>
            <p className="text-slate-400 mt-1 text-[10px] font-bold uppercase tracking-widest">Advanced Nursing Documentation</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 text-high-danger p-2 rounded text-[11px] font-bold flex items-center gap-2 border border-high-danger uppercase tracking-tighter shadow-[0_0_5px_rgba(239,68,68,0.1)] animate-pulse">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-bold text-high-text-light uppercase tracking-widest mb-1.5 block">Access Identifier</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-high-text-light" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-high-bg border border-high-border rounded text-[13px] font-bold tracking-tighter focus:border-high-primary transition-all outline-none"
                    placeholder="Enter UID..."
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-high-text-light uppercase tracking-widest mb-1.5 block">Security Protocol</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-high-text-light" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-high-bg border border-high-border rounded text-[13px] font-bold tracking-tighter focus:border-high-primary transition-all outline-none"
                    placeholder="Enter Security Key..."
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary-high w-full py-2.5 text-[12px] shadow-lg shadow-blue-600/10"
            >
              {loading ? 'AUTHENTICATING SECURELY...' : 'AUTHORIZE ACCESS'}
            </button>

            <div className="text-center">
              <p className="text-[9px] text-high-text-light font-bold uppercase border-t border-high-bg pt-4">Sandbox Credentials: nurse1 / password</p>
            </div>
          </form>
        </div>
        
        <p className="mt-6 text-center text-[9px] text-high-text-light font-bold uppercase tracking-tighter max-w-xs mx-auto italic opacity-50">
          Educational Prototype ONLY. AI-supported documentation does not replace clinical verification protocols.
        </p>
      </motion.div>
    </div>
  );
}
