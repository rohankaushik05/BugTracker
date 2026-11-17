const mongoose = require("mongoose");
const Issue = require("../models/Issue");
const Project = require("../models/Project");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const isProjectMember = (project, userId) => {
  return project.members.some(
    (memberId) => memberId.toString() === userId.toString()
  );
};

const validateAssignee = (project, assigneeId) => {
  if (!assigneeId) return true;

  return isValidId(assigneeId) && isProjectMember(project, assigneeId);
};

// Create an issue
const createIssue = async (req, res) => {
  try {
    const { projectId, title, description, type, priority, assignee } = req.body;

    if (!projectId || !isValidId(projectId)) {
      return res.status(400).json({ message: "Valid project ID is required" });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Issue title is required" });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!isProjectMember(project, req.user.id)) {
      return res.status(403).json({ message: "You are not a project member" });
    }

    if (!validateAssignee(project, assignee)) {
      return res.status(400).json({
        message: "Assignee must be a member of this project",
      });
    }

    const issue = await Issue.create({
      project: projectId,
      title: title.trim(),
      description,
      type,
      priority,
      assignee: assignee || null,
      reporter: req.user.id,
    });

    const populatedIssue = await Issue.findById(issue._id)
      .populate("assignee", "name email")
      .populate("reporter", "name email");

    return res.status(201).json({
      message: "Issue created successfully",
      issue: populatedIssue,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get all issues for a project
const getProjectIssues = async (req, res) => {
  try {
    const { projectId } = req.query;

    if (!projectId || !isValidId(projectId)) {
      return res.status(400).json({ message: "Valid project ID is required" });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!isProjectMember(project, req.user.id)) {
      return res.status(403).json({ message: "You are not a project member" });
    }

    const issues = await Issue.find({ project: projectId })
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ issues });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get a single issue
const getIssueById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid issue ID" });
    }

    const issue = await Issue.findById(id)
      .populate("assignee", "name email")
      .populate("reporter", "name email");

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const project = await Project.findById(issue.project);

    if (!project || !isProjectMember(project, req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json({ issue });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Update an issue
const updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, priority, status, assignee } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid issue ID" });
    }

    const issue = await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const project = await Project.findById(issue.project);

    if (!project || !isProjectMember(project, req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (assignee !== undefined && !validateAssignee(project, assignee)) {
      return res.status(400).json({
        message: "Assignee must be a member of this project",
      });
    }

    if (title !== undefined) issue.title = title;
    if (description !== undefined) issue.description = description;
    if (type !== undefined) issue.type = type;
    if (priority !== undefined) issue.priority = priority;
    if (status !== undefined) issue.status = status;
    if (assignee !== undefined) issue.assignee = assignee || null;

    await issue.save();

    const updatedIssue = await Issue.findById(issue._id)
      .populate("assignee", "name email")
      .populate("reporter", "name email");

    return res.status(200).json({
      message: "Issue updated successfully",
      issue: updatedIssue,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: error.message });
  }
};

// Delete an issue
const deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid issue ID" });
    }

    const issue = await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const project = await Project.findById(issue.project);

    if (!project || !isProjectMember(project, req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    await issue.deleteOne();

    return res.status(200).json({ message: "Issue deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createIssue,
  getProjectIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
};