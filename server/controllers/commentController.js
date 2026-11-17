const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const Issue = require("../models/Issue");
const Project = require("../models/Project");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const getAccessibleIssue = async (issueId, userId) => {
  if (!isValidId(issueId)) return null;

  const issue = await Issue.findById(issueId);

  if (!issue) return null;

  const project = await Project.findById(issue.project);

  if (!project) return null;

  const isMember = project.members.some(
    (memberId) => memberId.toString() === userId.toString()
  );

  return isMember ? issue : false;
};

// Add a comment
const addComment = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const issue = await getAccessibleIssue(issueId, req.user.id);

    if (issue === null) {
      return res.status(404).json({ message: "Issue not found" });
    }

    if (issue === false) {
      return res.status(403).json({ message: "Access denied" });
    }

    const comment = await Comment.create({
      issue: issueId,
      author: req.user.id,
      text: text.trim(),
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      "author",
      "name email"
    );

    return res.status(201).json({
      message: "Comment added successfully",
      comment: populatedComment,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get comments for an issue
const getComments = async (req, res) => {
  try {
    const { issueId } = req.params;

    const issue = await getAccessibleIssue(issueId, req.user.id);

    if (issue === null) {
      return res.status(404).json({ message: "Issue not found" });
    }

    if (issue === false) {
      return res.status(403).json({ message: "Access denied" });
    }

    const comments = await Comment.find({ issue: issueId })
      .populate("author", "name email")
      .sort({ createdAt: 1 });

    return res.status(200).json({ comments });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { addComment, getComments };