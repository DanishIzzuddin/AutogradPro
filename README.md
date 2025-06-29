AutoGradPro 🎓💻
Automated Grading System for Computer Network Assignments (Static/OSPF)

AutoGradPro is a full-stack, role-based web application that enables secure, automated, and fair grading of Packet Tracer (.pka) and configuration (.zip) assignments submitted by students. Designed for use in academic settings (e.g., computer networking courses), it combines a Python-based grading engine with a modern web frontend and backend.

📌 Features
🔐 Secure JWT-based login (Student & Lecturer roles)

📤 Auto ZIP validation and upload handling

🤖 Python-powered grading engine (Static & OSPF detection)

🧾 Auto-generated per-router feedback (PDF Report)

📊 Lecturer dashboard with submission and performance analytics

🧑‍🎓 Student dashboard to view feedback and scores

📁 Integrated with MySQL for persistence

📁 Project Structure
php
Copy
Edit
auto-grad-pro/
├── backend/                  # Express + JWT + MySQL
│   ├── server.js            # Entry point (run via node server.js)
│   ├── db.js                # MySQL connection config
│   ├── routes.js            # Student & lecturer routes
│   ├── auth.js              # JWT token issuance
│   ├── uploads/             # ZIPs, PKAs, and PDF reports
│   └── services/
│       └── graderService.js # Calls the Python script for grading

├── frontend/                 # React.js frontend
│   ├── public/
│   ├── src/
│   │   ├── api/             # Axios instance with token header
│   │   ├── components/      # NavBar, Buttons, etc.
│   │   ├── pages/           # Student & Lecturer Views
│   │   └── App.jsx          # Main router
│   └── package.json

├── python-grader/           # Python grading engine
│   ├── extractor/           # Unzips & loads config text
│   ├── normalizer/          # Cleans & formats configs
│   ├── grader/              # Scoring logic
│   └── grader.py            # Entrypoint called by backend
⚙️ Prerequisites
Node.js v18+

Python 3.9+

MySQL Server

Git & npm

🔧 Setup Instructions
1. Clone the Repository
bash
Copy
Edit
git clone https://github.com/your-username/auto-grad-pro.git
cd auto-grad-pro
2. Setup MySQL Database
Create a MySQL database (e.g. autograder)

Run your schema script to create the following tables:

users

subjects

teacher_subjects, student_subjects

assignments

submissions

router_results

Insert seed/test data (lecturers, students, assignments)

3. Backend Setup
bash
Copy
Edit
cd backend
npm install
Create a .env file:

ini
Copy
Edit
PORT=5000
JWT_SECRET=your_jwt_secret_here
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=autograder
Start the backend server:

bash
Copy
Edit
node server.js
This will launch the backend on http://localhost:5000.

4. Python Grader Setup
bash
Copy
Edit
cd python-grader
pip install -r requirements.txt
Make sure the following files/folders exist:

extractor/, normalizer/, grader/ (each with appropriate .py files)

grader.py should be the callable script with CLI args for zip paths and prefix.

5. Frontend Setup
bash
Copy
Edit
cd frontend
npm install
Create .env in /frontend:

ini
Copy
Edit
REACT_APP_API_BASE_URL=http://localhost:5000
Start the frontend:

bash
Copy
Edit
npm start
This will launch the React app on http://localhost:3000.

🧪 How to Use
👨‍🏫 Lecturer Flow
Login with lecturer credentials

Create assignment (upload PKA, master ZIPs, set due date)

View submissions per student

View class performance and feedback PDF

👩‍🎓 Student Flow
Login with student credentials

Browse subjects and assignments

Upload ZIPs + PKA (if OSPF)

Instantly receive router-level feedback and downloadable PDF


📚 Technologies Used
Layer	Stack
Frontend	React, Chart.js, Axios
Backend	Express.js, MySQL, Multer
Auth	JWT, bcrypt
Grading	Python 3.9, zipfile, ipaddress, regex
Reports	PDFKit (for styled grading reports)

🧩 Known Limitations
No real-time notifications (email or UI)

No file preview before submission

No audit trail (logging module in future)

File uploads only accepted via ZIPs

📜 License
MIT License © 2025 AutoGradPro Team
