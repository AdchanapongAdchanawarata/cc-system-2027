'use client';

import React, { useState } from 'react';
import { 
  X, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Save, 
  Share2, 
  BarChart3, 
  CheckCircle2, 
  Calculator,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  OKRSettingsState, 
  QuarterlyRecord, 
  computeReachEngagementValues, 
  calculateQuarterGrowth,
  saveStoredOKRSettings,
  getFiscalYearInfo
} from '@/utils/okrSettings';

interface QuarterlyReachEngagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: OKRSettingsState;
  onSaveSettings: (updated: OKRSettingsState) => void;
}

export default function QuarterlyReachEngagementModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings
}: QuarterlyReachEngagementModalProps) {
  const fiscal = getFiscalYearInfo();
  const currentFiscalQuarter = `Q${fiscal.fiscalQuarter}` as "Q1" | "Q2" | "Q3" | "Q4";

  const [year, setYear] = useState<number>(fiscal.fiscalYear);
  const [quarter, setQuarter] = useState<"Q1" | "Q2" | "Q3" | "Q4">(currentFiscalQuarter);
  const [reach, setReach] = useState<number>(settings.manualMetrics?.r5Reach || 0);
  const [engagement, setEngagement] = useState<number>(settings.manualMetrics?.r6Engagement || 0);
  const [note, setNote] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const records = settings.quarterlyRecords || [];

  // Sort records newest first
  const sortedRecords = [...records].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.quarter.localeCompare(a.quarter);
  });

  // Realtime formula preview for entered Reach & Engagement
  const formulaValues = computeReachEngagementValues(reach, engagement);

  // 50:50 Content & PR Split
  const contentReach = Math.round(reach * 0.5);
  const contentEngage = Math.round(engagement * 0.5);
  const prReach = Math.round(reach * 0.5);
  const prEngage = Math.round(engagement * 0.5);

  const handleAddOrUpdateRecord = () => {
    const values = computeReachEngagementValues(reach, engagement);
    const existingIdx = records.findIndex(r => r.year === year && r.quarter === quarter);

    let updatedRecords: QuarterlyRecord[];
    if (existingIdx >= 0) {
      updatedRecords = [...records];
      updatedRecords[existingIdx] = {
        ...updatedRecords[existingIdx],
        reach,
        engagement,
        reachValueBaht: values.reachValueBaht,
        engagementValueBaht: values.engagementValueBaht,
        totalValueBaht: values.totalValueBaht,
        note: note.trim(),
        recordedAt: new Date().toISOString()
      };
    } else {
      const newRecord: QuarterlyRecord = {
        id: `qr-${Date.now()}`,
        year,
        quarter,
        reach,
        engagement,
        reachValueBaht: values.reachValueBaht,
        engagementValueBaht: values.engagementValueBaht,
        totalValueBaht: values.totalValueBaht,
        note: note.trim(),
        recordedAt: new Date().toISOString()
      };
      updatedRecords = [newRecord, ...records];
    }

    const updatedSettings: OKRSettingsState = {
      ...settings,
      manualMetrics: {
        r5Reach: reach,
        r6Engagement: engagement
      },
      quarterlyRecords: updatedRecords
    };

    saveStoredOKRSettings(updatedSettings);
    onSaveSettings(updatedSettings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleDeleteRecord = (id: string) => {
    const updatedRecords = records.filter(r => r.id !== id);
    // If records remain, set latest to manualMetrics
    let newLatestReach = 0;
    let newLatestEngage = 0;
    if (updatedRecords.length > 0) {
      const sorted = [...updatedRecords].sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.quarter.localeCompare(a.quarter);
      });
      newLatestReach = sorted[0].reach;
      newLatestEngage = sorted[0].engagement;
    }

    const updatedSettings: OKRSettingsState = {
      ...settings,
      manualMetrics: {
        r5Reach: newLatestReach,
        r6Engagement: newLatestEngage
      },
      quarterlyRecords: updatedRecords
    };

    saveStoredOKRSettings(updatedSettings);
    onSaveSettings(updatedSettings);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-2xl bg-blue-600 text-white shadow-xs">
              <TrendingUp size={22} />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                บันทึกผลลัพธ์จริง R5 (Reach) และ R6 (Engagement)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                แบ่งสัดส่วนให้ทีม Content (50%) และ PR (50%) อย่างเท่าเทียม พร้อมคำนวณมูลค่าและเทียบ QoQ / YoY อัตโนมัติ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Inputs */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">ปี (ค.ศ.)</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold font-mono focus:outline-none focus:border-blue-500"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
                <option value={2028}>2028</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">ไตรมาส</label>
              <select
                value={quarter}
                onChange={(e) => setQuarter(e.target.value as "Q1" | "Q2" | "Q3" | "Q4")}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold font-mono focus:outline-none focus:border-blue-500"
              >
                <option value="Q1">Q1 (ม.ค. - มี.ค.)</option>
                <option value="Q2">Q2 (เม.ย. - มิ.ย.)</option>
                <option value="Q3">Q3 (ก.ค. - ก.ย.)</option>
                <option value="Q4">Q4 (ต.ค. - ธ.ค.)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-blue-900 block mb-1">
                R5: จำนวน Reach
              </label>
              <input
                type="number"
                value={reach || ''}
                onChange={(e) => setReach(Math.max(0, Number(e.target.value)))}
                placeholder="เช่น 6,000,000"
                className="w-full bg-white border border-blue-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-blue-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-amber-900 block mb-1">
                R6: Engagement
              </label>
              <input
                type="number"
                value={engagement || ''}
                onChange={(e) => setEngagement(Math.max(0, Number(e.target.value)))}
                placeholder="เช่น 60,000"
                className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-900 focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">บันทึกเพิ่มเติม (Note)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น บันทึกสะสมแคมเปญ Q3 ประจำปี"
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* 50:50 Content & PR Split Highlight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-white rounded-xl border border-blue-200 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold text-blue-800">
                <span className="flex items-center gap-1.5">
                  <Share2 size={14} className="text-blue-600" />
                  ยูนิต Content (แบ่งสัดส่วน 50%)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono font-black">50%</span>
              </div>
              <div className="text-xs text-slate-600 font-mono pt-0.5">
                <div>Reach: <strong className="text-blue-900 text-sm">{contentReach.toLocaleString()}</strong> reach</div>
                <div>Engagement: <strong className="text-amber-900 text-sm">{contentEngage.toLocaleString()}</strong> eng.</div>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-cyan-200 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold text-cyan-800">
                <span className="flex items-center gap-1.5">
                  <Share2 size={14} className="text-cyan-600" />
                  ยูนิต PR (แบ่งสัดส่วน 50%)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-[10px] font-mono font-black">50%</span>
              </div>
              <div className="text-xs text-slate-600 font-mono pt-0.5">
                <div>Reach: <strong className="text-cyan-900 text-sm">{prReach.toLocaleString()}</strong> reach</div>
                <div>Engagement: <strong className="text-amber-900 text-sm">{prEngage.toLocaleString()}</strong> eng.</div>
              </div>
            </div>
          </div>

          {/* Monetary Conversion Formula */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-xs">
            <div className="flex items-center gap-2">
              <Calculator size={16} className="text-emerald-700" />
              <div>
                <span className="font-bold text-emerald-950 block">มูลค่าเทียบเคียงเชิงพาณิชย์รวม (R5 + R6)</span>
                <span className="text-[11px] text-emerald-800 font-mono">
                  Reach: ฿{formulaValues.reachValueBaht.toLocaleString()} + Eng.: ฿{formulaValues.engagementValueBaht.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-black font-mono text-emerald-800">
                ฿{formulaValues.totalValueBaht.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleAddOrUpdateRecord}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                savedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
              }`}
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 size={15} /> บันทึกและคำนวณเรียบร้อย!
                </>
              ) : (
                <>
                  <Save size={15} /> บันทึกไตรมาส {quarter}/{year}
                </>
              )}
            </button>
          </div>
        </div>

        {/* History Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <BarChart3 size={15} className="text-blue-600" />
            ประวัติการบันทึกรายไตรมาส (และอัตราเติบโต QoQ / YoY)
          </h4>

          {sortedRecords.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              ยังไม่มีประวัติการบันทึกรายไตรมาส กรอกข้อมูลด้านบนแล้วกดบันทึกเพื่อเริ่มต้นระบบ
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
              {sortedRecords.map((r) => {
                const growth = calculateQuarterGrowth(r, sortedRecords);
                return (
                  <div key={r.id} className="p-3.5 bg-white hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-900 font-mono font-black text-xs">
                          {r.quarter}/{r.year}
                        </span>
                        {r.note && <span className="text-slate-500 text-[11px]">• {r.note}</span>}
                      </div>

                      <div className="flex items-center gap-4 mt-1.5 font-mono text-[11px] text-slate-700 flex-wrap">
                        <span>Reach: <strong className="text-blue-900 font-bold">{r.reach.toLocaleString()}</strong> (ฝ่ายละ {Math.round(r.reach * 0.5).toLocaleString()})</span>
                        <span>Eng.: <strong className="text-amber-900 font-bold">{r.engagement.toLocaleString()}</strong> (ฝ่ายละ {Math.round(r.engagement * 0.5).toLocaleString()})</span>
                        <span>มูลค่า: <strong className="text-emerald-700 font-bold">฿{r.totalValueBaht.toLocaleString()}</strong></span>
                      </div>

                      {/* Growth tags */}
                      <div className="flex items-center gap-3 mt-1 text-[10px] font-mono">
                        {growth.qoqReachPercent !== null && (
                          <span className={`inline-flex items-center gap-0.5 font-bold ${growth.qoqReachPercent >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {growth.qoqReachPercent >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            QoQ Reach: {growth.qoqReachPercent > 0 ? `+${growth.qoqReachPercent}%` : `${growth.qoqReachPercent}%`}
                          </span>
                        )}
                        {growth.yoyReachPercent !== null && (
                          <span className={`inline-flex items-center gap-0.5 font-bold ${growth.yoyReachPercent >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {growth.yoyReachPercent >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            YoY Reach: {growth.yoyReachPercent > 0 ? `+${growth.yoyReachPercent}%` : `${growth.yoyReachPercent}%`}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteRecord(r.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                      title="ลบรายการนี้"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
