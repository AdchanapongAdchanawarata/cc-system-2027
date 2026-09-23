import sys

with open('src/app/dashboard/components/BriefDetailsModal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

bad_str = '''                      if (e.target.value !== brief.decision_maker) onUpdateField(brief.id, 'decision_maker', e.target.value);
                    }}
                  />
                </div>
pan className=\"w-2.5 h-2.5 rounded-full bg-[#f59e0b] shadow-sm\"></span> Pending <strong className=\"text-slate-800\">{ages.pendingDays}d</strong></span>'''

fix_str = '''                      if (e.target.value !== brief.decision_maker) onUpdateField(brief.id, 'decision_maker', e.target.value);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Row: Contact Info */}
            <div className=\"flex flex-wrap items-center gap-x-12 gap-y-4 mb-10 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl\">
              <div className=\"flex items-center gap-3 text-sm\">
                <div className=\"flex items-center gap-2 text-slate-400\">
                  <User size={16} /> <span>Nickname:</span>
                </div>
                <input 
                  type=\"text\"
                  className=\"text-[13px] text-slate-700 font-medium truncate max-w-[200px] bg-transparent hover:bg-white border border-transparent hover:border-slate-200 rounded px-2 py-1 -ml-2 focus:outline-none focus:border-primary\"
                  defaultValue={brief.coordinator_nickname || brief.requester_name || brief.requester_email?.split('@')[0]}
                  title=\"Press Enter or click away to save\"
                  onBlur={(e) => {
                    if (e.target.value !== brief.coordinator_nickname) onUpdateField(brief.id, 'coordinator_nickname', e.target.value);
                  }}
                />
              </div>
              <div className=\"flex items-center gap-3 text-sm\">
                <div className=\"flex items-center gap-2 text-slate-400\">
                  <Phone size={16} /> <span>Phone:</span>
                </div>
                <span className=\"font-medium text-slate-700\">{brief.requester_phone || brief.details?.phone || '-'}</span>
              </div>
              <div className=\"flex items-center gap-3 text-sm\">
                <div className=\"flex items-center gap-2 text-slate-400\">
                  <Mail size={16} /> <span>Email:</span>
                </div>
                <a href={mailto:\} className=\"font-medium text-slate-700 hover:text-primary transition-colors\">{brief.requester_email || '-'}</a>
              </div>
            </div>

            {/* Description Section */}
            <div className=\"mb-10\">
              <div className=\"flex items-center border-b border-slate-200 pb-2 mb-4 gap-4 text-sm text-slate-500\">
                <span className=\"font-semibold text-slate-700 border-b-2 border-slate-700 pb-2 -mb-[9px]\">?????????? / ?????????????????</span>
              </div>
              <textarea 
                className=\"w-full text-[15px] text-slate-800 leading-relaxed whitespace-pre-wrap min-h-[100px] bg-transparent border border-transparent hover:border-slate-200 focus:border-primary rounded p-2 focus:outline-none resize-y\"
                defaultValue={notes}
                onBlur={(e) => {
                  if (e.target.value !== notes) {
                    const fieldName = brief.details?.description !== undefined ? 'description' : 'notes';
                    onUpdateField(brief.id, 'details', { ...brief.details, [fieldName]: e.target.value });
                  }
                }}
              />
            </div>

            {/* Custom Fields (Table style) */}
            <div className=\"mb-10\">
              <div className=\"flex items-center text-sm font-bold text-slate-700 mb-4 cursor-pointer hover:text-slate-900\">
                <span className=\"mr-2\">?</span> ??????????????
              </div>
              <table className=\"w-full text-sm\">
                <tbody>
                  {/* Time Tracking (Phase 2 Mock) */}
                  <tr className=\"hover:bg-slate-50 transition-colors\">
                    <td className=\"px-4 py-3 w-1/3 border-r border-slate-100 bg-slate-50/50\">
                      <div className=\"flex items-center gap-2 text-slate-500\">
                        <Clock size={14} className=\"text-orange-500 shrink-0\" />
                        <span className=\"font-medium\">????????????? (SLA)</span>
                      </div>
                    </td>
                    <td className=\"px-4 py-3 w-2/3\">
                      <div className=\"flex items-center gap-4 text-xs\">
                        <span className=\"flex items-center gap-1.5\"><span className=\"w-2.5 h-2.5 rounded-full bg-[#f59e0b] shadow-sm\"></span> Pending <strong className=\"text-slate-800\">{ages.pendingDays}d</strong></span>'''

if bad_str in text:
    text = text.replace(bad_str, fix_str)
    with open('src/app/dashboard/components/BriefDetailsModal.tsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print('SUCCESS')
else:
    print('BAD STRING NOT FOUND')
