const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
require("colors");
const userRoutes = require("./routes/user");
const chatRoutes = require("./routes/chat");
const messageRoutes = require("./routes/message");
const { notFound, errorHandler } = require("./middleware/error");

const cors = require("cors");

const app = express();

dotenv.config();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:4000",
  })
);

connectDB();

app.get("/", (req, res) => {
  res.send("hello");
});

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

const server = app.listen(4000, () => {
  console.log(`server running on port ${PORT}`.green.bold);
});

const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
  });

  socket.on("typing", (room, user) => {
    socket.in(room).emit("typing", room, user);
  });
  socket.on("stop typing", (room) => {
    socket.in(room).emit("stop typing");
  });

  socket.on("new message", (newMessage) => {
    let chat = newMessage.chat;
    if (!chat.users) {
      return;
    }

    chat.users.forEach((user) => {
      if (user._id === newMessage.sender._id) return;
      socket.in(user._id).emit("message received", newMessage);
    });
  });

  socket.off("setup", () => {
    console.log("user disconnected");
    socket.leave(userData._id);
  });
});
