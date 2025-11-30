import React from "react";

export default function PollResults({ poll }) {
  if (!poll) return null;

  const total = poll.results?.reduce((a, b) => a + b, 0) || 0;

  return (
    <div className="space-y-3">
      {poll.options.map((opt, idx) => {
        const count = poll.results?.[idx] || 0;
        const pct = total ? Math.round((count / total) * 100) : 0;

        return (
          <div className="relative h-14 rounded-lg overflow-hidden bg-gray-50" key={idx}>
            {/* The Purple Bar */}
            <div
              className="absolute inset-y-0 left-0 bg-indigo-600 transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />

            {/* Text Layer: Black (Visible where not clipped by purple) */}
            <div className="absolute inset-0 flex items-center justify-between px-4 z-10">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-white text-indigo-600 font-bold text-sm flex items-center justify-center shadow-sm">
                  {idx + 1}
                </div>
                <span className="font-medium text-gray-900 text-lg">{opt}</span>
              </div>
              <span className="font-bold text-gray-900">{pct}%</span>
            </div>

            {/* Text Layer: White (Visible where clipped by purple) */}
            <div
              className="absolute inset-0 flex items-center justify-between px-4 z-20"
              style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-white text-indigo-600 font-bold text-sm flex items-center justify-center shadow-sm">
                  {idx + 1}
                </div>
                <span className="font-medium text-white text-lg">{opt}</span>
              </div>
              <span className="font-bold text-white">{pct}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
