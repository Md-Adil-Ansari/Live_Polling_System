import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../api/socket";
// import PollResults from "./PollResults"; // Removed as it is used in LiveResults page
import ChatWidget from "./ChatWidget";

const DURATION_OPTIONS = [30, 45, 60, 90, 120];

export default function TeacherView() {
  const [question, setQuestion] = useState("");
  const [duration, setDuration] = useState(60);
  const [showDurationOptions, setShowDurationOptions] = useState(false);
  const [options, setOptions] = useState([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false }
  ]);
  const [poll, setPoll] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now()); // Track current time for reactive button state
  const maxChars = 100;
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Update current time every second to make canAskNew reactive
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Request current poll state when component mounts
    socket.emit("poll:getState");

    const handleUpdate = ({ poll }) => setPoll(poll);
    const handleClosed = () =>
      setPoll(prev => (prev ? { ...prev, isActive: false } : null));

    socket.on("poll:update", handleUpdate);
    socket.on("poll:closed", handleClosed);

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDurationOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      socket.off("poll:update", handleUpdate);
      socket.off("poll:closed", handleClosed);
      document.removeEventListener("mousedown", handleClickOutside);
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

  // Check if teacher can ask a new question - must wait for timer to expire
  const canAskNew = !poll || !poll.isActive || (poll.expiresAt && poll.expiresAt <= currentTime);

  const handleAskQuestion = (e) => {
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

    navigate("/teacher/live-results");
  };

  const charsUsed = question.length > maxChars ? maxChars : question.length;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-2xl shadow-gray-200/50 border border-gray-100 mt-1 mb-20">
      <header className="mb-8">
        <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-brand text-white text-xs font-bold tracking-wide mb-6 shadow-sm">
          ✦ Intervue Poll
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Let’s <span className="font-extrabold">Get Started</span>
        </h1>
        <p className="text-gray-500 text-sm md:text-base max-w-2xl">
          you’ll have the ability to create and manage polls, ask questions, and
          monitor your students&apos; responses in real-time.
        </p>
      </header>

      <form className="mt-8" onSubmit={handleAskQuestion}>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-bold text-gray-900">Enter your question</label>

          {/* Custom Duration Input */}
          <div className="relative" ref={dropdownRef}>
            <div
              className="flex items-center bg-[#f3f4f6] rounded-lg px-4 py-2.5 cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => setShowDurationOptions(!showDurationOptions)}
            >
              <input
                type="number"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="bg-transparent border-0 p-0 min-w-[2ch] max-w-[6ch] text-gray-900 font-medium focus:ring-0 text-right appearance-none no-spinner -mr-1"
                placeholder="60"
                style={{ width: `${String(duration).length + 1}ch` }}
              />
              <span className="text-gray-900 font-medium ml-2 mr-3">seconds</span>
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 8L0.669873 0.5L9.33013 0.5L5 8Z" fill="#7765DA" />
              </svg>
            </div>

            {showDurationOptions && (
              <div className="absolute right-0 z-10 w-full min-w-[140px] mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                {DURATION_OPTIONS.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-brand/10 hover:text-brand"
                    onClick={() => {
                      setDuration(sec);
                      setShowDurationOptions(false);
                    }}
                  >
                    {sec} seconds
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="relative rounded-xl overflow-hidden bg-gray-50 transition-all">
          <textarea
            className="w-full bg-transparent border-0 p-4 pb-10 text-gray-900 focus:ring-3 focus:ring-brand min-h-[140px] resize-none text-base placeholder-gray-400 appearance-none"
            value={question}
            maxLength={maxChars}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Type your question here"
          />

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200">
            <div
              className="h-full bg-brand transition-all duration-300 ease-out"
              style={{ width: `${(charsUsed / maxChars) * 100}%` }}
            />
          </div>

          <div className="absolute right-4 bottom-3 text-xs text-gray-400 font-medium">
            {charsUsed}/{maxChars}
          </div>
        </div>

        <div className="flex justify-between mt-8 mb-4 px-1">
          <span className="text-sm font-bold text-gray-900">Edit Options</span>
          <span className="text-sm font-bold text-gray-900">Is it Correct?</span>
        </div>

        <div className="space-y-4">
          {options.map((opt, idx) => (
            <div className="grid grid-cols-[1.4fr_0.8fr] gap-6 items-center" key={idx}>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  {idx + 1}
                </div>
                <input
                  className="flex-1 bg-gray-50 border-0 rounded-xl p-3 text-gray-900 text-sm focus:ring-2 focus:ring-brand placeholder-gray-400"
                  value={opt.text}
                  onChange={e => handleOptionText(idx, e.target.value)}
                  placeholder="Type option text"
                />
              </div>

              <div className="flex gap-4 justify-start">
                <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                  <input
                    type="radio"
                    name={`correct-${idx}`}
                    checked={opt.isCorrect === true}
                    onChange={() => handleCorrectChange(idx, true)}
                    className="w-4 h-4 text-brand focus:ring-brand border-gray-300"
                  />
                  <span>Yes</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                  <input
                    type="radio"
                    name={`correct-${idx}`}
                    checked={opt.isCorrect === false}
                    onChange={() => handleCorrectChange(idx, false)}
                    className="w-4 h-4 text-brand focus:ring-brand border-gray-300"
                  />
                  <span>No</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="mt-6 flex items-center gap-2 text-brand font-semibold text-sm hover:bg-brand/10 px-4 py-2 rounded-full transition-colors border border-brand/30 hover:border-brand/50"
          onClick={addOption}
        >
          + Add More option
        </button>

        {/* Bottom bar like the Figma */}
        <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between items-center">
          <button
            type="button"
            onClick={() => navigate("/teacher/history")}
            className="px-6 py-3 rounded-full bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all border border-gray-200 hover:border-gray-300"
          >
            📊 View History
          </button>

          <button
            type="submit"
            className="px-8 py-3 rounded-full bg-brand text-white font-semibold hover:bg-brand/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand/30 hover:shadow-brand/50 transform hover:-translate-y-0.5 active:translate-y-0"
            disabled={!canAskNew}
          >
            {canAskNew ? "Ask Question" : "Waiting for timer..."}
          </button>
        </div>
      </form>

      <ChatWidget name="Teacher" role="teacher" />
    </div>
  );
}
