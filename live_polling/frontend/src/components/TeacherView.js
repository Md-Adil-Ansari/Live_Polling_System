import React, { useEffect, useState } from "react";
import { socket } from "../api/socket";
import PollResults from "./PollResults";
import ChatWidget from "./ChatWidget";

import "../index.css";

const DURATION_OPTIONS = [30, 45, 60, 90, 120];

export default function TeacherView() {
  const [question, setQuestion] = useState("");
  const [duration, setDuration] = useState(60);
  const [options, setOptions] = useState([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false }
  ]);
  const [poll, setPoll] = useState(null);
  const maxChars = 100;

  useEffect(() => {
    const handleUpdate = ({ poll }) => setPoll(poll);
    const handleClosed = () =>
      setPoll(prev => (prev ? { ...prev, isActive: false } : null));

    socket.on("poll:update", handleUpdate);
    socket.on("poll:closed", handleClosed);

    return () => {
      socket.off("poll:update", handleUpdate);
      socket.off("poll:closed", handleClosed);
    };
  }, []);

  const handleOptionText = (idx, value) => {
    setOptions(prev =>
      prev.map((opt, i) => (i === idx ? { ...opt, text: value } : opt))
    );
  };

  const handleCorrectChange = (idx, value) => {
    setOptions(prev =>
      prev.map((opt, i) =>
        i === idx ? { ...opt, isCorrect: value } : opt
      )
    );
  };

  const addOption = () => {
    setOptions(prev => [...prev, { text: "", isCorrect: false }]);
  };

  const canAskNew = !poll || (poll && !poll.isActive);

  const handleAskQuestion = e => {
    e.preventDefault();
    if (!canAskNew) return;

    const trimmedQuestion = question.trim();
    const cleanOptions = options
      .map(o => o.text.trim())
      .filter(Boolean);

    if (!trimmedQuestion || cleanOptions.length < 2) return;

    socket.emit("teacher:createPoll", {
      question: trimmedQuestion,
      options: cleanOptions,
      duration: Number(duration) || 60
    });

    setQuestion("");
    setOptions([
      { text: "", isCorrect: false },
      { text: "", isCorrect: false }
    ]);
  };

  const charsUsed = question.length > maxChars ? maxChars : question.length;

  return (
    <div className="teacher-shell">
      <header className="teacher-header">
        <div className="teacher-badge">✦ Intervue Poll</div>
        <h1 className="teacher-title">
          Let’s <span>Get Started</span>
        </h1>
        <p className="teacher-subtitle">
          you’ll have the ability to create and manage polls, ask questions, and
          monitor your students&apos; responses in real-time.
        </p>
      </header>

      <form className="teacher-form" onSubmit={handleAskQuestion}>
        <div className="teacher-question-row">
          <label className="teacher-label">Enter your question</label>
          <div className="teacher-duration-select">
            <select
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
            >
              {DURATION_OPTIONS.map(sec => (
                <option key={sec} value={sec}>
                  {sec} seconds
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="teacher-textarea-wrapper">
          <textarea
            className="teacher-textarea"
            value={question}
            maxLength={maxChars}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Type your question here"
          />
          <div className="teacher-char-counter">
            {charsUsed}/{maxChars}
          </div>
        </div>

        <div className="teacher-options-header">
          <span className="teacher-label">Edit Options</span>
          <span className="teacher-label teacher-label-right">
            Is it Correct?
          </span>
        </div>

        <div className="teacher-options-list">
          {options.map((opt, idx) => (
            <div className="teacher-option-row" key={idx}>
              <div className="teacher-option-left">
                <div className="teacher-option-index">{idx + 1}</div>
                <input
                  className="teacher-option-input"
                  value={opt.text}
                  onChange={e => handleOptionText(idx, e.target.value)}
                  placeholder="Type option text"
                />
              </div>

              <div className="teacher-option-right">
                <label className="teacher-radio-label">
                  <input
                    type="radio"
                    name={`correct-${idx}`}
                    checked={opt.isCorrect === true}
                    onChange={() => handleCorrectChange(idx, true)}
                  />
                  <span>Yes</span>
                </label>
                <label className="teacher-radio-label">
                  <input
                    type="radio"
                    name={`correct-${idx}`}
                    checked={opt.isCorrect === false}
                    onChange={() => handleCorrectChange(idx, false)}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="teacher-add-option-btn"
          onClick={addOption}
        >
          + Add More option
        </button>

        {/* Bottom bar like the Figma */}
        <div className="teacher-bottom-bar">
          <button
            type="submit"
            className="teacher-submit-btn"
            disabled={!canAskNew}
          >
            {canAskNew ? "Ask Question" : "Waiting for responses..."}
          </button>
        </div>
      </form>

      {/* Optional: live results block below form */}
      {poll && (
        <section className="teacher-results-section">
          <h3>Live Results</h3>
          <PollResults poll={poll} />
        </section>
      )}
      <ChatWidget name="Teacher" role="teacher" />
    </div>
  );
}
