import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../api/socket";
import PollResults from "./PollResults";
import ChatWidget from "./ChatWidget";

export default function LiveResults() {
    const [poll, setPoll] = useState(null);
    const [currentTime, setCurrentTime] = useState(Date.now());
    const navigate = useNavigate();

    // Update current time every second to make button state reactive
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Request current state immediately
        socket.emit("poll:getState");

        const handleUpdate = ({ poll }) => setPoll(poll);
        const handleClosed = () =>
            setPoll((prev) => (prev ? { ...prev, isActive: false } : null));

        socket.on("poll:update", handleUpdate);
        socket.on("poll:closed", handleClosed);

        return () => {
            socket.off("poll:update", handleUpdate);
            socket.off("poll:closed", handleClosed);
        };
    }, []);

    return (
        <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-2xl shadow-gray-200/50 border border-gray-100 mt-8 mb-20">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                    Question
                </h1>
                <button
                    onClick={() => navigate("/teacher/history")}
                    className="px-6 py-2.5 rounded-full bg-brand text-white font-semibold hover:bg-brand/90 transition-colors shadow-lg shadow-brand/30 flex items-center gap-2"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M2 12h10" />
                        <path d="M9 4v16" />
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <path d="M9 22V12h6v10" />
                    </svg>
                    {/* Using an eye icon or similar for "View Poll history" as per design, but text is clearer */}
                    View Poll history
                </button>
            </header>

            {poll ? (
                <div className="space-y-6">
                    <div className="bg-question-gradient text-[#F2F2F2] p-4 rounded-t-xl font-medium text-lg">
                        {poll.question}
                    </div>
                    <div className="border border-t-0 border-gray-200 rounded-b-xl p-6 pt-2">
                        <PollResults poll={poll} />
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500 text-lg">No active poll right now.</p>
                </div>
            )}

            <div className="mt-10 flex justify-end">
                <button
                    onClick={() => navigate("/teacher")}
                    disabled={poll && poll.isActive && poll.expiresAt > currentTime}
                    className="px-8 py-3 rounded-full bg-brand text-white font-semibold hover:bg-brand/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand/30 hover:shadow-brand/50 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                    {poll && poll.isActive && poll.expiresAt > currentTime
                        ? "⏳ Waiting for timer..."
                        : "+ Ask a new question"}
                </button>
            </div>

            <ChatWidget name="Teacher" role="teacher" />
        </div>
    );
}
