import { Search, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function TrackStatusPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 w-full max-w-xl mx-auto min-h-[80vh]">
      <div className="w-full text-center mb-8">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Track Your Brief</h1>
        <p className="text-muted-foreground text-sm">
          Enter your email address or brief ID to check the current status of your request.
        </p>
      </div>

      <div className="rams-card p-10 w-full relative overflow-hidden">
        {/* Physical hardware top edge highlight */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50"></div>
        
        <form className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="search" className="text-sm font-medium">Email or Brief ID</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <Search size={18} />
              </div>
              <input 
                type="text" 
                id="search" 
                className="w-full pl-10 pr-4 py-3 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all" 
                placeholder="e.g., john@example.com or BRF-1234" 
              />
            </div>
          </div>

          <button 
            type="button" 
            className="w-full flex items-center justify-center px-4 py-3 rams-action-btn font-medium rounded-md"
          >
            Check Status <ArrowRight size={18} className="ml-2" />
          </button>
        </form>
      </div>

      <div className="mt-8">
        <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          &larr; Back to Home
        </Link>
      </div>
    </main>
  );
}
