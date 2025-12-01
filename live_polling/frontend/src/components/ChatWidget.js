import React, { useEffect, useRef, useState } from "react";
import { socket } from "../api/socket";

export default function ChatWidget({ name, role }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [input, setInput] = useState("");
  const listRef = useRef(null);
  const chatWidgetRef = useRef(null);

  const currentName = name || (role === "teacher" ? "Teacher" : "Guest");

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatWidgetRef.current && !chatWidgetRef.current.contains(event.target) && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

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
    <div ref={chatWidgetRef}>
      <button
        type="button"
        className="fixed right-8 bottom-8 w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center shadow-2xl hover:bg-brand/90 transition-all z-50 hover:scale-110 active:scale-95"
        onClick={() => setIsOpen((o) => !o)}
      >
        <svg width="24" height="24" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
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
            32.25 4.875V26.9588Z" fill="white" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed right-8 bottom-24 w-80 sm:w-96 h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex border-b border-gray-100">
            <button
              type="button"
              className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "chat"
                ? "text-brand border-b-2 border-brand bg-brand/10"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              onClick={() => setActiveTab("chat")}
            >
              Chat
            </button>
            <button
              type="button"
              className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "participants"
                ? "text-brand border-b-2 border-brand bg-brand/10"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              onClick={() => setActiveTab("participants")}
            >
              Participants
            </button>
          </div>

          {activeTab === "chat" ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50" ref={listRef}>
                {messages.length === 0 && (
                  <div className="text-center text-xs text-gray-400 mt-4">No messages yet. Say hi 👋</div>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] ${isOwn(msg) ? "items-end ml-auto" : "items-start"}`}
                  >
                    <div className="text-[10px] mb-1 px-1 text-brand font-bold">
                      {msg.sender}
                    </div>
                    <div className={`px-3 py-2 rounded-2xl text-sm shadow-sm ${isOwn(msg)
                      ? "bg-brand text-white rounded-tr-none"
                      : "bg-[#373737] text-white rounded-tl-none"
                      }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <form className="p-3 border-t border-gray-100 flex gap-2 bg-white" onSubmit={sendMessage}>
                <input
                  className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-brand outline-none transition-all"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-colors disabled:opacity-50"
                  disabled={!input.trim()}
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-0">
              {participants.length === 0 && (
                <div className="text-center text-xs text-gray-400 mt-4">No participants yet.</div>
              )}

              {participants.length > 0 && (
                <div className={`grid ${isTeacher ? "grid-cols-[1fr_auto]" : "grid-cols-1"} gap-4 px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider`}>
                  <span>Name</span>
                  {isTeacher && <span>Action</span>}
                </div>
              )}

              {participants.map((p) => (
                <div key={p.id} className={`grid ${isTeacher ? "grid-cols-[1fr_auto]" : "grid-cols-1"} gap-4 px-4 py-3 border-b border-gray-50 items-center hover:bg-gray-50 transition-colors`}>
                  <span className="text-sm font-medium text-gray-900">{p.name}</span>
                  {isTeacher && (
                    <button
                      type="button"
                      className="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors border border-red-100"
                      onClick={() => kickStudent(p.id)}
                    >
                      Kick out
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
