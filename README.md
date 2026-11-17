# Bug Tracker

Bug Tracker is a web application I developed to manage projects and track bugs and feature requests in a team. It provides a central place to create issues, assign them to team members, monitor their progress, and communicate through comments.

The application follows a Kanban-based workflow, allowing issues to move through three stages: To Do, In Progress, and Done.

## Features

- **User Authentication:** Register and log in securely using password hashing and JWT authentication.
- **Project Management:** Create, view, update, and delete projects.
- **Team Management:** Add existing registered users to a project and remove members when needed.
- **Issue Tracking:** Create, edit, and delete bug reports and feature requests.
- **Issue Assignment:** Assign issues to members of the corresponding project.
- **Kanban Board:** View issues by status and move them between columns using drag and drop.
- **Comments:** Add comments to issues and view previous discussions.
- **Search and Filters:** Search issues by keyword and filter them by status, priority, and assignee.
- **Sorting:** Sort issues by creation date.
- **Dashboard:** View project information and issue statistics in one place.

## Technology Stack

**Frontend**
- React.js
- Tailwind CSS
- React Router
- Axios
- Vite

**Backend**
- Node.js
- Express.js
- REST API

**Database and Authentication**
- MongoDB
- Mongoose
- JSON Web Token (JWT)
- bcryptjs

## Project Structure

```text
BugTracker/
│
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── services/
│       ├── App.jsx
│       └── index.css
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── server.js
│
└── .gitignore
```

## Getting Started

The project has separate frontend and backend applications.

### Prerequisites

- Node.js and npm
- MongoDB database
- Git

### Installation

Clone the repository:

```bash
git clone https://github.com/rohankaushik05/BugTracker.git
cd BugTracker
```

Install the backend dependencies:

```bash
cd server
npm install
```

Install the frontend dependencies:

```bash
cd ../client
npm install
```

### Environment Configuration

The application uses environment variables for database connectivity, authentication, and frontend API configuration.

**Backend (`server/.env`)**

| Variable | Purpose |
|---|---|
| `PORT` | Server port |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used for signing and verifying authentication tokens |

**Frontend (`client/.env`)**

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend API base URL |

Keep environment files private and do not commit them to the repository.

### Running the Application

Start the backend from the `server` directory:

```bash
npm run dev
```

Start the frontend from the `client` directory:

```bash
npm run dev
```

The frontend and backend run as separate applications.

## How It Works

After registering and logging in, a user can create a project and add other registered users as members. Issues can then be created within that project, with details such as type, priority, description, and assignee.

The Kanban board provides a visual overview of issue progress. Team members can update issue statuses, add comments, and use the available search and filtering options to find specific issues.

Access to project-related information is restricted to users who belong to the respective project.

## Conclusion

Building Bug Tracker helped me work with a complete MERN application, from designing database models and developing REST APIs to integrating authentication and building an interactive React interface.

The project also gave me practical experience with project workflows, issue assignment, Kanban-based tracking, and managing data across related collections.