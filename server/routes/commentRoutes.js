const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const {
  addComment,
  getComments,
} = require("../controllers/commentController");

router.use(protect);

router.post("/:issueId", addComment);
router.get("/:issueId", getComments);

module.exports = router;