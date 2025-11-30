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
    };

    socket.on("poll:update", handleUpdate);
    socket.on("poll:closed", handleClosed);
    socket.on("student:kicked", handleKicked);

    return () => {
      socket.off("poll:update", handleUpdate);
      socket.off("poll:closed", handleClosed);
      socket.off("student:kicked", handleKicked);
    };
  }, []);

  const handleNameSet = (n) => {
    setName(n);
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
      <div className="student-kicked-screen">
        <div className="top-badge">✦ Intervue Poll</div>
        <h2 className="kicked-title">You’ve been Kicked out !</h2>
        <p className="kicked-subtitle">
          Looks like the teacher has removed you from the poll system. Please try
          again sometime.
        </p>
      </div>
    );
  }

  // 3) waiting for teacher to start a poll
  if (!poll) {
    return (
      <div className="student-wait-screen">
        <div className="top-badge">✦ Intervue Poll</div>
        <div className="spinner" />
        <h2 className="wait-title">Wait for the teacher to ask questions..</h2>
        <div className="student-floating-name">{name}</div>
        <ChatWidget name={name} role="student" />
      </div>
    );
  }

  // 4) poll active / closed
  return (
    <div className="student-view">
      <p className="welcome">Hi, {name}</p>

      <div className="poll-card">
        <p className="poll-question">{poll.question}</p>

        {poll.isActive && (
          <>
            <TimerBar expiresAt={poll.expiresAt} />
            <ul className="poll-options">
              {poll.options.map((opt, idx) => (
                <li key={idx}>
                  <label>
                    <input
                      type="radio"
                      name="answer"
                      disabled={hasSubmitted}
                      checked={selected === idx}
                      onChange={() => setSelected(idx)}
                    />
                    {opt}
                  </label>
                </li>
              ))}
            </ul>
            <button
              disabled={hasSubmitted || selected == null}
              onClick={submitAnswer}
            >
              {hasSubmitted ? "Answer submitted" : "Submit"}
            </button>
          </>
        )}

        {(!poll.isActive || hasSubmitted) && (
          <div className="results-section">
            <h4>Live Results</h4>
            <PollResults poll={poll} />
          </div>
        )}
      </div>

      <ChatWidget name={name} role="student" />
    </div>
  );
}
