import React, { useEffect, useState } from "react";

export default function TimerBar({ expiresAt, label = "Question 1" }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;

    const update = () => {
      const now = Date.now();
      const diffSec = Math.max(0, Math.round((expiresAt - now) / 1000));
      setRemaining(diffSec);
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");
  const isDanger = remaining <= 10; // last 10s red

  return (
    <div className="flex items-center justify-between mb-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
      <span className="font-bold text-gray-700">{label}</span>
      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-100">
        <span className="text-lg">⏱</span>
        <span className={`font-mono font-bold text-lg ${isDanger ? "text-red-600" : "text-gray-900"}`}>
          {minutes}:{seconds}
        </span>
      </div>
    </div>
  );
}
