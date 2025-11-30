import React, { useEffect, useState } from "react";

export default function NamePrompt({ onSetName }) {
  const [name, setName] = useState("");

  useEffect(() => {
    const saved = window.sessionStorage.getItem("studentName");
    if (saved) {
      setName(saved);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    window.sessionStorage.setItem("studentName", trimmed);
    onSetName(trimmed);
  };

  return (
    <div className="student-name-root">
      <div className="student-name-card">
        <div className="teacher-badge">✦ Intervue Poll</div>

        <h1 className="student-name-title">
          Let’s <span>Get Started</span>
        </h1>
        <p className="student-name-subtitle">
          If you’re a student, you’ll be able to <strong>submit your answers</strong>, participate in live
          polls, and see how your responses compare with your classmates.
        </p>

        <form onSubmit={handleSubmit} className="student-name-form">
          <label className="student-name-label">
            Enter your Name
            <input
              className="student-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Type your name"
            />
          </label>

          <button
            type="submit"
            className="student-name-btn"
            disabled={!name.trim()}
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
