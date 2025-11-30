import React from "react";

export default function PollResults({ poll }) {
  if (!poll) return null;

  const total = poll.results?.reduce((a, b) => a + b, 0) || 0;

  return (
    <div className="results-shell">
      <div className="results-question-bar">
        <span className="results-question-text">{poll.question}</span>
      </div>

      <div className="results-options-list">
        {poll.options.map((opt, idx) => {
          const count = poll.results?.[idx] || 0;
          const pct = total ? Math.round((count / total) * 100) : 0;
          const fillWidth = pct === 0 ? 0 : Math.max(pct, 10); // small min fill so it’s visible

          return (
            <div className="result-option-row" key={idx}>
              <div
                className="result-pill"
                style={{ "--fill-width": `${fillWidth}%` }}
              >
                <div className="result-pill-fill" />

                <div className="result-pill-content">
                  <div className="result-left">
                    <div className="result-index">{idx + 1}</div>
                    <div className="result-label">{opt}</div>
                  </div>

                  <div className="result-right">
                    {pct}%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
