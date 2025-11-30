// src/App.js
import React, { useState } from "react";
import TeacherView from "./components/TeacherView";
import StudentView from "./components/StudentView";
import "./index.css";

export default function App() {
  const [role, setRole] = useState(null);          // confirmed role
  const [selectedRole, setSelectedRole] = useState(null); // temporary selection

  if (!role) {
    return (
      <div className="landing-root">
        <div className="landing-card">
          <div className="landing-badge">✦ Intervue Poll</div>

          <h1 className="landing-title">
            Welcome to the <span>Live Polling System</span>
          </h1>
          <p className="landing-subtitle">
            Please select the role that best describes you to begin using the live
            polling system
          </p>

          <div className="landing-role-row">
            <button
              type="button"
              className={
                "role-card" +
                (selectedRole === "student" ? " role-card--active" : "")
              }
              onClick={() => setSelectedRole("student")}
            >
              <h3>I’m a Student</h3>
              <p>
                Submit your answers and view live poll results in real-time.
              </p>
            </button>

            <button
              type="button"
              className={
                "role-card" +
                (selectedRole === "teacher" ? " role-card--active" : "")
              }
              onClick={() => setSelectedRole("teacher")}
            >
              <h3>I’m a Teacher</h3>
              <p>
                Create questions, manage polls and see responses as they come in.
              </p>
            </button>
          </div>

          <button
            type="button"
            className="landing-continue-btn"
            disabled={!selectedRole}
            onClick={() => setRole(selectedRole)}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // After role is chosen, show the actual app
  return (
    <div className="app">
      <header className="app-header">
        <button className="back-btn" onClick={() => setRole(null)}>
          ← Back
        </button>
        <h2>{role === "teacher" ? "Teacher Panel" : "Student Panel"}</h2>
      </header>
      {role === "teacher" ? <TeacherView /> : <StudentView />}
    </div>
  );
}
