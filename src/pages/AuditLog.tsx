import { useState, useEffect } from 'react';
import { ClipboardList, Filter, Search, Clock, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { AuditLog as AuditLogType } from '../types';

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLogType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/audit')
      .then(res => res.json())
      .then(data => {
        setLogs(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
             <ClipboardList className="text-blue-600" /> Audit Trail
          </h2>
          <p className="text-slate-500 mt-1">Compliance and activity tracking documentation</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="flex gap-4">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search logs..." className="pl-8 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none w-48" />
            </div>
            <button className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
              <Filter size={14} /> Filter
            </button>
          </div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
             <Shield size={12} /> System Secured
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400">User ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase text-center">Action</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-xs font-medium text-slate-500 flex items-center gap-2">
                    <Clock size={12} className="text-slate-300" />
                    {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-700">{log.user_id}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded-full border border-slate-200 uppercase">
                       {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                    {log.details}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No activity logs recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-4">
         <Shield className="text-blue-500 shrink-0 mt-0.5" size={20} />
         <div>
            <h4 className="text-sm font-bold text-blue-900">Security Note</h4>
            <p className="text-xs text-blue-700/80 leading-relaxed mt-1">
              All interactions with the AI Powered Nursing Documentation system are recorded for clinical safety and educational audit purposes. Nurse reviews and manual edits of AI-generated content are specifically logged to ensure accountability.
            </p>
         </div>
      </div>
    </div>
  );
}
