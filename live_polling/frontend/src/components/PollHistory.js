import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../api/socket";
import PollResults from "./PollResults";
import ChatWidget from "./ChatWidget";

export default function PollHistory() {
    const [history, setHistory] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        socket.emit("teacher:getHistory");

        const handleHistory = ({ history }) => {
            // Keep chronological order (oldest first)
            setHistory(history);
        };

        socket.on("teacher:history", handleHistory);

        return () => {
            socket.off("teacher:history", handleHistory);
        };
    }, []);

    return (
        <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-2xl shadow-gray-200/50 border border-gray-100 mt-8 mb-20">
            <header className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    View <span className="font-extrabold">Poll History</span>
                </h1>
            </header>

            <div className="space-y-12">
                {history.length > 0 ? (
                    history.map((poll, idx) => (
                        <div key={poll.id || idx}>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                Question {idx + 1}
                            </h3>
                            <div className="space-y-6">
                                <div className="bg-question-gradient text-[#F2F2F2] p-4 rounded-t-xl font-medium text-lg">
                                    {poll.question}
                                </div>
                                <div className="border border-t-0 border-gray-200 rounded-b-xl p-6 pt-2">
                                    <PollResults poll={poll} />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500 text-lg">No poll history available.</p>
                    </div>
                )}
            </div>


            <ChatWidget name="Teacher" role="teacher" />
        </div>
    );
}
