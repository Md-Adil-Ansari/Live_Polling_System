import React, { useEffect, useState } from "react";
import { socket } from "../api/socket";
import NamePrompt from "./NamePrompt";
import TimerBar from "./TimerBar";
import PollResults from "./PollResults";
import ChatWidget from "./ChatWidget";

export default function StudentView() {
  const [name, setName] = useState(null);
  const [poll, setPoll] = useState(null);
  const [selected, setSelected] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [kicked, setKicked] = useState(false);

  // Load name from localStorage or URL on mount
  useEffect(() => {
    // Check URL for name parameter
    const urlParams = new URLSearchParams(window.location.search);
    const nameFromUrl = urlParams.get('name');

    // Check localStorage
    const savedName = localStorage.getItem('studentName');

    if (nameFromUrl) {
      setName(nameFromUrl);
      localStorage.setItem('studentName', nameFromUrl);
      socket.emit("student:register", { name: nameFromUrl });
    } else if (savedName) {
      setName(savedName);
      socket.emit("student:register", { name: savedName });
    }
  }, []);

  // listen for poll updates & kicked event
  useEffect(() => {
    const handleUpdate = ({ poll: incomingPoll }) => {
      setPoll((prevPoll) => {
        // if no poll or poll id changed => new question
        if (!prevPoll || (incomingPoll && incomingPoll.id !== prevPoll.id)) {
          setHasSubmitted(false);
          setSelected(null);
        }
        return incomingPoll;
      });
    };

    const handleClosed = () => {
      setHasSubmitted(true);
    };

    const handleKicked = () => {
      setKicked(true);
      // Clear saved name when kicked
      localStorage.removeItem('studentName');
    };

    const handleVoteRejected = ({ message }) => {
      alert(message || "You have already voted for this question from another window/tab");
      setHasSubmitted(true);
    };

    socket.on("poll:update", handleUpdate);
    socket.on("poll:closed", handleClosed);
    socket.on("student:kicked", handleKicked);
    socket.on("vote:rejected", handleVoteRejected);

    // Request latest state in case we missed the initial event
    socket.emit("poll:getState");

    return () => {
      socket.off("poll:update", handleUpdate);
      socket.off("poll:closed", handleClosed);
      socket.off("student:kicked", handleKicked);
      socket.off("vote:rejected", handleVoteRejected);
    };
  }, []);

  const handleNameSet = (n) => {
    setName(n);
    localStorage.setItem('studentName', n);
    socket.emit("student:register", { name: n });
  };

  const submitAnswer = () => {
    if (selected == null || !poll?.isActive) return;
    socket.emit("student:answer", { optionIndex: selected });
    setHasSubmitted(true);
  };

  // 1) no name yet
  if (!name) {
    return <NamePrompt onSetName={handleNameSet} />;
  }

  // 2) kicked out screen
  if (kicked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
        <div className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-brand text-white text-sm font-bold tracking-wide mb-10 shadow-sm">
          ✦ Intervue Poll
        </div>
        <h2 className="text-5xl md:text-6xl text-gray-900 mb-6">You've been Kicked out !</h2>
        <p className="text-gray-500 text-lg max-w-md mx-auto">
          Looks like the teacher has removed you from the poll system. Please try
          again sometime.
        </p>
      </div>
    );
  }

  // 3) waiting for teacher to start a poll
  if (!poll) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 relative">
        <div className="absolute top-0 right-0 m-6 font-medium text-gray-600 bg-gray-100 px-4 py-2 rounded-full text-sm">
          {name}
        </div>

        <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-brand text-white text-xs font-bold tracking-wide mb-12 shadow-sm">
          ✦ Intervue Poll
        </div>

        <div className="w-12 h-12 border-4 border-brand/30 border-t-brand rounded-full animate-spin mb-8"></div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Wait for the teacher to ask questions..</h2>
        <ChatWidget name={name} role="student" />
      </div>
    );
  }

  // 4) poll active / closed
  return (
    <div className="w-full max-w-4xl mx-auto mt-12 px-4">
      {/* Header Row */}
      <div className="flex items-center gap-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Question {poll.number || 1}</h2>
        {poll.isActive && (
          <div className="flex items-center gap-2 text-red-600 font-bold text-xl">
            <TimerDisplay expiresAt={poll.expiresAt} />
          </div>
        )}
      </div>

      {/* Card Container */}
      <div className="border border-brand/20 rounded-xl overflow-hidden shadow-sm">
        {/* Question Header */}
        <div className="bg-question-gradient text-[#F2F2F2] p-4 md:p-6">
          <h3 className="text-xl md:text-2xl font-semibold leading-snug">
            {poll.question}
          </h3>
        </div>

        {/* Options Body */}
        <div className="bg-white p-6 md:p-8">
          {poll.isActive && !hasSubmitted ? (
            <>
              <ul className="space-y-3">
                {poll.options.map((opt, idx) => (
                  <li key={idx}>
                    <label
                      className={`block w-full text-left p-4 rounded-lg border transition-all cursor-pointer flex items-center gap-4 group ${selected === idx
                        ? "border-brand ring-1 ring-brand bg-white"
                        : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                        }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold transition-colors ${selected === idx
                          ? "bg-brand text-white"
                          : "bg-gray-400 text-white group-hover:bg-gray-500"
                          }`}
                      >
                        {idx + 1}
                      </div>
                      <input
                        type="radio"
                        name="answer"
                        disabled={hasSubmitted}
                        checked={selected === idx}
                        onChange={() => setSelected(idx)}
                        className="hidden"
                      />
                      <span className="text-gray-800 font-medium text-lg">
                        {opt}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex justify-end">
                <button
                  className="px-10 py-3 rounded-full bg-brand text-white font-bold text-lg hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand/30 hover:shadow-brand/50 transform hover:-translate-y-0.5 active:translate-y-0"
                  disabled={hasSubmitted || selected == null}
                  onClick={submitAnswer}
                >
                  {hasSubmitted ? "Submitted" : "Submit"}
                </button>
              </div>
            </>
          ) : (
            <div className="mt-0">
              <PollResults poll={poll} />
            </div>
          )}
        </div>
      </div>

      {(!poll.isActive || hasSubmitted) && (
        <div className="mt-12 text-center">
          <p className="text-xl font-bold text-gray-900">
            Wait for the teacher to ask a new question..
          </p>
        </div>
      )}

      <div className="mt-12">
        <ChatWidget name={name} role="student" />
      </div>
    </div>
  );
}

// Helper component for the timer to match the specific design
function TimerDisplay({ expiresAt }) {
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

  return (
    <>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{minutes}:{seconds}</span>
    </>
  );
}
