import { useEffect, useState } from "react";
import api from "../services/api";
import useAuth from "../context/useAuth";

function Projects() {
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [memberEmails, setMemberEmails] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    name: "",
    description: "",
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const response = await api.get("/api/projects");
      setProjects(response.data.projects);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects();
    }, 200); // 200ms delay to let auth state / token settle

    // Cleanup function to clear the timeout if the component unmounts
    return () => clearTimeout(timer);
  }, []);
  
  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await api.post("/api/projects", formData);

      setFormData({ name: "", description: "" });
      setMessage("Project created successfully");

      await fetchProjects();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to create project");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      await api.delete(`/api/projects/${id}`);
      setMessage("Project deleted successfully");
      await fetchProjects();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete project");
    }
  };

  const startEditing = (project) => {
    setEditingId(project._id);
    setEditData({
      name: project.name,
      description: project.description || "",
    });
  };

  const handleUpdate = async (id) => {
    try {
      await api.put(`/api/projects/${id}`, editData);

      setEditingId(null);
      setMessage("Project updated successfully");

      await fetchProjects();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to update project");
    }
  };

  const handleAddMember = async (projectId) => {
    const email = memberEmails[projectId];

    if (!email?.trim()) {
      setError("Please enter a member's email address");
      return;
    }

    try {
      await api.post(`/api/projects/${projectId}/members`, {
        email,
      });

      setMemberEmails((prev) => ({
        ...prev,
        [projectId]: "",
      }));

      setMessage("Member added successfully");
      await fetchProjects();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to add member");
    }
  };

  const handleRemoveMember = async (projectId, memberId) => {
    if (!window.confirm("Remove this member from the project?")) {
      return;
    }

    try {
      await api.delete(
        `/api/projects/${projectId}/members/${memberId}`
      );

      setMessage("Member removed successfully");
      await fetchProjects();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to remove member");
    }
  };

  const isOwner = (project) =>
    project.owner?._id === user?.id;

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            My Projects
          </h1>
          <p className="mt-2 text-gray-500">
            Create projects and manage your development teams.
          </p>
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

        {/* Create Project */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            Create New Project
          </h2>

          <form onSubmit={handleCreate} className="space-y-4">
            <input
              type="text"
              placeholder="Project Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                })
              }
              required
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
            />

            <textarea
              placeholder="Project Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value,
                })
              }
              rows="3"
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
            >
              Create Project
            </button>
          </form>
        </div>

        {/* Project List */}
        <h2 className="mb-4 text-xl font-semibold text-gray-800">
          Your Projects
        </h2>

        {loading ? (
          <p className="text-gray-500">Loading projects...</p>
        ) : projects.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center text-gray-500">
            No projects found. Create your first project above.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">

            {projects.map((project) => (
              <div
                key={project._id}
                className="rounded-xl bg-white p-6 shadow-sm"
              >
                {editingId === project._id ? (
                  <div className="space-y-3">
                    <input
                      value={editData.name}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          name: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border p-2"
                    />

                    <textarea
                      value={editData.description}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          description: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border p-2"
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(project._id)}
                        className="rounded bg-blue-600 px-4 py-2 text-white"
                      >
                        Save
                      </button>

                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded bg-gray-200 px-4 py-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-gray-800">
                      {project.name}
                    </h3>

                    <p className="mt-2 text-gray-500">
                      {project.description || "No description provided"}
                    </p>

                    <p className="mt-3 text-sm text-gray-500">
                      Owner: {project.owner?.name}
                    </p>

                    {isOwner(project) && (
                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={() => startEditing(project)}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(project._id)}
                          className="text-sm font-medium text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}

                <div className="mt-5 border-t pt-4">
                  <h4 className="mb-3 font-semibold text-gray-700">
                    Team Members ({project.members.length})
                  </h4>

                  <div className="space-y-2">
                    {project.members.map((member) => (
                      <div
                        key={member._id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-600">
                          {member.name} ({member.email})
                        </span>

                        {isOwner(project) &&
                          member._id !== project.owner?._id && (
                            <button
                              onClick={() =>
                                handleRemoveMember(
                                  project._id,
                                  member._id
                                )
                              }
                              className="text-red-500 hover:underline"
                            >
                              Remove
                            </button>
                          )}
                      </div>
                    ))}
                  </div>

                  {isOwner(project) && (
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <input
                        type="email"
                        placeholder="Existing user's email"
                        value={memberEmails[project._id] || ""}
                        onChange={(e) =>
                          setMemberEmails({
                            ...memberEmails,
                            [project._id]: e.target.value,
                          })
                        }
                        className="min-w-0 flex-1 rounded-lg border p-2 text-sm"
                      />

                      <button
                        onClick={() => handleAddMember(project._id)}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                      >
                        Add Member
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

          </div>
        )}
      </div>
    </div>
  );
}

export default Projects;