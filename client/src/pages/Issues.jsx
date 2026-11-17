import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

const initialForm = {
  title: "",
  description: "",
  type: "Bug",
  priority: "Medium",
  status: "To Do",
  assignee: "",
};

function Issues() {
  const [comments, setComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedIssue, setExpandedIssue] = useState(null);
  const [commentLoading, setCommentLoading] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterAssignee, setFilterAssignee] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [issues, setIssues] = useState([]);

  const [formData, setFormData] = useState(initialForm);
  const [editingIssueId, setEditingIssueId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedProject = projects.find(
    (project) => project._id === selectedProjectId,
  );

  const fetchIssues = useCallback(async () => {
    if (!selectedProjectId) {
      setIssues([]);
      return;
    }

    try {
      const response = await api.get(
        `/api/issues?projectId=${selectedProjectId}`,
      );
      setIssues(response.data.issues);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load issues");
    }
  }, [selectedProjectId]);

  // Load projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get("/api/projects");
        setProjects(response.data.projects);

        if (response.data.projects.length > 0) {
          setSelectedProjectId(response.data.projects[0]._id);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load projects");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Load issues whenever the selected project changes
  // Load issues whenever the selected project changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchIssues();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [fetchIssues]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingIssueId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProjectId) {
      setError("Please select a project first");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        ...formData,
        projectId: selectedProjectId,
        assignee: formData.assignee || null,
      };

      if (editingIssueId) {
        await api.put(`/api/issues/${editingIssueId}`, payload);
        setMessage("Issue updated successfully");
      } else {
        await api.post("/api/issues", payload);
        setMessage("Issue created successfully");
      }

      resetForm();
      await fetchIssues();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save issue");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (issue) => {
    setEditingIssueId(issue._id);

    setFormData({
      title: issue.title || "",
      description: issue.description || "",
      type: issue.type || "Bug",
      priority: issue.priority || "Medium",
      status: issue.status || "To Do",
      assignee: issue.assignee?._id || "",
    });

    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (issueId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this issue?",
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await api.delete(`/api/issues/${issueId}`);

      setMessage("Issue deleted successfully");
      if (editingIssueId === issueId) resetForm();

      await fetchIssues();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete issue");
    }
  };
  const fetchComments = async (issueId) => {
    try {
      setCommentLoading(issueId);

      const response = await api.get(`/api/comments/${issueId}`);

      setComments((current) => ({
        ...current,
        [issueId]: response.data.comments,
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load comments");
    } finally {
      setCommentLoading(null);
    }
  };

  const toggleComments = async (issueId) => {
    if (expandedIssue === issueId) {
      setExpandedIssue(null);
      return;
    }

    setExpandedIssue(issueId);

    if (!comments[issueId]) {
      await fetchComments(issueId);
    }
  };

  const handleCommentSubmit = async (e, issueId) => {
    e.preventDefault();

    const text = commentInputs[issueId]?.trim();

    if (!text) return;

    try {
      setCommentLoading(issueId);
      setError("");

      const response = await api.post(`/api/comments/${issueId}`, { text });

      setComments((current) => ({
        ...current,
        [issueId]: [...(current[issueId] || []), response.data.comment],
      }));

      setCommentInputs((current) => ({
        ...current,
        [issueId]: "",
      }));

      setMessage("Comment added successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add comment");
    } finally {
      setCommentLoading(null);
    }
  };

  const filteredIssues = [...issues]
    .filter((issue) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        issue.title.toLowerCase().includes(search) ||
        issue.description.toLowerCase().includes(search);

      const matchesStatus =
        filterStatus === "All" || issue.status === filterStatus;

      const matchesPriority =
        filterPriority === "All" || issue.priority === filterPriority;

      const matchesAssignee =
        filterAssignee === "All" ||
        (filterAssignee === "Unassigned"
          ? !issue.assignee
          : issue.assignee?._id === filterAssignee);

      return (
        matchesSearch && matchesStatus && matchesPriority && matchesAssignee
      );
    })
    .sort((a, b) =>
      sortOrder === "newest"
        ? new Date(b.createdAt) - new Date(a.createdAt)
        : new Date(a.createdAt) - new Date(b.createdAt),
    );

  if (loading) {
    return <p className="p-6 text-gray-600">Loading projects...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Issue Management
            </h1>
            <p className="mt-1 text-gray-600">
              Create, assign, and manage project issues.
            </p>
          </div>

          <a
            href="/projects"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Manage Projects
          </a>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-lg bg-green-100 p-3 text-green-700">
            {message}
          </div>
        )}

        {projects.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="mb-4 text-gray-600">
              You don't have any projects yet. Create a project before adding
              issues.
            </p>
            <a
              href="/projects"
              className="font-medium text-blue-600 hover:underline"
            >
              Go to Projects
            </a>
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
              <label className="mb-2 block font-medium text-gray-700">
                Select Project
              </label>

              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  resetForm();
                  setError("");
                  setMessage("");
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 sm:max-w-md"
              >
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-semibold text-gray-800">
                {editingIssueId ? "Edit Issue" : "Create New Issue"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="Enter issue title"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Describe the issue..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Type
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    >
                      <option value="Bug">Bug</option>
                      <option value="Feature Request">Feature Request</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Assign To
                    </label>
                    <select
                      name="assignee"
                      value={formData.assignee}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    >
                      <option value="">Unassigned</option>
                      {selectedProject?.members?.map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.name} ({member.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {saving
                      ? "Saving..."
                      : editingIssueId
                        ? "Update Issue"
                        : "Create Issue"}
                  </button>

                  {editingIssueId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-gray-800">
                  Project Issues
                </h2>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                  {issues.length} Issues
                </span>
              </div>
              <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search issues..."
                  className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                />

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="All">All Statuses</option>
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>

                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="All">All Priorities</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>

                <select
                  value={filterAssignee}
                  onChange={(e) => setFilterAssignee(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="All">All Assignees</option>
                  <option value="Unassigned">Unassigned</option>

                  {selectedProject?.members?.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name}
                    </option>
                  ))}
                </select>

                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("All");
                    setFilterPriority("All");
                    setFilterAssignee("All");
                    setSortOrder("newest");
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Clear Filters
                </button>
              </div>

              {filteredIssues.length === 0 ? (
                <p className="py-8 text-center text-gray-500">
                  No issues found for this project. Create your first issue
                  above.
                </p>
              ) : (
                <div className="space-y-4">
                  {filteredIssues.map((issue) => (
                    <div
                      key={issue._id}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="break-words text-lg font-semibold text-gray-800">
                            {issue.title}
                          </h3>

                          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                            {issue.description || "No description provided."}
                          </p>
                          <p className="text-sm text-gray-500">
                            Reported by: {issue.reporter?.name || "Unknown"}
                          </p>
                          <div className="mt-4 border-t border-gray-100 pt-3">
                            <button
                              type="button"
                              onClick={() => toggleComments(issue._id)}
                              className="text-sm font-medium text-blue-600 hover:underline"
                            >
                              {expandedIssue === issue._id
                                ? "Hide Comments"
                                : "View Comments"}
                            </button>

                            {expandedIssue === issue._id && (
                              <div className="mt-3 space-y-3">
                                {commentLoading === issue._id ? (
                                  <p className="text-sm text-gray-500">
                                    Loading comments...
                                  </p>
                                ) : (
                                  <>
                                    {(comments[issue._id] || []).length ===
                                    0 ? (
                                      <p className="text-sm text-gray-500">
                                        No comments yet.
                                      </p>
                                    ) : (
                                      comments[issue._id].map((comment) => (
                                        <div
                                          key={comment._id}
                                          className="rounded-lg bg-gray-50 p-3"
                                        >
                                          <p className="text-sm font-semibold text-gray-800">
                                            {comment.author?.name || "Unknown"}
                                          </p>

                                          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                                            {comment.text}
                                          </p>

                                          <p className="mt-1 text-xs text-gray-400">
                                            {new Date(
                                              comment.createdAt,
                                            ).toLocaleString()}
                                          </p>
                                        </div>
                                      ))
                                    )}

                                    <form
                                      onSubmit={(e) =>
                                        handleCommentSubmit(e, issue._id)
                                      }
                                      className="flex flex-col gap-2 sm:flex-row"
                                    >
                                      <input
                                        type="text"
                                        value={commentInputs[issue._id] || ""}
                                        onChange={(e) =>
                                          setCommentInputs((current) => ({
                                            ...current,
                                            [issue._id]: e.target.value,
                                          }))
                                        }
                                        placeholder="Write a comment..."
                                        className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                      />

                                      <button
                                        type="submit"
                                        disabled={
                                          !commentInputs[issue._id]?.trim() ||
                                          commentLoading === issue._id
                                        }
                                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                      >
                                        Add Comment
                                      </button>
                                    </form>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full bg-purple-100 px-3 py-1 text-purple-700">
                              {issue.type}
                            </span>
                            <span className="rounded-full bg-orange-100 px-3 py-1 text-orange-700">
                              {issue.priority}
                            </span>
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
                              {issue.status}
                            </span>
                          </div>

                          <p className="mt-3 text-sm text-gray-500">
                            Assigned to: {issue.assignee?.name || "Unassigned"}
                          </p>
                          <p className="text-sm text-gray-500">
                            Reported by: {issue.reporter?.name || "Unknown"}
                          </p>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(issue)}
                            className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(issue._id)}
                            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Issues;
