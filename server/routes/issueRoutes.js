const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createIssue,
  getProjectIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
} = require("../controllers/issueController");

router.use(protect);

router.post("/", createIssue);
router.get("/", getProjectIssues);
router.get("/:id", getIssueById);
router.put("/:id", updateIssue);
router.delete("/:id", deleteIssue);

module.exports = router;