🧠 DevSphere – Backend

The Devsphere Backend is a Node.js + Express + MongoDB server that powers user authentication, team management, project collaboration, messaging, and notifications.

🚀 Features

User Authentication – JWT-based login/signup.

Team Management – Create teams, add/remove members, assign roles.

Project Management –

Create, update, delete projects.

Assign teams to projects.

Fetch projects by user or by team.

Messaging & Notifications – Real-time updates through Socket.IO.

Protected Routes – Middleware enforces JWT validation.

🧩 Tech Stack
Layer	Tools
Server	Node.js, Express
Database	MongoDB, Mongoose
Authentication	JWT
Realtime	Socket.IO
Environment	dotenv, cors
⚙️ Installation & Setup
1. Clone the repository
git clone https://github.com/Arshadsahabdeen/DevSphereProject.git
cd devsphere/backend

2. Install dependencies
npm install

3. Create a .env file in /backend
PORT=5000
MONGO_URI=mongodb+srv://arshadsahabdeen05_db_user:kILDevdRckGlFF9l@devsphere.x5nn2eg.mongodb.net/devsphere
JWT_SECRET=your_jwt_secret_key
CLIENT_ORIGIN=http://localhost:3000

4. Start the server
npm run dev


Your backend runs at http://localhost:5000

🧠 Folder Structure
backend/
│
├── config/
│   └── db.js
│
├── controllers/
│   ├── userController.js
│   ├── teamController.js
│   ├── projectController.js
│   ├── messageController.js
│   └── notificationController.js
│
├── middleware/
│   └── authMiddleware.js
│
├── models/
│   ├── User.js
│   ├── Team.js
│   ├── Project.js
│   ├── Message.js
│   └── Notification.js
│
├── routes/
│   ├── userRoutes.js
│   ├── teamRoutes.js
│   ├── projectRoutes.js
│   ├── messageRoutes.js
│   ├── notificationRoutes.js
│   └── debugRoutes.js
│
├── server.js
└── package.json

🔐 Authentication Flow

Signup / Login

POST /api/users/register

POST /api/users/login

Copy the JWT token returned on login.

Use the token in all protected routes:

Authorization: Bearer <your_token_here>

📂 API Endpoints Overview
👤 Users
Method	Route	Description
POST	/api/users/register	Register a new user
POST	/api/users/login	Login and receive token
GET	/api/debug/whoami	Verify logged-in user
👥 Teams
Method	Route	Description
POST	/api/teams	Create a team
GET	/api/teams/my	Get teams current user belongs to
GET	/api/teams/:teamId	Get single team details
PUT	/api/teams/:teamId	Update team (owner/admin only)
DELETE	/api/teams/:teamId	Delete team (owner only)
POST	/api/teams/:teamId/members	Add member by email
DELETE	/api/teams/:teamId/members/:memberId	Remove member
🧩 Projects
Method	Route	Description
POST	/api/projects	Create project (without team)
POST	/api/projects/team/:teamId	Create project under team
GET	/api/projects/mine	Get projects created by logged-in user
GET	/api/projects/team/:teamId	Get all projects under a team
GET	/api/projects/:projectId	Get single project by ID
PUT	/api/projects/:projectId	Update project (owner only)
DELETE	/api/projects/:projectId	Delete project (owner only)
POST	/api/projects/:projectId/assign-team	Assign team to project
POST	/api/projects/:projectId/remove-team	Remove team from project
POST	/api/projects/:projectId/link	Link repository to project
💬 Messages & Notifications

These routes handle real-time communication through Socket.IO, allowing messages and notifications to sync instantly between users.

🧠 Socket.IO Events
Event	Direction	Description
connect	Client ↔ Server	Establish connection
joinRoom	Client → Server	Join a room (team or project)
leaveRoom	Client → Server	Leave a room
sendMessage	Client → Server	Send a chat message
message	Server → Client	Receive new message
message:sent	Server → Client	Acknowledgment of sent message
🧾 Example Environment (dev)
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/devsphere
JWT_SECRET=mydevsecret
CLIENT_ORIGIN=http://localhost:3000

✅ Testing in Postman

Set baseUrl = http://localhost:5000

Add global variable token after login:

Authorization: Bearer {{token}}


Example:

GET {{baseUrl}}/api/projects/mine

☁️ Deployment

Render / Railway / Vercel for backend

MongoDB Atlas for cloud database

Update your .env with the new Mongo URI and allowed origin.

🧑‍💻 Author

Arshad Sahabdeen
Devsphere Backend — 2025
