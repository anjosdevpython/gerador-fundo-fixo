import React from 'react';

export const StatCard = ({ label, value, icon, trend, trendColor = "text-slate-400", colorClass = "bg-white text-slate-900" }) => (
    <div className={`${colorClass} border border-slate-200 rounded-3xl p-4 md:p-6 shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:translate-y-[-2px] relative overflow-hidden group`}>
        <div className="flex justify-between items-start mb-2 md:mb-4">
            <div className="p-2.5 md:p-3 bg-slate-50 rounded-2xl group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-100 shadow-sm">{icon}</div>
            <div className={`text-[9px] md:text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded-md ${trendColor} bg-slate-50 group-hover:bg-white`}>{trend}</div>
        </div>
        <div>
            <p className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase mb-0.5 md:mb-1 tracking-wider">{label}</p>
            <p className="text-xl md:text-3xl font-black tracking-tight font-mono">{value}</p>
        </div>
        <div className="absolute -right-4 -bottom-4 w-16 md:w-24 h-16 md:h-24 bg-slate-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
    </div>
);

export const InputField = ({ label, icon, ...props }) => (
    <div className="space-y-1.5 md:space-y-2">
        <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-1.5 md:gap-2">
            {icon} {label}
        </label>
        <div className="relative group">
            <input
                {...props}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 md:px-5 py-3 md:py-4 text-xs md:text-sm font-bold focus:outline-none focus:border-slate-900 transition-all placeholder:text-slate-300 pr-10 md:pr-12 group-hover:bg-white"
            />
        </div>
    </div>
);
