import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
    const [selectedRole, setSelectedRole] = useState(null);
    const navigate = useNavigate();

    const handleContinue = () => {
        if (selectedRole) {
            navigate(`/${selectedRole}`);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 font-sans">
            <div className="w-full max-w-4xl text-center">
                <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-brand text-white text-xs font-bold tracking-wide mb-8 shadow-sm">
                    ✦ Intervue Poll
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                    Welcome to the <span className="font-extrabold">Live Polling System</span>
                </h1>
                <p className="text-gray-500 text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
                    Please select the role that best describes you to begin using the live
                    polling system
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-3xl mx-auto">
                    <button
                        type="button"
                        className={`w-full text-left p-8 rounded-2xl border-2 transition-all duration-200 group ${selectedRole === "student"
                            ? "border-brand ring-1 ring-brand bg-brand/10 shadow-lg shadow-brand/20"
                            : "border-gray-200 hover:border-brand/30 hover:shadow-xl hover:-translate-y-1 bg-white"
                            }`}
                        onClick={() => setSelectedRole("student")}
                    >
                        <h3 className={`text-xl font-bold mb-2 ${selectedRole === 'student' ? 'text-brand' : 'text-gray-900 group-hover:text-brand'}`}>I’m a Student</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Submit your answers and view live poll results in real-time.
                        </p>
                    </button>

                    <button
                        type="button"
                        className={`w-full text-left p-8 rounded-2xl border-2 transition-all duration-200 group ${selectedRole === "teacher"
                            ? "border-brand ring-1 ring-brand bg-brand/10 shadow-lg shadow-brand/20"
                            : "border-gray-200 hover:border-brand/30 hover:shadow-xl hover:-translate-y-1 bg-white"
                            }`}
                        onClick={() => setSelectedRole("teacher")}
                    >
                        <h3 className={`text-xl font-bold mb-2 ${selectedRole === 'teacher' ? 'text-brand' : 'text-gray-900 group-hover:text-brand'}`}>I’m a Teacher</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Create questions, manage polls and see responses as they come in.
                        </p>
                    </button>
                </div>

                <button
                    type="button"
                    className="px-16 py-3.5 rounded-full bg-brand text-white font-semibold text-lg hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand/30 hover:shadow-brand/50 transform hover:-translate-y-0.5 active:translate-y-0"
                    disabled={!selectedRole}
                    onClick={handleContinue}
                >
                    Continue
                </button>
            </div>
        </div>
    );
}
