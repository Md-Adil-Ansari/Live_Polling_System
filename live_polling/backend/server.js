const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ------- STATE -------
let students = {};        // socketId -> { name, hasAnswered }
let currentPoll = null;   // { id, question, options, expiresAt, isActive }
let answers = {};         // socketId -> optionIndex
let pollTimer = null;
let chatMessages = [];    // { id, sender, role, text, ts }

// helper to send students with ids
function serializeStudents() {
  return Object.entries(students).map(([id, s]) => ({
    id,
    name: s.name,
  }));
}

// ------- HELPERS -------
function getResults() {
  if (!currentPoll) return [];
  const counts = currentPoll.options.map(() => 0);
  Object.values(answers).forEach((idx) => {
    if (typeof idx === "number" && counts[idx] !== undefined) {
      counts[idx] += 1;
    }
  });
  return counts;
}

function allStudentsAnswered() {
  const ids = Object.keys(students);
  if (ids.length === 0) return false;
  return ids.every((id) => students[id].hasAnswered);
}

function broadcastState() {
  if (!currentPoll) {
    io.emit("poll:update", { poll: null });
    return;
  }

  const pollWithResults = {
    ...currentPoll,
    results: getResults(),
  };

  io.emit("poll:update", { poll: pollWithResults });
}

// ------- SOCKET.IO -------
io.on("connection", (socket) => {
  console.log("Client connected", socket.id);

  // send current poll state
  if (currentPoll) {
    socket.emit("poll:update", {
      poll: { ...currentPoll, results: getResults() },
    });
  }

  // send chat + participants
  socket.emit("chat:history", { messages: chatMessages });
  socket.emit("students:update", { students: serializeStudents() });

  // student registers
  socket.on("student:register", ({ name }) => {
    students[socket.id] = { name, hasAnswered: false };
    io.emit("students:update", { students: serializeStudents() });
  });

  // teacher creates poll
  socket.on("teacher:createPoll", ({ question, options, duration }) => {
    if (currentPoll && currentPoll.isActive) return;

    const id = Date.now().toString();
    const expiresAt = Date.now() + duration * 1000;

    currentPoll = {
      id,
      question,
      options,
      expiresAt,
      isActive: true,
    };

    answers = {};
    Object.keys(students).forEach((id) => {
      students[id].hasAnswered = false;
    });

    console.log("New poll:", currentPoll);
    broadcastState();

    if (pollTimer) clearTimeout(pollTimer);
    pollTimer = setTimeout(() => {
      if (!currentPoll) return;
      currentPoll.isActive = false;
      currentPoll.expiresAt = Date.now();
      console.log("Poll closed by timer");
      broadcastState();
      io.emit("poll:closed");
    }, duration * 1000);
  });

  // student answers
  socket.on("student:answer", ({ optionIndex }) => {
    if (!currentPoll || !currentPoll.isActive) return;
    if (!students[socket.id]) return;

    console.log("Received answer", socket.id, "->", optionIndex);
    answers[socket.id] = optionIndex;
    students[socket.id].hasAnswered = true;

    broadcastState();

    if (allStudentsAnswered()) {
      if (pollTimer) clearTimeout(pollTimer);
      currentPoll.isActive = false;
      currentPoll.expiresAt = Date.now();
      console.log("Poll closed: all students answered");
      broadcastState();
      io.emit("poll:closed");
    }
  });

  // teacher clears poll
  socket.on("teacher:clearPoll", () => {
    currentPoll = null;
    answers = {};
    if (pollTimer) clearTimeout(pollTimer);
    console.log("Poll cleared by teacher");
    io.emit("poll:update", { poll: null });
  });

  // ------- KICK OUT -------
  socket.on("teacher:kick", ({ studentId }) => {
    // basic safety
    if (!studentId) return;

    const target = io.sockets.sockets.get(studentId);
    if (target) {
      // notify the kicked student
      target.emit("student:kicked");
    }

    delete students[studentId];
    delete answers[studentId];

    console.log("Student kicked:", studentId);

    broadcastState();
    io.emit("students:update", { students: serializeStudents() });
  });

  // ------- CHAT -------
  socket.on("chat:getHistory", () => {
    socket.emit("chat:history", { messages: chatMessages });
  });

  socket.on("chat:message", (msg) => {
    if (!msg || !msg.text) return;
    const fullMsg = {
      id: Date.now().toString() + Math.random().toString(16).slice(2),
      sender: msg.sender || "Guest",
      role: msg.role || "student",
      text: msg.text,
      ts: Date.now(),
    };

    chatMessages.push(fullMsg);
    if (chatMessages.length > 100) chatMessages.shift();

    io.emit("chat:message", fullMsg);
  });

  socket.on("disconnect", () => {
    delete students[socket.id];
    delete answers[socket.id];

    if (Object.keys(students).length === 0 && currentPoll && currentPoll.isActive) {
      currentPoll.isActive = false;
    }

    broadcastState();
    io.emit("students:update", { students: serializeStudents() });
    console.log("Client disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
