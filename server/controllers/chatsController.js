const expressAsyncHandler = require("express-async-handler");
const Chat = require("../database/models/chat");
const User = require("../database/models/user");

const accessChat = expressAsyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.sendStatus(400);
  }

  let chat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password")
    .populate("latestMessage");

  chat = await User.populate(chat, {
    path: "latestMessage.sender",
    select: "name pic email",
  });

  if (chat.length > 0) {
    res.send(chat[0]);
  } else {
    const newChat = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    };

    try {
      const createdChat = await Chat.create(newChat);
      const chat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );
      res.status(200).send(chat);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }
});

const fetchChats = expressAsyncHandler(async (req, res) => {
  try {
    const chats = await Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
    })
      .populate("users", "-password")
      .populate("latestMessage")
      .sort({
        updatedAt: -1,
      });
    const results = await User.populate(chats, {
      path: "latestMessage.sender",
      select: "name pic email",
    });
    res.status(200).send(results);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const createGroupChat = expressAsyncHandler(async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: "Please fill all fields" });
  }

  const users = req.body.users;

  if (users.length < 2) {
    return res.status(400).send("More than 2 users are required");
  }
  users.push(req.user._id.toString());

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400);
    throw new Error("Failed to create group chat");
  }
});

const renameGroup = expressAsyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  const renamedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      chatName,
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!renamedChat) {
    res.status(404);
    throw new Error("Chat not found");
  } else {
    res.json(renamedChat);
  }
});

const addToGroup = expressAsyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const added = await Chat.findByIdAndUpdate(
    chatId,
    {
      $push: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!added) {
    res.status(404);
    throw new Error("Chat not found");
  } else {
    res.json(added);
  }
});

const removeFromGroup = expressAsyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const removedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!removedChat) {
    res.status(404);
    throw new Error("Chat not found");
  } else {
    res.json(removedChat);
  }
});

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};
