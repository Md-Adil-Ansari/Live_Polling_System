import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import TeacherView from "./components/TeacherView";
import LiveResults from "./components/LiveResults";
import PollHistory from "./components/PollHistory";
import StudentView from "./components/StudentView";
import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white font-sans">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/teacher" element={<TeacherView />} />
          <Route path="/teacher/live-results" element={<LiveResults />} />
          <Route path="/teacher/history" element={<PollHistory />} />
          <Route path="/student" element={<StudentView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
