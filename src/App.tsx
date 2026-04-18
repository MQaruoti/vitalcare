import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  Activity, 
  Users, 
  Bell, 
  FileText, 
  Droplets, 
  ClipboardList, 
  Settings as SettingsIcon,
  LogOut,
  User,
  ShieldAlert,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { User as UserType } from './types';

// Pages
import Dashboard from './pages/Dashboard';
import PatientDetails from './pages/PatientDetails';
import AuditLog from './pages/AuditLog';

const Sidebar = ({ user, logout }: { user: UserType, logout: () => void }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Users },
    { name: 'Audit Log', path: '/audit', icon: ClipboardList },
  ];

  return (
    <div className={cn(
      "h-screen bg-high-sidebar text-white flex flex-col transition-all duration-300 shadow-xl",
      isOpen ? "w-[200px]" : "w-16"
    )}>
      <div className="p-5 font-bold text-lg border-b border-white/10 flex items-center justify-between">
        {isOpen && <div className="flex items-center gap-2">MediTrack AI</div>}
        <button onClick={() => setIsOpen(!isOpen)} className="p-1 hover:bg-white/10 rounded cursor-pointer">
          {isOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>

      <nav className="flex-1 pt-3">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded transition-all text-[11px] font-bold uppercase tracking-tight",
              location.pathname === item.path 
                ? "bg-high-primary text-white shadow-lg shadow-blue-500/10" 
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon size={16} />
            {isOpen && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded border border-white/20 bg-high-primary flex items-center justify-center text-white font-bold text-xs">
            {user.name.charAt(0)}
          </div>
          {isOpen && (
            <div className="overflow-hidden">
              <p className="text-[11px] font-bold truncate tracking-tight">{user.name.toUpperCase()}</p>
              <p className="text-[9px] opacity-40 truncate font-bold uppercase">{user.role}</p>
            </div>
          )}
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-3 w-full px-2 py-1.5 opacity-60 hover:opacity-100 hover:bg-white/5 rounded text-[10px] transition-all font-bold uppercase tracking-widest"
        >
          <LogOut size={14} />
          {isOpen && <span>Log out</span>}
        </button>
      </div>
    </div>
  );
};

const Header = () => (
  <header className="h-[48px] bg-white border-b border-high-border flex items-center justify-between px-6 z-10 shadow-sm">
    <div className="flex items-center gap-2 text-[10px] text-high-text-light font-bold uppercase tracking-widest">
      <span className="text-high-text-main opacity-50">LOCATION:</span>
      <strong className="text-high-text-main">WARD 4B</strong>
      <span className="opacity-30">|</span>
      <span>STATION 12</span>
    </div>
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-high-text-light">
        <span className="w-2 h-2 rounded-full bg-high-success animate-pulse shadow-[0_0_4px_var(--color-high-success)]"></span>
        <span>Telemetry Link Active</span>
      </div>
      <div className="bg-high-bg border border-high-border text-high-text-main px-2 py-1 rounded text-[9px] font-bold uppercase tracking-tighter">
        DOC FREQ: 15M
      </div>
    </div>
  </header>
);

const SafetyBanner = () => (
  <div className="bg-high-sidebar text-slate-500 text-[9px] h-[24px] flex items-center justify-center text-center border-t border-white/5 uppercase tracking-[2px] font-bold">
    Educational Prototype • Supportive AI Engine • No Diagnostic Authority
  </div>
);

const DEFAULT_USER: UserType = {
  id: 1,
  username: 'nurse1',
  role: 'Charge Nurse',
  name: 'Demo User',
};

export default function App() {
  const [user, setUser] = useState<UserType>(DEFAULT_USER);

  const logout = () => {
    // No-op: login is disabled, reset to default user
    setUser(DEFAULT_USER);
  };

  return (
    <Router>
      <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
        <Sidebar user={user} logout={logout} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-8">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/patient/:id" element={<PatientDetails />} />
                <Route path="/audit" element={<AuditLog />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </AnimatePresence>
          </main>
          <SafetyBanner />
        </div>
      </div>
    </Router>
  );
}

