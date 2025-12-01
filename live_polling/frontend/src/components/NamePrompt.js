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
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white p-6 font-sans overflow-hidden">
      <div className="w-full max-w-[900px] text-center">
        {/* Badge */}
        <div className="inline-flex items-center justify-center px-6 py-2 rounded-full bg-[#6366f1] text-white text-[14px] font-bold tracking-wide mb-12 shadow-sm">
          ✦ Intervue Poll
        </div>

        {/* Title */}
        <h1 className="text-[56px] leading-tight text-gray-900 mb-6 tracking-tight">
          Let’s <span className="font-bold">Get Started</span>
        </h1>

        {/* Subtitle */}
        <p className="text-gray-500 text-[18px] mb-16 max-w-[700px] mx-auto leading-relaxed">
          If you’re a student, you’ll be able to <strong className="font-semibold text-gray-900">submit your answers</strong>, participate in live
          polls, and see how your responses compare with your classmates.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-w-[480px] mx-auto flex flex-col gap-12">
          <div className="text-left">
            <label className="block font-semibold text-gray-900 text-[16px] mb-4 ml-1">
              Enter your Name
            </label>
            <input
              className="w-full bg-[#f3f4f6] border-0 rounded-2xl px-6 py-5 text-gray-900 text-[18px] placeholder-gray-400 focus:ring-2 focus:ring-[#6366f1] outline-none transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Rahul Bajaj"
            />
          </div>

          <button
            type="submit"
            className="self-center px-16 py-4 rounded-full bg-[#6366f1] text-white font-semibold text-[18px] hover:bg-[#4f46e5] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200/50 hover:shadow-indigo-300 transform hover:-translate-y-0.5 active:translate-y-0"
            disabled={!name.trim()}
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
