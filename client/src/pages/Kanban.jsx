import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

const columns = ["To Do", "In Progress", "Done"];

const statusStyles = {
  "To Do": "border-t-gray-400",
  "In Progress": "border-t-blue-500",
  Done: "border-t-green-500",
};

const priorityStyles = {
  Low: "bg-gray-100 text-gray-700",
  Medium: "bg-yellow-100 text-yellow-700",
  High: "bg-orange-100 text-orange-700",
  Critical: "bg-red-100 text-red-700",
};

function Kanban() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [issues, setIssues] = useState([]);
  const [draggedIssueId, setDraggedIssueId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchIssues = useCallback(async () => {
    if (!selectedProjectId) {
      setIssues([]);
      return;
    }

    try {
      const response = await api.get(
        `/api/issues?projectId=${selectedProjectId}`
      );
      setIssues(response.data.issues);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load issues");
    }
  }, [selectedProjectId]);

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

// Load issues with a small timer delay to stabilize state and prevent synchronous setState warnings
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchIssues();
    }, 200); // 200ms delay

    // Cleanup function to clear the timeout if the component unmounts or re-runs
    return () => clearTimeout(timer);
  }, [fetchIssues]);

  const handleDragStart = (issueId) => {
    setDraggedIssueId(issueId);
  };

  const handleDrop = async (newStatus) => {
    if (!draggedIssueId || updating) return;

    const issue = issues.find((item) => item._id === draggedIssueId);

    setDraggedIssueId(null);

    if (!issue || issue.status === newStatus) return;

    const previousIssues = [...issues];

    // Update the board immediately for a smoother experience.
    setIssues((currentIssues) =>
      currentIssues.map((item) =>
        item._id === issue._id ? { ...item, status: newStatus } : item
      )
    );

    try {
      setUpdating(true);
      setError("");
      setMessage("");

      await api.put(`/api/issues/${issue._id}`, {
        status: newStatus,
      });

      setMessage(`Issue moved to ${newStatus}`);
    } catch (err) {
      setIssues(previousIssues);
      setError(err.response?.data?.message || "Failed to update issue status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-gray-600">Loading board...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Kanban Board</h1>
            <p className="mt-1 text-gray-600">
              Drag issues between columns to update their status.
            </p>
          </div>

          <a
            href="/issues"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Manage Issues
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
            <p className="text-gray-600">
              Create a project before using the Kanban board.
            </p>
            <a
              href="/projects"
              className="mt-3 inline-block font-medium text-blue-600 hover:underline"
            >
              Manage Projects
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
                  setError("");
                  setMessage("");
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 sm:max-w-md"
              >
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid items-start gap-5 md:grid-cols-3">
              {columns.map((column) => {
                const columnIssues = issues.filter(
                  (issue) => issue.status === column
                );

                return (
                  <section
                    key={column}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(column)}
                    className={`min-h-80 rounded-xl border-t-4 bg-gray-100 p-4 ${statusStyles[column]}`}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="font-semibold text-gray-800">
                        {column}
                      </h2>
                      <span className="rounded-full bg-white px-3 py-1 text-sm text-gray-600">
                        {columnIssues.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {columnIssues.map((issue) => (
                        <article
                          key={issue._id}
                          draggable={!updating}
                          onDragStart={() => handleDragStart(issue._id)}
                          onDragEnd={() => setDraggedIssueId(null)}
                          className={`cursor-grab rounded-lg border border-gray-200 bg-white p-4 shadow-sm active:cursor-grabbing ${
                            draggedIssueId === issue._id ? "opacity-40" : ""
                          }`}
                        >
                          <div className="mb-2 flex flex-wrap gap-2">
                            <span className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-700">
                              {issue.type}
                            </span>
                            <span
                              className={`rounded-full px-2 py-1 text-xs ${
                                priorityStyles[issue.priority] ||
                                "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {issue.priority}
                            </span>
                          </div>

                          <h3 className="break-words font-semibold text-gray-800">
                            {issue.title}
                          </h3>

                          <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                            {issue.description || "No description"}
                          </p>

                          <div className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
                            <p>
                              Assignee: {issue.assignee?.name || "Unassigned"}
                            </p>
                            <p className="mt-1">
                              Reporter: {issue.reporter?.name || "Unknown"}
                            </p>
                          </div>
                        </article>
                      ))}

                      {columnIssues.length === 0 && (
                        <p className="rounded-lg border border-dashed border-gray-300 p-5 text-center text-sm text-gray-500">
                          Drop issues here
                        </p>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>

            {updating && (
              <p className="mt-4 text-sm text-gray-500">
                Updating issue status...
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Kanban;