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
    <div className="timer-row">
      <span className="timer-label">{label}</span>
      <div className="timer-countdown">
        <span className="timer-icon">⏱</span>
        <span className={`timer-text ${isDanger ? "timer-text--danger" : ""}`}>
          {minutes}:{seconds}
        </span>
      </div>
    </div>
  );
}
