const express = require("express");
const protect = require("../middleware/auth");
const {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
} = require("../controllers/chatsController");
const router = express.Router();

router.route("/").post(protect, accessChat);
router.route("/").get(protect, fetchChats);
router.route("/group").post(protect, createGroupChat);
router.route("/rename").put(protect, renameGroup);
router.route("/add-to-group").put(protect, addToGroup);
router.route("/remove-from-group").put(protect, removeFromGroup);

module.exports = router;
