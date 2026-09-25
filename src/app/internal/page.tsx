"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, CheckCircle2, Copy, Check } from "lucide-react";
import ModernDatePicker from "@/components/ModernDatePicker";
import CustomSelect from "@/app/dashboard/components/CustomSelect";

export default function InternalTaskForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate network request
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 w-full max-w-2xl mx-auto min-h-[70vh]">
        <div className="text-center space-y-6 bg-white p-6 sm:p-10 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl w-full">
          <div className="inline-flex h-20 w-20 bg-primary/10 text-primary rounded-full items-center justify-center mb-2">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">บันทึกภารกิจสำเร็จ</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            งานภายในของคุณถูกบันทึกเข้าระบบเรียบร้อยแล้ว
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button 
              onClick={() => setIsSuccess(false)}
              className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white rounded-full hover:bg-primary/90 transition-all font-medium text-sm shadow-md cursor-pointer"
            >
              บันทึกงานใหม่
            </button>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-6 py-2.5 bg-surface border border-surface-border text-foreground rounded-full hover:bg-muted transition-colors font-medium text-sm"
            >
              กลับสู่แดชบอร์ด
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8">
      {/* Top Navbar Actions: Back button (Left) and Copy Link button (Right) */}
      <div className="w-full flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs transition-all active:scale-95"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </Link>

        <button
          type="button"
          onClick={handleCopyLink}
          title="Copy link"
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-semibold transition-all shadow-2xs border cursor-pointer active:scale-95 ${
            copiedLink
              ? "bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-200"
              : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
          }`}
        >
          {copiedLink ? (
            <>
              <Check size={14} className="text-emerald-600" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} className="text-slate-500" />
              <span>Copy link</span>
            </>
          )}
        </button>
      </div>

      <div className="mb-6 sm:mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mb-2">Internal Task Form</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">บันทึกภารกิจภายใน เอกสาร การประชุม หรืองานประจำวัน</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-10 rams-card p-4 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl relative overflow-hidden bg-white text-slate-900 border border-slate-200 shadow-xl w-full">
        {/* Physical hardware top edge highlight */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50"></div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="task_category" className="text-sm font-medium">Task Category</label>
            <select required id="task_category" name="task_category" defaultValue="" className="w-full px-4 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all appearance-none">
              <option value="" disabled>Select category</option>
              <option value="Document">Document Preparation</option>
              <option value="Meeting">Meeting / Coordination</option>
              <option value="Design">Design & Media</option>
              <option value="Other">Other Routine Task</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="task_name" className="text-sm font-medium">Task Name</label>
            <input required type="text" id="task_name" name="task_name" className="w-full px-4 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all" placeholder="E.g., Monthly KPI Report" />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description (Optional)</label>
            <textarea id="description" name="description" rows={3} className="w-full px-4 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-y" placeholder="Brief details about what was done..."></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <input type="hidden" name="priority" value={priority} />
              <CustomSelect
                triggerClassName="w-full text-sm font-bold bg-white border border-slate-300 rounded-xl px-3.5 py-2 hover:border-slate-400"
                dropdownClassName="w-full"
                value={priority}
                onChange={setPriority}
                options={[
                  { value: "High", label: "🔥 High" },
                  { value: "Medium", label: "⚡ Medium" },
                  { value: "Low", label: "☕ Low" }
                ]}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="due_date" className="text-sm font-medium">Due Date</label>
              <ModernDatePicker
                value={dueDate}
                onChange={setDueDate}
                name="due_date"
                id="due_date"
                required
                align="center"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 flex justify-end">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex items-center px-6 py-3 rams-action-btn font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Task'} <ArrowRight size={18} className="ml-2" />
          </button>
        </div>
      </form>
    </main>
  );
}
