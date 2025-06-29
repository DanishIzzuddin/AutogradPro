# 🧠 AutoGradPro  
### Automated Grading System for Computer Network Assignments (Static/OSPF)

AutoGradPro is a full-stack, web-based platform designed for automated and fair grading of computer network configuration assignments (such as `.zip` files from Packet Tracer/GNS3). The system includes:

- 🧪 A Python-based grading engine
- 🌐 A Node.js + Express backend
- 🎨 A modern React frontend
- 🗄️ A MySQL database for persistence

It is designed to help lecturers grade student submissions fairly and efficiently while giving students real-time feedback and downloadable reports.

---

## 🔧 Technologies Used

| Component        | Technology          |
|------------------|---------------------|
| Frontend         | React (JavaScript)  |
| Backend API      | Express.js (Node.js)|
| Grading Engine   | Python (3.9+)       |
| Database         | MySQL               |

---

## 👶 Beginner-Friendly Setup (Step-by-Step)

This guide assumes **you know nothing** about development. Just follow every step carefully and it will work.

---

## ✅ Prerequisites

Make sure you install the following on your computer:

- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/downloads/) (v3.9+)
- [MySQL Server](https://dev.mysql.com/downloads/installer/)
- [Git](https://git-scm.com/downloads)

---

## 🚀 How to Install & Run the Project

### 1. 📥 Clone the Project

```bash
git clone https://github.com/DanishIzzuddin/AutoGradPro.git
cd AutoGradPro
2. 🗃️ Setup the MySQL Database
Open MySQL Workbench or Terminal

Create a new database:

sql
Copy
Edit
CREATE DATABASE autograder;
USE autograder;
Import the provided schema (ask the author if you don’t have it)

3. ⚙️ Setup Backend (Express.js)
bash
Copy
Edit
cd backend
npm install
Create a .env file inside the backend folder:

ini
Copy
Edit
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=autograder
JWT_SECRET=your_super_secret_key
Start the backend server:

bash
Copy
Edit
node server.js
4. 🐍 Setup Python Grading Engine
bash
Copy
Edit
cd python-grader
pip install -r requirements.txt
Make sure you're using Python 3.9+ (python --version)

5. 🌐 Setup Frontend (React)
bash
Copy
Edit
cd frontend
npm install
Create a .env file in frontend:

ini
Copy
Edit
REACT_APP_API_BASE_URL=http://localhost:5000
Start the frontend:

bash
Copy
Edit
npm start
Open your browser and go to: http://localhost:3000

👥 Sample Users
👨‍🏫 Lecturer
graphql
Copy
Edit
Email: lecturer1@mmu.edu.my
Password: Lecturer@123
👨‍🎓 Student
graphql
Copy
Edit
Email: student1@mmu.edu.my
Password: Student@123
🧪 System Features
🔐 Secure JWT login (Student & Lecturer roles)

📤 Auto ZIP validation and upload

🐍 Python-based grading (Static or OSPF)

📄 PDF report generation (per-router feedback)

📊 Lecturer dashboard with analytics and submission stats

📥 Student dashboard with downloadable PDF feedback

🗄️ MySQL for storing users, submissions, assignments

🗂️ Project Folder Structure
lua
Copy
Edit
AutoGradPro/
├── backend/
│   ├── server.js
│   ├── config.js
│   ├── routes/
│   ├── auth/
│   └── db/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── App.jsx
│   ├── .env
│   └── package.json
├── python-grader/
│   ├── grader.py
│   ├── extractor/
│   ├── normalizer/
│   ├── topology.py
│   └── requirements.txt
🖼️ Recommended Screenshots to Include
✅ Student Submit Form

📊 Result and Feedback Page (with router scores)

📥 PDF Feedback Example

📈 Lecturer Dashboard (analytics and submissions)

🔐 Login Page (Student & Lecturer)

💬 Common Commands
Command	Purpose
npm install	Install Node dependencies
node server.js	Start Express backend
pip install -r requirements.txt	Install Python dependencies
npm start	Start React frontend

📌 Known Limitations
No real-time push notifications (manual refresh required)

No visual analysis of .pka simulation

No built-in logging system (currently console-based)

No file storage on cloud (local only)

📬 Support or Contribution
Open an issue or submit a pull request if you want to help improve AutoGradPro!

🙏 Thank You for Using AutoGradPro!
This system was developed as a Final Year Project (FYP) at MMU (Faculty of Computing and Informatics).

yaml
Copy
Edit

---

You can copy-paste this entire Markdown into your `README.md` file directly. Let me know if you want 
