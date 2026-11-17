import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import useAuth from "../context/useAuth";

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const projectResponse = await api.get("/api/projects");
      const projectList = projectResponse.data.projects || [];

      setProjects(projectList);

      const issueResponses = await Promise.all(
        projectList.map((project) =>
          api.get(`/api/issues?projectId=${project._id}`)
        )
      );

      const allIssues = issueResponses.flatMap(
        (response) => response.data.issues || []
      );

      setIssues(allIssues);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  }, []);

useEffect(() => {
    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 200); // 200ms delay to stabilize state and prevent synchronous setState warnings

    // Cleanup function to clear the timeout if the component unmounts or re-runs
    return () => clearTimeout(timer);
  }, [fetchDashboardData]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const todoCount = issues.filter(
    (issue) => issue.status === "To Do"
  ).length;

  const inProgressCount = issues.filter(
    (issue) => issue.status === "In Progress"
  ).length;

  const doneCount = issues.filter(
    (issue) => issue.status === "Done"
  ).length;

  const criticalCount = issues.filter(
    (issue) => issue.priority === "Critical"
  ).length;

  const statistics = [
    {
      title: "Total Projects",
      value: projects.length,
      color: "bg-blue-50 text-blue-700",
    },
    {
      title: "Total Issues",
      value: issues.length,
      color: "bg-purple-50 text-purple-700",
    },
    {
      title: "In Progress",
      value: inProgressCount,
      color: "bg-yellow-50 text-yellow-700",
    },
    {
      title: "Completed",
      value: doneCount,
      color: "bg-green-50 text-green-700",
    },
    {
      title: "To Do",
      value: todoCount,
      color: "bg-gray-100 text-gray-700",
    },
    {
      title: "Critical Issues",
      value: criticalCount,
      color: "bg-red-50 text-red-700",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-gray-600">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <h1 className="text-2xl font-bold text-blue-700">
            BugTracker
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/projects"
              className="text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Projects
            </Link>

            <Link
              to="/issues"
              className="text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Issues
            </Link>

            <Link
              to="/board"
              className="text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Kanban Board
            </Link>

            <button
              onClick={handleLogout}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            Welcome, {user?.name || "User"}!
          </h2>
          <p className="mt-2 text-gray-600">
            Here's an overview of your projects and issues.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 p-3 text-red-700">
            {error}
            <button
              onClick={fetchDashboardData}
              className="ml-3 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        <section className="mb-10">
          <h3 className="mb-4 text-xl font-semibold text-gray-800">
            Overview
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {statistics.map((item) => (
              <div
                key={item.title}
                className="rounded-xl bg-white p-5 shadow-sm"
              >
                <p className="text-sm text-gray-500">{item.title}</p>
                <p
                  className={`mt-3 inline-flex rounded-lg px-4 py-2 text-2xl font-bold ${item.color}`}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-semibold text-gray-800">
              Your Projects
            </h3>

            <Link
              to="/projects"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Manage Projects
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-gray-500 shadow-sm">
              No projects available. Create your first project.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => {
                const projectIssues = issues.filter(
                  (issue) =>
                    issue.project === project._id ||
                    issue.project?._id === project._id
                );

                return (
                  <div
                    key={project._id}
                    className="rounded-xl bg-white p-5 shadow-sm"
                  >
                    <h4 className="text-lg font-semibold text-gray-800">
                      {project.name}
                    </h4>

                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                      {project.description || "No description available."}
                    </p>

                    <div className="mt-4 flex justify-between border-t pt-3 text-sm text-gray-500">
                      <span>
                        {project.members?.length || 0} Members
                      </span>
                      <span>{projectIssues.length} Issues</span>
                    </div>

                    <Link
                      to="/issues"
                      className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
                    >
                      View Issues
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-800">
              Recent Issues
            </h3>

            <Link
              to="/issues"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              View All
            </Link>
          </div>

          {issues.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-gray-500 shadow-sm">
              No issues have been created yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-5 py-3">Issue</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Priority</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Assignee</th>
                  </tr>
                </thead>

                <tbody>
                  {[...issues]
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt) - new Date(a.createdAt)
                    )
                    .slice(0, 5)
                    .map((issue) => (
                      <tr key={issue._id} className="border-b last:border-0">
                        <td className="px-5 py-4 font-medium text-gray-800">
                          {issue.title}
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {issue.type}
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {issue.priority}
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {issue.status}
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {issue.assignee?.name || "Unassigned"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;