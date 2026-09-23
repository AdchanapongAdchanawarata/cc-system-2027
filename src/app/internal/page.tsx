"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import ModernDatePicker from "@/components/ModernDatePicker";
import CustomSelect from "@/app/dashboard/components/CustomSelect";

export default function InternalTaskForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");

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
      <main className="flex-1 flex flex-col items-center justify-center p-8 w-full max-w-2xl mx-auto min-h-[80vh]">
        <div className="text-center space-y-6">
          <div className="inline-flex h-20 w-20 bg-primary/10 text-primary rounded-full items-center justify-center mb-4">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Task Logged</h1>
          <p className="text-muted-foreground text-lg">
            Your internal task has been recorded successfully.
          </p>
          <button 
            onClick={() => setIsSuccess(false)}
            className="mt-8 px-6 py-3 bg-surface border border-surface-border text-foreground rounded-md hover:bg-muted transition-colors font-medium"
          >
            Log Another Task
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 w-full max-w-3xl mx-auto py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-semibold tracking-tight mb-3">Internal Task Form</h1>
        <p className="text-muted-foreground">Log a document, meeting, or miscellaneous task.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10 rams-card p-10 relative overflow-hidden">
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
