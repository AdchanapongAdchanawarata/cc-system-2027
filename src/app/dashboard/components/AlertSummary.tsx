"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Flame, AlertTriangle } from "lucide-react";

type Brief = {
  id: string;
  project_name: string;
  unit: string;
  status: string;
  deadline: string;
  details: any;
  created_at: string;
  taskCode?: string;
};

export default function AlertSummary() {
  const [urgentTasks, setUrgentTasks] = useState<Brief[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);

  const getTaskCode = (unit: string, id: string, allBriefs: Brief[]) => {
    const prefix = unit === 'creative' ? 'DS' : unit === 'content' ? 'CT' : unit === 'pr' ? 'PR' : 'IT';
    const unitBriefs = allBriefs.filter(b => b.unit === unit);
    const index = unitBriefs.findIndex(b => b.id === id) + 1;
    return `${prefix}70-${index}`;
  };

  const getUnitColor = (unit: string) => {
    const lower = unit?.toLowerCase();
    if (lower === 'creative') return "text-[#FF7A00]";
    if (lower === 'content') return "text-[#E1306C]";
    if (lower === 'pr') return "text-[#1877F2]";
    if (lower === 'internal') return "text-[#e03131]";
    return "text-[#00a884]";
  };

  useEffect(() => {
    const fetchAlerts = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('briefs')
        .select('id, project_name, unit, status, deadline, details, created_at')
        .order('created_at', { ascending: true });
      
      if (data) {
        // Map task codes
        const dataWithCodes = data.map(b => ({
          ...b,
          taskCode: getTaskCode(b.unit, b.id, data)
        }));

        const urgent = dataWithCodes.filter(b => {
          if (b.status === 'completed' || b.status === 'cancelled') return false;
          const prio = b.details?.priority?.toLowerCase() || '';
          return prio === 'high' || prio === 'urgent' || prio === 'critical';
        });
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const overdue = dataWithCodes.filter(b => {
          if (b.status === 'completed' || b.status === 'cancelled') return false;
          const dateStr = b.deadline || b.details?.usage_date || b.details?.publish_date;
          if (!dateStr) return false;
          return new Date(dateStr) < today;
        });
        
        setUrgentTasks(urgent);
        setOverdueTasks(overdue);
      }
      setLoading(false);
    };

    fetchAlerts();
  }, []);

  if (loading) return <div className="flex-1 max-w-2xl mx-6 hidden md:flex items-center"><div className="w-full h-[72px] animate-pulse bg-surface border border-surface-border rounded-xl"></div></div>;
  
  if (urgentTasks.length === 0 && overdueTasks.length === 0) {
    return (
      <div className="flex-1 max-w-2xl mx-6 hidden md:flex items-center">
        <div className="w-full bg-surface border border-surface-border rounded-xl shadow-sm h-[72px] flex items-center px-4">
           <div className="w-3 h-3 rounded-full bg-emerald-500 mr-3"></div>
           <span className="text-sm font-semibold text-emerald-600">All Systems Normal. No urgent or overdue tasks.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-2xl mx-6 hidden md:flex items-center">
      <div className="w-full bg-surface border border-surface-border rounded-xl shadow-sm overflow-hidden flex divide-x divide-surface-border h-[72px] transition-all hover:shadow-md">
        
        {/* Left: Hardware Indicator Status */}
        <div className="w-16 bg-slate-50/50 flex flex-col items-center justify-center gap-1.5 shrink-0">
          <div className="w-3 h-3 rounded-full bg-[#E03131] shadow-[0_0_8px_rgba(224,49,49,0.6)] animate-pulse"></div>
          <span className="text-[8px] font-bold tracking-widest text-slate-400 uppercase">Alert</span>
        </div>
        
        {/* Middle: Urgent Tasks */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="flex justify-between items-center px-3 py-1 border-b border-slate-100 bg-slate-50/50">
            <span className="text-[10px] font-bold text-[#E03131] uppercase tracking-wider flex items-center gap-1">
               <Flame size={12} fill="currentColor" /> Urgent ({urgentTasks.length})
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-0.5 custom-scrollbar">
            {urgentTasks.length > 0 ? (
              <ul className="flex flex-col gap-0.5 text-[11px] pb-1">
                {urgentTasks.map(t => (
                  <li key={t.id} className="text-slate-700 truncate font-medium flex items-center gap-1.5">
                    <span className={`font-bold shrink-0 ${getUnitColor(t.unit)}`}>{t.taskCode}</span>
                    <span className="truncate">{t.project_name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-slate-400 font-normal py-1">No urgent tasks</div>
            )}
          </div>
        </div>

        {/* Right: Overdue Tasks */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="flex justify-between items-center px-3 py-1 border-b border-slate-100 bg-slate-50/50">
            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1">
               <AlertTriangle size={12} fill="currentColor" /> Overdue ({overdueTasks.length})
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-0.5 custom-scrollbar">
            {overdueTasks.length > 0 ? (
              <ul className="flex flex-col gap-1 text-[11px] pb-1">
                {overdueTasks.map(t => (
                  <li key={t.id} className="text-slate-700 truncate font-medium flex items-center gap-1.5">
                    <span className={`font-bold shrink-0 ${getUnitColor(t.unit)}`}>{t.taskCode}</span>
                    <span className="truncate">{t.project_name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-slate-400 font-normal py-1">No overdue tasks</div>
            )}
          </div>
        </div>

      </div>
      
      {/* Scrollbar styles specific for this component */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 4px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: #cbd5e1;
        }
      `}} />
    </div>
  );
}
