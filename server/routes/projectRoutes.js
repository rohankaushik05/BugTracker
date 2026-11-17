const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
} = require("../controllers/projectController");

router.use(protect);

router.post("/", createProject);
router.get("/", getProjects);
router.get("/:id", getProjectById);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

router.post("/:id/members", addProjectMember);
router.delete("/:id/members/:userId", removeProjectMember);

module.exports = router;