import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Filter, 
  ChevronRight, 
  Activity, 
  AlertCircle, 
  Clock,
  Heart
} from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { Patient, VitalRecord } from '../types';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/patients')
      .then(res => res.json())
      .then(data => {
        setPatients(data);
        setLoading(false);
      });
  }, []);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    p.room.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded border border-high-border shadow-sm">
        <div>
          <h2 className="text-[16px] font-bold text-high-text-main uppercase tracking-tight">Active Unit Census</h2>
          <p className="text-high-text-light text-[10px] uppercase font-bold tracking-wider">WARD 4B - SURGICAL TELEMETRY</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-high-text-light" />
            <input 
              type="text" 
              placeholder="QUICK MRN / NAME SEARCH..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1 bg-high-bg border border-high-border rounded text-[11px] font-bold w-48 focus:outline-none focus:border-high-primary transition-all uppercase tracking-tighter"
            />
          </div>
          <button className="p-1 px-2 bg-white border border-high-border rounded hover:bg-high-bg transition-colors shadow-sm text-high-text-light flex items-center gap-1.5 font-bold text-[10px] uppercase">
            <Filter size={12} /> FILTERS
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Activity className="animate-spin text-high-primary" size={24} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient, index) => (
            // @ts-ignore
            <PatientCard key={patient.id} patient={patient} index={index} />
          ))}
          {filteredPatients.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white rounded-lg border border-dashed border-high-border">
              <Users className="mx-auto text-slate-300 mb-3" size={40} />
              <p className="text-high-text-light font-bold">No patients found</p>
              <button onClick={() => setSearch('')} className="text-high-primary hover:underline mt-2 text-xs">Reset filters</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PatientCard({ patient, index }: { patient: Patient, index: number }) {
  const [latestVitals, setLatestVitals] = useState<VitalRecord | null>(null);

  useEffect(() => {
    fetch(`/api/vitals/${patient.id}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setLatestVitals(data[0]);
        }
      });
  }, [patient.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Link 
        to={`/patient/${patient.id}`}
        className="block card-high hover:border-high-primary transition-all group shadow-sm bg-white overflow-hidden"
      >
        <div className="card-header-high py-1.5 px-3 bg-high-bg border-b border-high-border">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="id-badge uppercase leading-none py-0.5 px-1.5 bg-white border border-high-border text-[9px] font-bold">BED {patient.room}</span>
            <span className="font-bold truncate text-[12px] text-high-text-main uppercase tracking-tight">{patient.name}</span>
          </div>
          <span className="text-[9px] text-high-text-light font-bold">#{patient.id.slice(0, 8)}</span>
        </div>
        
        <div className="p-3 space-y-3 bg-white">
          <div className="flex justify-between items-center text-[10px]">
             <div className="flex items-center gap-1.5">
               <span className="text-high-text-light font-bold uppercase">AGE/SEX:</span>
               <span className="font-bold text-high-text-main">{patient.age} / {patient.gender}</span>
             </div>
             <div className="flex gap-1">
               {patient.risk_flags.slice(0, 2).map(flag => (
                 <span key={flag} className="risk-tag leading-none py-0.5 px-1.5 text-[8px] font-bold uppercase">
                   {flag}
                 </span>
               ))}
             </div>
          </div>

          <div className="flex items-center gap-2 text-[10px]">
             <span className="text-high-text-light shrink-0 font-bold uppercase">DX:</span>
             <span className="font-bold text-high-text-main truncate uppercase tracking-tighter">{patient.diagnosis}</span>
          </div>

          <div className="grid grid-cols-4 gap-1 p-1.5 bg-high-bg rounded border border-high-border">
             <VitalMini label="HR" value={latestVitals?.hr} abnormal={latestVitals && (latestVitals.hr > 100 || latestVitals.hr < 60)} />
             <VitalMini label="BP" value={latestVitals ? `${latestVitals.bp_sys}` : '--'} abnormal={latestVitals && (latestVitals.bp_sys > 140 || latestVitals.bp_sys < 90)} />
             <VitalMini label="SPO2" value={latestVitals ? `${latestVitals.spo2}%` : '--'} abnormal={latestVitals && latestVitals.spo2 < 93} />
             <VitalMini label="TEMP" value={latestVitals?.temp} abnormal={latestVitals && (latestVitals.temp > 38 || latestVitals.temp < 36)} />
          </div>
        </div>

        <div className="px-3 py-1.5 border-t border-high-border flex items-center justify-between text-[9px]">
          <div className="flex items-center gap-1.5">
            <div className={cn(
               "w-2 h-2 rounded-full border border-white shadow-sm",
               patient.risk_flags.includes("Sepsis Watch") ? "bg-high-warning animate-pulse" : "bg-high-success"
            )} />
            <span className="font-bold text-high-text-light uppercase">REFRESH: {format(new Date(), 'HH:mm:ss')}</span>
          </div>
          <div className="font-bold flex items-center text-high-primary opacity-70 group-hover:opacity-100 transition-opacity uppercase tracking-widest text-[8px]">
            ENTER CHART
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function VitalMini({ label, value, abnormal }: { label: string, value: any, abnormal: any }) {
  return (
    <div className="text-center">
      <div className="text-[9px] text-high-text-light font-bold uppercase mb-0.5">{label}</div>
      <div className={cn("text-xs font-bold", abnormal ? "text-high-danger" : "text-high-text-main")}>
        {value || '--'}
      </div>
    </div>
  );
}
