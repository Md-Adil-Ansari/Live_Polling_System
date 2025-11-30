import React, { useEffect, useRef, useState } from "react";
import { socket } from "../api/socket";

export default function ChatWidget({ name, role }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [input, setInput] = useState("");
  const listRef = useRef(null);

  const currentName = name || (role === "teacher" ? "Teacher" : "Guest");

  useEffect(() => {
    const handleHistory = ({ messages }) => setMessages(messages || []);
    const handleMessage = (msg) =>
      setMessages((prev) => [...prev, msg]);
    const handleStudents = ({ students }) =>
      setParticipants(students || []);

    socket.on("chat:history", handleHistory);
    socket.on("chat:message", handleMessage);
    socket.on("students:update", handleStudents);

    socket.emit("chat:getHistory");

    return () => {
      socket.off("chat:history", handleHistory);
      socket.off("chat:message", handleMessage);
      socket.off("students:update", handleStudents);
    };
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const sendMessage = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    socket.emit("chat:message", {
      sender: currentName,
      role,
      text,
    });
    setInput("");
  };

  const isOwn = (msg) => msg.sender === currentName;

  const kickStudent = (studentId) => {
    socket.emit("teacher:kick", { studentId });
  };

  const isTeacher = role === "teacher";

  return (
    <>
      <button
        type="button"
        className="chat-fab"
        onClick={() => setIsOpen((o) => !o)}
      >
        <svg width="39" height="39" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M30.625 0H7.875C6.58207 0 
            5.34209 0.513615 4.42785 1.42785C3.51361 
            2.34209 3 3.58207 3 4.875V21.125C3 22.4179 3.51361 
            23.6579 4.42785 24.5721C5.34209 25.4864 6.58207 26 
            7.875 26H26.7087L32.7213 32.0288C32.8731 32.1794 
            33.0532 32.2985 33.2512 32.3794C33.4491 32.4603 
            33.6611 32.5012 33.875 32.5C34.0882 32.5055 34.2996 
            32.461 34.4925 32.37C34.7893 32.2481 35.0433 32.0411 
            35.2226 31.775C35.4019 31.509 35.4984 31.1958 35.5 
            30.875V4.875C35.5 3.58207 34.9864 2.34209 34.0721 
            1.42785C33.1579 0.513615 31.9179 0 30.625 0ZM32.25 
            26.9588L28.5287 23.2213C28.3769 23.0706 28.1968 22.9515 
            27.9988 22.8706C27.8009 22.7898 27.5889 22.7488 27.375 
            22.75H7.875C7.44402 22.75 7.0307 22.5788 6.72595 
            22.274C6.42121 21.9693 6.25 21.556 6.25 21.125V4.875C6.25 
            4.44402 6.42121 4.0307 6.72595 3.72595C7.0307 3.42121 
            7.44402 3.25 7.875 3.25H30.625C31.056 3.25 31.4693 
            3.42121 31.774 3.72595C32.0788 4.0307 32.25 4.44402 
            32.25 4.875V26.9588Z" fill="white"/>
        </svg>
      </button>

      {isOpen && (
        <div className="chat-panel">
          <div className="chat-tabs">
            <button
              type="button"
              className={
                "chat-tab-btn" +
                (activeTab === "chat" ? " chat-tab-btn--active" : "")
              }
              onClick={() => setActiveTab("chat")}
            >
              Chat
            </button>
            {isTeacher && (
              <button
                type="button"
                className={
                  "chat-tab-btn" +
                  (activeTab === "participants"
                    ? " chat-tab-btn--active"
                    : "")
                }
                onClick={() => setActiveTab("participants")}
              >
                Participants
              </button>
            )}
          </div>

          {activeTab === "chat" || !isTeacher ? (
            <>
              <div className="chat-messages" ref={listRef}>
                {messages.length === 0 && (
                  <div className="chat-empty">No messages yet. Say hi 👋</div>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={
                      "chat-message-row" +
                      (isOwn(msg) ? " chat-message-row--own" : "")
                    }
                  >
                    <div className="chat-message-sender">
                      {msg.sender}
                    </div>
                    <div className="chat-message-bubble">
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <form className="chat-input-row" onSubmit={sendMessage}>
                <input
                  className="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message"
                />
                <button type="submit" className="chat-send-btn">
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="chat-participants">
              {participants.length === 0 && (
                <div className="chat-empty">No participants yet.</div>
              )}

              {participants.length > 0 && (
                <div className="chat-participants-header">
                  <span>Name</span>
                  <span>Action</span>
                </div>
              )}

              {participants.map((p) => (
                <div key={p.id} className="chat-participant-row">
                  <span>{p.name}</span>
                  <button
                    type="button"
                    className="kick-btn"
                    onClick={() => kickStudent(p.id)}
                  >
                    Kick out
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
