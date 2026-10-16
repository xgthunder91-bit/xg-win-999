import React, { useEffect, useState } from 'react';

export const Footer: React.FC = () => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format: 16 Oct, 2026 | 19:45:20
      const day = now.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[now.getMonth()];
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');

      setTimeStr(`${day} ${month}, ${year} | ${hours}:${mins}:${secs}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="w-full flex items-center justify-between px-4 py-2 text-[11px] text-slate-500 font-medium select-none z-10 border-t border-slate-900/60 bg-[#090d14]/70">
      <div>
        <span>TopBet Games • Vortex</span>
      </div>
      <div className="tabular-nums">
        <span>{timeStr || '16 Oct, 2026 | 19:45:20'}</span>
      </div>
    </footer>
  );
};
