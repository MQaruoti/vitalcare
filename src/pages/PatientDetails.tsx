import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Activity, 
  Bell, 
  FileText, 
  Droplets, 
  ShieldAlert, 
  ChevronRight,
  Plus,
  Save,
  CheckCircle,
  AlertTriangle,
  History,
  TrendingUp,
  Clock,
  Thermometer,
  Heart,
  Wind,
  Droplet,
  Edit3,
  Check,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format } from 'date-fns';
import { Patient, VitalRecord, Alert, Note, IOEntry } from '../types';
import { useVitalsSimulation } from '../hooks/useVitalsSimulation';
import { generateNursingNote, checkNoteCompleteness } from '../services/ai';
import { cn } from '../lib/utils';

type Tab = 'monitoring' | 'alerts' | 'sepsis' | 'notes' | 'io' | 'history';

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('monitoring');
  const [vitalsHistory, setVitalsHistory] = useState<VitalRecord[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [ioRecords, setIoRecords] = useState<IOEntry[]>([]);
  const [docInterval, setDocInterval] = useState<number>(15); // minutes
  
  // Real-time simulated feed
  const liveVitals = useVitalsSimulation(id || '', patient?.diagnosis || '');
  
  // Ref for documentation timer
  const lastDocTime = useRef<number>(Date.now());

  useEffect(() => {
    if (id) {
      fetch(`/api/patients/${id}`).then(res => res.json()).then(setPatient);
      fetchVitals();
      fetchAlerts();
      fetchNotes();
      fetchIO();
    }
  }, [id]);

  // Documentation Logic
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const diffMs = now - lastDocTime.current;
      const diffMin = diffMs / (1000 * 60);

      if (diffMin >= docInterval && id) {
        saveVitals();
        lastDocTime.current = now;
      }
    }, 10000); // Check every 10s

    return () => clearInterval(timer);
  }, [id, docInterval, liveVitals]);

  const fetchVitals = () => fetch(`/api/vitals/${id}`).then(res => res.json()).then(setVitalsHistory);
  const fetchAlerts = () => fetch(`/api/alerts/${id}`).then(res => res.json()).then(setAlerts);
  const fetchNotes = () => fetch(`/api/notes/${id}`).then(res => res.json()).then(setNotes);
  const fetchIO = () => fetch(`/api/io/${id}`).then(res => res.json()).then(setIoRecords);

  const saveVitals = async () => {
    const resp = await fetch('/api/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: id,
        ...liveVitals,
        is_auto: true
      })
    });
    if (resp.ok) {
      fetchVitals();
      checkAlertsLocally();
    }
  };

  const checkAlertsLocally = () => {
    // Simple rule-based alerts for prototype
    const newAlerts = [];
    if (liveVitals.temp > 38) newAlerts.push({ reason: "Fever detected", priority: "medium", suggestions: ["Administer antipyretic if ordered", "Increase fluid intake", "Monitor temp q1h"] });
    if (liveVitals.hr > 110) newAlerts.push({ reason: "Tachycardia persistent", priority: "high", suggestions: ["Notify provider", "Reassess mental status", "Check fluid balance"] });
    if (liveVitals.spo2 < 92) newAlerts.push({ reason: "Oxygen desaturation", priority: "high", suggestions: ["Apply supplemental oxygen", "Assess lung sounds", "Elevate head of bed"] });

    newAlerts.forEach(async (alert) => {
       await fetch('/api/alerts', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           patient_id: id,
           priority: alert.priority,
           reason: alert.reason,
           suggestions: alert.suggestions,
           is_ai: true
         })
       });
    });
    if (newAlerts.length > 0) fetchAlerts();
  };

  if (!patient) return <div className="p-8 text-center text-slate-500">Loading patient...</div>;

  return (
    <div className="flex flex-col gap-4">
      {/* Patient Header Card */}
      <div className="bg-white border-b border-high-border px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-6 items-center shadow-sm -mt-6 -mx-8 mb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-1.5 hover:bg-high-bg rounded transition-colors text-high-text-light border border-high-border"
          >
            <ArrowLeft size={14} />
          </button>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="id-badge bg-high-bg font-bold">#{patient.id.slice(0, 8)}</span>
              <h1 className="text-[14px] font-bold text-high-text-main uppercase tracking-tight leading-none">{patient.name}</h1>
            </div>
            <div className="flex gap-1 mt-1">
              {patient.risk_flags.map(flag => (
                <span key={flag} className="risk-tag leading-none text-[9px] px-1.5 py-0.5">
                  {flag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="text-xs">
          <span className="text-high-text-light uppercase font-bold text-[10px]">Age/Sex:</span>
          <div className="font-semibold text-high-text-main">{patient.age} / {patient.gender}</div>
        </div>

        <div className="text-xs">
          <span className="text-high-text-light uppercase font-bold text-[10px]">Diagnosis:</span>
          <div className="font-semibold text-high-text-main truncate">{patient.diagnosis}</div>
        </div>

        <div className="text-xs">
          <span className="text-high-text-light uppercase font-bold text-[10px]">Allergies:</span>
          <div className="font-bold text-high-danger">{patient.allergies}</div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-1 p-1 bg-white border border-high-border rounded shadow-sm w-fit overflow-x-auto max-w-full">
        <TabButton active={activeTab === 'monitoring'} onClick={() => setActiveTab('monitoring')} label="Vitals" icon={Activity} />
        <TabButton active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')} label="Clinical Alerts" icon={Bell} count={alerts.filter(a => a.status === 'pending').length} />
        <TabButton active={activeTab === 'sepsis'} onClick={() => setActiveTab('sepsis')} label="Sepsis Watch" icon={ ShieldAlert } />
        <TabButton active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} label="Nursing Notes" icon={FileText} />
        <TabButton active={activeTab === 'io'} onClick={() => setActiveTab('io')} label="I/O Tracker" icon={Droplets} />
        <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} label="History" icon={History} />
      </div>

      {/* Content Area */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1"
      >
        {activeTab === 'monitoring' && <MonitoringView vitals={liveVitals} history={vitalsHistory} interval={docInterval} setInterval={setDocInterval} onSave={saveVitals} />}
        {activeTab === 'alerts' && <AlertsView alerts={alerts} onAck={(id) => fetch(`/api/alerts/${id}`, { method: 'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status:'acknowledged'}) }).then(fetchAlerts)} />}
        {activeTab === 'sepsis' && <SepsisModule vitals={liveVitals} />}
        {activeTab === 'notes' && <NotesModule patient={patient} vitals={vitalsHistory} io={ioRecords} alerts={alerts} notes={notes} onSave={fetchNotes} />}
        {activeTab === 'io' && <IntakeOutputModule records={ioRecords} onSave={fetchIO} />}
        {activeTab === 'history' && <HistoryView history={vitalsHistory} />}
      </motion.div>
    </div>
  );
}

function TabButton({ active, onClick, label, icon: Icon, count }: { active: boolean, onClick: () => void, label: string, icon: any, count?: number }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-1.5 rounded transition-all font-bold text-[11px] uppercase tracking-wider whitespace-nowrap",
        active ? "bg-high-sidebar text-white" : "text-high-text-light hover:bg-high-bg"
      )}
    >
      <Icon size={14} />
      {label}
      {count && count > 0 && <span className="ml-1 w-4 h-4 rounded-full bg-high-danger text-white text-[9px] flex items-center justify-center font-bold border border-white">{count}</span>}
    </button>
  );
}

// Sub-Views Components
function MonitoringView({ vitals, history, interval, setInterval, onSave }: any) {
  const chartData = [...history].reverse();
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="lg:col-span-1 space-y-4">
        <div className="card-high bg-white">
           <div className="card-header-high py-2 px-3">
              <span className="font-bold">Live Monitor</span>
              <div className="flex items-center gap-1 text-[9px] text-high-success font-bold">
                <span className="w-1.5 h-1.5 bg-high-success rounded-full animate-pulse shadow-[0_0_2px_var(--color-high-success)]" /> LIVE
              </div>
           </div>
           
           <div className="card-body py-2 px-3 space-y-2">
             <VitalDisplay label="Heart Rate (BPM)" value={vitals.hr} abnormal={vitals.hr > 100 || vitals.hr < 60} />
             <VitalDisplay label="Blood Pressure (mmHg)" value={`${vitals.bp_sys}/${vitals.bp_dia}`} abnormal={vitals.bp_sys > 140 || vitals.bp_sys < 90} />
             <VitalDisplay label="SpO2 (%)" value={`${vitals.spo2}%`} abnormal={vitals.spo2 < 93} />
             <VitalDisplay label="Temperature (°C)" value={vitals.temp} abnormal={vitals.temp > 38 || vitals.temp < 36} />
             <VitalDisplay label="Resp Rate (RPM)" value={vitals.rr} abnormal={vitals.rr > 22 || vitals.rr < 12} />
             
             <div className="pt-2">
               <button 
                 onClick={onSave}
                 className="btn-primary-high w-full py-2"
               >
                 VALIDATE & RECORD VITALS
               </button>
             </div>
           </div>
        </div>

        <div className="card-high bg-white">
           <div className="card-header-high py-2 px-3">
             <span className="font-bold uppercase tracking-tight text-[10px]">DOC INTERVAL</span>
           </div>
           <div className="p-2 grid grid-cols-2 gap-2">
             {[15, 30, 60, 120].map(m => (
               <button 
                 key={m}
                 onClick={() => setInterval(m)}
                 className={cn(
                   "py-1.5 rounded text-[10px] font-bold border transition-all uppercase",
                   interval === m ? "bg-high-sidebar text-white border-high-sidebar shadow-sm" : "bg-white text-high-text-light border-high-border hover:bg-high-bg"
                 )}
               >
                 {m < 60 ? `${m}m` : `${m/60}h`}
               </button>
             ))}
           </div>
        </div>
      </div>

      <div className="lg:col-span-3 space-y-4">
        <div className="card-high h-[350px] bg-white">
          <div className="card-header-high py-2 px-3">
            <span className="font-bold">Vital Signs Trends</span>
          </div>
          <div className="card-body p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="timestamp" tickFormatter={(t) => format(new Date(t), 'HH:mm')} tick={{fontSize: 9}} stroke="#94a3b8" />
                <YAxis tick={{fontSize: 9}} stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ borderRadius: '4px', fontSize: '10px' }}
                  labelFormatter={(t) => format(new Date(t), 'HH:mm')}
                />
                <Area type="monotone" dataKey="hr" name="HR" stroke="#ef4444" fill="#ef4444" fillOpacity={0.05} strokeWidth={2} dot={{ r: 3 }} />
                <Area type="monotone" dataKey="spo2" name="SpO2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.05} strokeWidth={2} dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="card-high h-[200px] bg-white">
             <div className="card-header-high py-1 px-3 text-[10px] uppercase">BLOOD PRESSURE</div>
             <div className="card-body p-2">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={chartData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                   <XAxis dataKey="timestamp" hide />
                   <YAxis tick={{fontSize: 9}} stroke="#94a3b8" domain={[40, 200]} />
                   <Line type="step" dataKey="bp_sys" name="Sys" stroke="#334155" strokeWidth={1.5} dot={{ r: 2 }} />
                   <Line type="step" dataKey="bp_dia" name="Dia" stroke="#64748b" strokeWidth={1.5} dot={{ r: 2 }} />
                 </LineChart>
               </ResponsiveContainer>
             </div>
           </div>
           <div className="card-high h-[200px] bg-white">
             <div className="card-header-high py-1 px-3 text-[10px] uppercase">TEMPERATURE</div>
             <div className="card-body p-2">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={chartData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                   <XAxis dataKey="timestamp" hide />
                   <YAxis tick={{fontSize: 9}} stroke="#94a3b8" domain={[35, 41]} />
                   <Line type="monotone" dataKey="temp" name="Temp" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 2 }} />
                 </LineChart>
               </ResponsiveContainer>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function VitalDisplay({ label, value, abnormal }: { label: string, value: any, abnormal: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-high-bg last:border-none">
      <div className="text-[11px] font-medium text-high-text-light uppercase tracking-tight">{label}</div>
      <div className={cn("text-[18px] font-bold font-mono tracking-tighter", abnormal ? "text-high-danger" : "text-high-text-main")}>
        {value}
      </div>
    </div>
  );
}

function AlertsView({ alerts, onAck }: { alerts: Alert[], onAck: (id: number) => void }) {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="card-high bg-white">
        <div className="card-header-high py-2 px-4 shadow-sm">
           <span className="flex items-center gap-2 uppercase tracking-tighter text-[11px] font-bold"><Bell size={14} className="text-high-primary" /> CLINICAL WARNING ENGINE</span>
           <span className="text-[10px] text-high-text-light font-normal italic">Updated: {format(new Date(), 'HH:mm')}</span>
        </div>

        <div className="card-body p-4">
          {alerts.length === 0 && (
             <div className="py-12 text-center bg-high-bg rounded border border-dashed border-high-border">
               <CheckCircle className="mx-auto text-high-success mb-2" size={32} />
               <h3 className="text-sm font-bold text-high-text-main">No Active Warnings</h3>
               <p className="text-xs text-high-text-light">Patient is currently stable within defined parameters.</p>
             </div>
          )}

          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <motion.div
                 key={alert.id}
                 initial={{ opacity: 0, scale: 0.98 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className={cn(
                   "p-3 rounded-md border flex flex-col md:flex-row gap-4 transition-all",
                   alert.priority === 'high' ? "bg-red-50/50 border-red-200" : "bg-amber-50/50 border-amber-200",
                   alert.status === 'acknowledged' && "opacity-50 grayscale"
                 )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border whitespace-nowrap",
                      alert.priority === 'high' ? "bg-high-danger text-white border-high-danger" : "bg-high-warning text-white border-high-warning"
                    )}>
                      {alert.priority} PRIORITY
                    </span>
                    <span className="text-high-text-light text-[10px] uppercase font-bold">{format(new Date(alert.timestamp), 'HH:mm')}</span>
                  </div>
                  
                  <h4 className="text-[14px] font-bold text-high-text-main mb-2">⚠️ {alert.reason}</h4>
                  
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-high-text-light uppercase tracking-tight">Suggested Interventions:</p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                      {alert.suggestions.map(s => (
                        <li key={s} className="text-[11px] text-high-text-main flex items-start gap-1.5">
                          <ChevronRight size={12} className="mt-0.5 text-high-text-light" /> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="flex flex-col justify-center gap-2">
                  {alert.status === 'pending' ? (
                    <>
                      <button 
                        onClick={() => onAck(alert.id)}
                        className="btn-primary-high uppercase px-4 whitespace-nowrap"
                      >
                        ACKNOWLEDGE
                      </button>
                      <button className="btn-secondary-high uppercase px-4 whitespace-nowrap bg-white">
                        DISMISS
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 text-high-success font-bold text-[11px] bg-white px-3 py-1 rounded border border-high-success/20">
                       <Check size={14} /> REVIEWED
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SepsisModule({ vitals }: { vitals: VitalRecord }) {
  const isHighRisk = vitals.hr > 110 || vitals.temp > 38 || vitals.bp_sys < 95;
  
  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className={cn(
        "bg-white rounded border-2 p-6 transition-all text-center",
        isHighRisk ? "border-high-danger shadow-[0_0_10px_rgba(239,68,68,0.15)]" : "border-high-success shadow-[0_0_10px_rgba(16,185,129,0.15)]"
      )}>
        <ShieldAlert className={cn("mx-auto mb-3", isHighRisk ? "text-high-danger" : "text-high-success")} size={40} />
        <h2 className={cn("text-[20px] font-bold mb-1 uppercase tracking-tight", isHighRisk ? "text-high-danger" : "text-high-success")}>
          {isHighRisk ? "SIRS Criteria Triggered - Sepsis Protocol Required" : "Sepsis Screen: Negative"}
        </h2>
        <p className="text-[11px] text-high-text-light mb-6 max-w-md mx-auto uppercase font-bold tracking-tight">
          {isHighRisk 
            ? "Vital signs indicate potential systemic inflammatory response. Initiate sepsis bundle immediately."
            : "Patient parameters currently outside SIRS trigger thresholds."}
        </p>

        <div className="flex flex-wrap justify-center gap-3">
           {[
             ['TEMP', vitals.temp > 38, vitals.temp, '>38.0'], 
             ['HR', vitals.hr > 110, vitals.hr, '>90'], 
             ['RR', vitals.rr > 22, vitals.rr, '>20'], 
             ['MAP/SBP', vitals.bp_sys < 95, vitals.bp_sys, '<90']
           ].map(([label, triggered, val, crit]: any) => (
              <div key={label} className={cn(
                "px-3 py-2 rounded text-[10px] font-bold flex flex-col items-center gap-0.5 border min-w-[80px]",
                triggered ? "bg-high-danger text-white border-high-danger animate-pulse" : "bg-white text-high-text-light border-high-border"
              )}>
                <span>{label}</span>
                <span className="text-[14px] font-mono">{val}</span>
                <span className="text-[8px] opacity-70">CRIT: {crit}</span>
              </div>
           ))}
        </div>
      </div>

      {isHighRisk && (
        <div className="card-high bg-white">
           <div className="card-header-high py-2 px-3 text-high-danger bg-red-50">
             <span className="font-bold flex items-center gap-2"><Activity size={12} /> CLINICAL INTERVENTION BUNDLE</span>
           </div>
           
           <div className="card-body p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "Oxygen support to maintain SpO2 >94%",
                "Notify MD / Sepsis Response Team",
                "Prepare for fluid bolus (30mL/kg)",
                "Obtain Blood Cultures x2 sets",
                "Measure serum lactate level",
                "Initiate broad-spectrum antibiotics"
              ].map((action, i) => (
                <div key={action} className="p-2 bg-high-bg border border-high-border rounded flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-high-danger text-white flex items-center justify-center text-[10px] font-bold">{i+1}</div>
                  <span className="text-[11px] font-bold text-high-text-main uppercase tracking-tight">{action}</span>
                </div>
              ))}
              
              <div className="col-span-full mt-2 p-2 bg-amber-50 border border-amber-200 rounded flex items-start gap-2">
                <AlertTriangle className="text-high-warning shrink-0" size={14} />
                <p className="text-[9px] text-high-text-main leading-tight italic uppercase font-bold">
                  Clinical correlation required. This screening tool is supportive and not diagnostic.
                </p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function NotesModule({ patient, vitals, io, alerts, notes, onSave }: any) {
  const [draft, setDraft] = useState('');
  const [originalAi, setOriginalAi] = useState('');
  const [loading, setLoading] = useState(false);
  const [reviewResults, setReviewResults] = useState<string[]>([]);

  const handleGenerate = async () => {
    setLoading(true);
    const text = await generateNursingNote({ patient, vitals, io, alerts });
    setDraft(text);
    setOriginalAi(text);
    setLoading(false);
  };

  const checkCompleteness = async () => {
    setLoading(true);
    const results = await checkNoteCompleteness(draft);
    setReviewResults(results);
    setLoading(false);
  };

  const saveNote = async () => {
    const resp = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patient.id,
        content: draft,
        original_ai_content: originalAi,
        nurse_id: 'nurse-jane',
        status: 'approved'
      })
    });
    if (resp.ok) {
      setDraft('');
      setReviewResults([]);
      onSave();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-6xl mx-auto">
      <div className="space-y-4">
        <div className="card-high bg-white">
           <div className="card-header-high py-2 px-3">
              <span className="font-bold uppercase tracking-tight text-[11px]">Active Note Editor</span>
              <button 
                onClick={handleGenerate}
                disabled={loading}
                className="text-[10px] font-bold bg-high-primary text-white border-none rounded px-2 py-1 shadow-sm hover:opacity-90 transition-opacity flex items-center gap-1 uppercase"
              >
                <Brain size={10} /> {loading ? 'Thinking...' : 'AI ASSIST'}
              </button>
           </div>

           <div className="card-body p-2 bg-high-bg">
             <div className="relative bg-white rounded border border-high-border overflow-hidden">
               <textarea 
                 value={draft}
                 onChange={(e) => setDraft(e.target.value)}
                 placeholder="Enter nursing documentation highlights..."
                 className="w-full h-[400px] p-4 text-[13px] leading-relaxed outline-none transition-all font-mono resize-none text-high-text-main"
               />
               {loading && <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-1">
                    <Activity size={20} className="text-high-primary animate-spin" />
                    <p className="text-[10px] font-bold text-high-primary animate-pulse uppercase">PROCESSING DATA...</p>
                  </div>
               </div>}
             </div>

             <div className="flex items-center gap-2 mt-2">
               <button 
                 onClick={checkCompleteness}
                 className="btn-secondary-high flex-1 py-1.5 text-[11px] bg-white border border-high-border"
               >
                 AI VALIDATE
               </button>
               <button 
                 onClick={saveNote}
                 disabled={!draft}
                 className="btn-primary-high flex-1 py-1.5 text-[11px] disabled:opacity-50"
               >
                 APPROVE & COMMIT
               </button>
             </div>
           </div>
        </div>

        {reviewResults.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-blue-50 border border-blue-200 rounded p-3"
          >
            <h4 className="text-[11px] font-bold text-blue-900 mb-2 flex items-center gap-1.5 uppercase"><ShieldAlert size={14} /> AI Completeness Review</h4>
            <ul className="space-y-1">
              {reviewResults.map(res => (
                <li key={res} className="text-[10px] text-blue-800 flex items-start gap-1.5">
                  <Check size={10} className="mt-0.5 text-blue-500 shrink-0" /> {res}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>

      <div className="space-y-3">
         <h3 className="card-header-high bg-transparent text-high-text-light py-0 px-2 uppercase font-bold text-[11px] flex items-center gap-2"><History size={12} /> Shift Log History</h3>
         <div className="space-y-3 h-[500px] overflow-y-auto pr-1">
            {notes.map(note => (
              <div key={note.id} className="card-high bg-white hover:border-high-primary transition-colors cursor-pointer group">
                <div className="card-header-high py-1.5 px-3 bg-high-bg">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-high-text-light uppercase">{format(new Date(note.timestamp), 'MMM d, HH:mm')}</span>
                    <span className="px-1.5 py-0.5 bg-high-success text-white text-[8px] font-bold rounded uppercase">VALIDATED</span>
                  </div>
                  <span className="text-[9px] text-high-text-light font-bold">UID: {note.nurse_id}</span>
                </div>
                <div className="p-3 text-[12px] text-high-text-main leading-relaxed font-mono whitespace-pre-wrap line-clamp-4">
                  {note.content}
                </div>
              </div>
            ))}
            {notes.length === 0 && <p className="text-[11px] text-center text-high-text-light p-8 italic">No records for current shift.</p>}
         </div>
      </div>
    </div>
  );
}

function IntakeOutputModule({ records, onSave }: any) {
  const [type, setType] = useState<'intake' | 'output'>('intake');
  const [source, setSource] = useState('');
  const [volume, setVolume] = useState('');
  
  const handleSave = async () => {
    if (!source || !volume) return;
    const resp = await fetch('/api/io', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_id: records[0]?.patient_id || 'P001', type, source, volume: Number(volume) })
    });
    if (resp.ok) {
       setSource('');
       setVolume('');
       onSave();
    }
  };

  const totalIntake = records.filter((r:any) => r.type === 'intake').reduce((acc:any, r:any) => acc + r.volume, 0);
  const totalOutput = records.filter((r:any) => r.type === 'output').reduce((acc:any, r:any) => acc + r.volume, 0);
  const balance = totalIntake - totalOutput;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="space-y-4">
        <div className="card-high bg-white">
          <div className="card-header-high py-2 px-3 font-bold uppercase tracking-tight text-[11px]">Record I/O Event</div>
          <div className="p-3 space-y-4">
            <div className="flex p-0.5 bg-high-bg rounded border border-high-border">
               <button onClick={() => setType('intake')} className={cn("flex-1 py-1 text-[10px] font-bold rounded transition-all uppercase", type === 'intake' ? "bg-white text-high-primary shadow-sm" : "text-high-text-light")}>Intake</button>
               <button onClick={() => setType('output')} className={cn("flex-1 py-1 text-[10px] font-bold rounded transition-all uppercase", type === 'output' ? "bg-white text-high-warning shadow-sm" : "text-high-text-light")}>Output</button>
            </div>
            
            <div className="space-y-2">
              <div>
                <label className="text-[9px] font-bold text-high-text-light uppercase mb-1 block">Source/Type</label>
                <input 
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder={type === 'intake' ? "e.g., Oral Fluids, IV NSS" : "e.g., Urine, Vomitus"}
                  className="w-full p-2 bg-high-bg border border-high-border rounded text-[12px] outline-none focus:border-high-primary transition-all font-mono"
                />
              </div>
              
              <div>
                <label className="text-[9px] font-bold text-high-text-light uppercase mb-1 block">Volume (mL)</label>
                <input 
                  type="number"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  placeholder="0"
                  className="w-full p-2 bg-high-bg border border-high-border rounded text-[12px] outline-none focus:border-high-primary transition-all font-mono"
                />
              </div>
            </div>

            <button 
              onClick={handleSave}
              className="btn-primary-high w-full py-2 uppercase tracking-tight"
            >
              COMMIT RECORD
            </button>
          </div>
        </div>

        <div className="bg-high-sidebar rounded p-4 text-white shadow-lg space-y-4">
           <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shift Balance Tracker</h3>
           <div className="grid grid-cols-2 gap-4">
              <div>
                 <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">TOTAL IN</p>
                 <p className="text-[18px] font-mono font-bold whitespace-nowrap">{totalIntake} mL</p>
              </div>
              <div>
                 <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">TOTAL OUT</p>
                 <p className="text-[18px] font-mono font-bold text-high-warning whitespace-nowrap">{totalOutput} mL</p>
              </div>
           </div>
           <div className="pt-3 border-t border-slate-700">
              <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">NET BALANCE</p>
              <p className={cn("text-[24px] font-mono font-bold", balance >= 0 ? "text-high-success" : "text-high-danger")}>{balance > 0 ? '+' : ''}{balance} mL</p>
           </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-3">
        <div className="card-high bg-white overflow-hidden">
           <div className="card-header-high py-2 px-4 bg-high-bg">
             <span className="font-bold uppercase text-[11px]">FLUID FLOWSHEET</span>
             <span className="text-[9px] bg-white border border-high-border px-1.5 py-0.5 rounded text-high-text-light font-bold uppercase">TODAY'S SHIFT</span>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead className="bg-high-bg border-b border-high-border">
                 <tr>
                   <th className="px-4 py-2 text-[10px] font-bold text-high-text-light uppercase tracking-tighter">TIME</th>
                   <th className="px-4 py-2 text-[10px] font-bold text-high-text-light uppercase tracking-tighter">CAT</th>
                   <th className="px-4 py-2 text-[10px] font-bold text-high-text-light uppercase tracking-tighter">DESC</th>
                   <th className="px-4 py-2 text-[10px] font-bold text-high-text-light uppercase tracking-tighter text-right">VOL</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-high-bg">
                 {records.map((r: any) => (
                   <tr key={r.id} className="hover:bg-high-bg/50 transition-colors">
                     <td className="px-4 py-2 text-[11px] font-mono text-high-text-light">{format(new Date(r.timestamp), 'HH:mm')}</td>
                     <td className="px-4 py-2">
                        <span className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border",
                          r.type === 'intake' ? "bg-high-bg text-high-primary border-high-primary/20" : "bg-high-bg text-high-warning border-high-warning/20"
                        )}>{r.type}</span>
                     </td>
                     <td className="px-4 py-2 text-[11px] font-bold text-high-text-main">{r.source}</td>
                     <td className="px-4 py-2 text-[11px] font-mono font-bold text-right text-high-text-main">{r.volume} mL</td>
                   </tr>
                 ))}
                 {records.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-high-text-light italic text-[11px]">No flow data recorded.</td></tr>}
               </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );
}

function HistoryView({ history }: { history: VitalRecord[] }) {
  return (
    <div className="card-high bg-white max-w-5xl mx-auto overflow-hidden">
      <div className="card-header-high py-2 px-4 bg-high-bg">
          <span className="font-bold uppercase text-[11px]">VITAL SIGNS ARCHIVE</span>
          <button className="text-[10px] font-bold text-high-primary hover:underline uppercase">Export shift report</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-high-bg border-b border-high-border">
            <tr>
              <th className="px-4 py-2 text-[10px] font-bold text-high-text-light uppercase tracking-tighter">TIMESTAMP</th>
              <th className="px-4 py-2 text-[10px] font-bold text-high-text-light uppercase tracking-tighter">TEMP</th>
              <th className="px-4 py-2 text-[10px] font-bold text-high-text-light uppercase tracking-tighter">HR</th>
              <th className="px-4 py-2 text-[10px] font-bold text-high-text-light uppercase tracking-tighter">RR</th>
              <th className="px-4 py-2 text-[10px] font-bold text-high-text-light uppercase tracking-tighter">BP</th>
              <th className="px-4 py-2 text-[10px] font-bold text-high-text-light uppercase tracking-tighter">SPO2</th>
              <th className="px-4 py-2 text-[10px] font-bold text-high-text-light uppercase tracking-tighter">SRC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-high-bg">
            {history.map((r: any) => (
              <tr key={r.id} className="hover:bg-high-bg/50 transition-colors">
                <td className="px-4 py-2 text-[11px] font-bold text-high-text-main">{format(new Date(r.timestamp), 'MMM d, HH:mm')}</td>
                <td className="px-4 py-2 text-[11px] font-mono">{r.temp}°C</td>
                <td className="px-4 py-2 text-[11px] font-mono">{r.hr}</td>
                <td className="px-4 py-2 text-[11px] font-mono">{r.rr}</td>
                <td className="px-4 py-2 text-[11px] font-mono">{r.bp_sys}/{r.bp_dia}</td>
                <td className="px-4 py-2 text-[11px] font-mono font-bold">{r.spo2}%</td>
                <td className="px-4 py-2">
                   <span className={cn(
                     "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border",
                     r.is_auto === 1 ? "bg-high-bg text-high-text-light border-high-border" : "bg-high-bg text-high-primary border-high-primary/20"
                   )}>{r.is_auto === 1 ? 'Auto' : 'Manual'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
