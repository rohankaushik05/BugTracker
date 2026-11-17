const Project = require("../models/Project");
const User = require("../models/User");

// Create Project
const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Project name is required",
      });
    }

    const project = await Project.create({
      name: name.trim(),
      description: description || "",
      owner: req.user.id,
      members: [req.user.id],
    });

    res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create project" });
  }
};

// Get All Projects of Logged-in User
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      members: req.user.id,
    })
      .populate("owner", "name email")
      .populate("members", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ projects });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch projects" });
  }
};

// Get Single Project
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      members: req.user.id,
    })
      .populate("owner", "name email")
      .populate("members", "name email");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({ project });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch project" });
  }
};

// Update Project
const updateProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({
        message: "Project name cannot be empty",
      });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or you are not the owner",
      });
    }

    if (name !== undefined) project.name = name.trim();
    if (description !== undefined) project.description = description;

    await project.save();

    res.status(200).json({
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update project" });
  }
};

// Delete Project
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or you are not the owner",
      });
    }

    res.status(200).json({
      message: "Project deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete project" });
  }
};

// Add Project Member
const addProjectMember = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Member email is required" });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or you are not the owner",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found. Ask them to register first.",
      });
    }

    if (project.members.some((member) => member.equals(user._id))) {
      return res.status(409).json({
        message: "User is already a project member",
      });
    }

    project.members.push(user._id);
    await project.save();

    res.status(200).json({
      message: "Member added successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to add member" });
  }
};

// Remove Project Member
const removeProjectMember = async (req, res) => {
  try {
    const { userId } = req.params;

    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or you are not the owner",
      });
    }

    if (userId === String(project.owner)) {
      return res.status(400).json({
        message: "Project owner cannot be removed",
      });
    }

    const memberExists = project.members.some((member) =>
      member.equals(userId)
    );

    if (!memberExists) {
      return res.status(404).json({
        message: "Project member not found",
      });
    }

    project.members = project.members.filter(
      (member) => !member.equals(userId)
    );

    await project.save();

    res.status(200).json({
      message: "Member removed successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove member" });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
};