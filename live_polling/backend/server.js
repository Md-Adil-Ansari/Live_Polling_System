const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const Poll = require("./models/Poll");
const ChatMessage = require("./models/ChatMessage");

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

// ------- MONGODB CONNECTION -------
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/live_polling")
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    // Restore active poll if exists
    await restoreActivePoll();
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ------- STATE -------
let students = {};        // socketId -> { name, hasAnswered }
let currentPoll = null;   // { id, question, options, expiresAt, isActive }
let answers = {};         // studentName -> optionIndex (changed from socketId)
let pollTimer = null;

let questionCount = 0;      // increment on each new poll
// pollHistory and chatMessages now stored in MongoDB

// ------- RESTORE ACTIVE POLL -------
async function restoreActivePoll() {
  try {
    // Find the most recent poll marked as active
    const activePoll = await Poll.findOne({ isActive: true }).sort({ createdAt: -1 });

    if (!activePoll) {
      console.log("📭 No active poll to restore");
      return;
    }

    const now = Date.now();
    const timeRemaining = activePoll.expiresAt - now;

    // If poll has expired, mark it as inactive
    if (timeRemaining <= 0) {
      activePoll.isActive = false;
      await activePoll.save();
      console.log("⏰ Restored poll had expired, marked as inactive");
      return;
    }

    // Restore poll to memory
    currentPoll = {
      id: activePoll.id || activePoll._id.toString(),
      dbId: activePoll._id, // Store MongoDB ID
      number: activePoll.number,
      question: activePoll.question,
      options: activePoll.options,
      expiresAt: activePoll.expiresAt,
      isActive: true,
    };

    questionCount = activePoll.number;

    // Restore timer for remaining time
    pollTimer = setTimeout(async () => {
      if (!currentPoll) return;
      currentPoll.isActive = false;

      // Save results and voted students to MongoDB when timer expires
      await Poll.findByIdAndUpdate(activePoll._id, {
        isActive: false,
        results: getResults(),
        votedStudents: Object.keys(answers)
      });

      console.log("Poll closed by timer (restored)");
      broadcastState();
      io.emit("poll:closed");
    }, timeRemaining);

    console.log(`✅ Restored active poll: "${currentPoll.question}" (${Math.round(timeRemaining / 1000)}s remaining)`);
  } catch (err) {
    console.error("❌ Error restoring active poll:", err);
  }
}

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
io.on("connection", async (socket) => {
  console.log("Client connected", socket.id);

  // send current poll state
  if (currentPoll) {
    socket.emit("poll:update", {
      poll: { ...currentPoll, results: getResults() },
    });
  }

  // allow client to request state (fix for late joiners)
  socket.on("poll:getState", () => {
    const p = currentPoll
      ? { ...currentPoll, results: getResults() }
      : null;
    socket.emit("poll:update", { poll: p });
  });

  // send chat history from MongoDB + participants
  const messages = await ChatMessage.find({}).sort({ timestamp: 1 }).limit(100).lean();
  socket.emit("chat:history", { messages });
  socket.emit("students:update", { students: serializeStudents() });

  // student registers
  socket.on("student:register", ({ name }) => {
    students[socket.id] = { name, hasAnswered: false };
    io.emit("students:update", { students: serializeStudents() });
  });

  // teacher creates poll
  socket.on("teacher:createPoll", async ({ question, options, duration }) => {
    // Validate: prevent creating new poll if one is currently active
    if (currentPoll && currentPoll.isActive && currentPoll.expiresAt > Date.now()) {
      socket.emit("error", { message: "Cannot create new poll while previous poll is still active" });
      console.log("❌ Rejected poll creation - active poll in progress");
      return;
    }

    // Archive current poll if exists
    if (currentPoll) {
      // Find and update the existing active poll in MongoDB
      await Poll.updateOne(
        { _id: currentPoll.dbId },
        { $set: { results: getResults(), votedStudents: Object.keys(answers), isActive: false } }
      );
      console.log("📦 Archived poll to MongoDB");
    }

    questionCount++; // increment question number
    const id = Date.now().toString();
    const expiresAt = Date.now() + duration * 1000;

    // Save new poll to MongoDB immediately as active
    const newPoll = new Poll({
      number: questionCount,
      question,
      options,
      results: [],
      expiresAt,
      isActive: true,
    });
    await newPoll.save();

    currentPoll = {
      id,
      dbId: newPoll._id, // Store MongoDB ID for updates
      number: questionCount,
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
    pollTimer = setTimeout(async () => {
      if (!currentPoll) return;
      currentPoll.isActive = false;
      currentPoll.expiresAt = Date.now();

      // Save results and voted students to MongoDB when timer expires
      await Poll.updateOne(
        { _id: currentPoll.dbId },
        {
          $set: {
            isActive: false,
            results: getResults(),
            votedStudents: Object.keys(answers)
          }
        }
      );

      console.log("Poll closed by timer");
      broadcastState();
      io.emit("poll:closed");
    }, duration * 1000);
  });

  // teacher requests history
  socket.on("teacher:getHistory", async () => {
    // Fetch ONLY archived (inactive) polls from MongoDB
    const fullHistory = await Poll.find({ isActive: false }).sort({ createdAt: 1 }).lean();

    socket.emit("teacher:history", { history: fullHistory });
  });

  // student answers
  socket.on("student:answer", async ({ optionIndex }) => {
    if (!currentPoll || !currentPoll.isActive) return;
    if (!students[socket.id]) return;

    const studentName = students[socket.id].name;

    // Check if this student (by name) has already voted
    if (answers[studentName] !== undefined) {
      console.log("⚠️ Duplicate vote rejected for student:", studentName);
      socket.emit("vote:rejected", { message: "You have already voted for this question" });
      return;
    }

    console.log("Received answer", studentName, "->", optionIndex);
    answers[studentName] = optionIndex;  // Store by student name, not socket ID
    students[socket.id].hasAnswered = true;

    broadcastState();

    // Don't auto-close poll - let timer run its course
    // Votes are preserved, but poll stays active until timer expires
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

    // Get student name before deleting from students object
    const kickedStudentName = students[studentId]?.name;

    delete students[studentId];
    // Delete vote by student name if exists
    if (kickedStudentName) {
      delete answers[kickedStudentName];
    }

    console.log("Student kicked:", studentId);

    broadcastState();
    io.emit("students:update", { students: serializeStudents() });
  });

  // ------- CHAT -------
  socket.on("chat:getHistory", async () => {
    const messages = await ChatMessage.find({}).sort({ timestamp: 1 }).limit(100).lean();
    socket.emit("chat:history", { messages });
  });

  socket.on("chat:message", async (msg) => {
    if (!msg || !msg.text) return;

    const chatMessage = new ChatMessage({
      sender: msg.sender || "Guest",
      role: msg.role || "student",
      text: msg.text,
      timestamp: Date.now(),
    });

    await chatMessage.save();

    // Broadcast to all clients
    io.emit("chat:message", chatMessage.toObject());
  });

  socket.on("disconnect", () => {
    // Remove student from active list but KEEP their answer for accurate results
    delete students[socket.id];
    // DON'T delete answers[socket.id] - preserve votes even after disconnect

    // Don't auto-close poll when all students leave - let timer run its course

    broadcastState();
    io.emit("students:update", { students: serializeStudents() });
    console.log("Client disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
