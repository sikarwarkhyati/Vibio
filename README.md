# 🎉 Vibio — Event Discovery & Management Platform

Vibio is a full-stack web application built to help users **discover, organize, and manage events** — cultural, technical, and sports — all in one place.  
It features role-based dashboards for **Users**, **Organizers**, and **Admins**, providing seamless event creation, registration, and management experiences.

---

## 🚀 Tech Stack

**Frontend**
- React (Vite + TypeScript)
- Tailwind CSS
- shadcn/ui Components
- React Router DOM
- Context API for Auth & Global State

**Backend**
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- Multer for file uploads
- dotenv for environment configuration

---

## 🧩 Features

### 👤 User
- Sign up & log in with secure JWT auth  
- Browse and filter events by category or date  
- Register for events & manage bookings  

### 🏢 Organizer
- Create, update, and manage hosted events  
- Upload banners, descriptions, and categories  
- View registered participants  

### 🛡️ Admin
- Access dashboard analytics  
- Manage users & events  
- Approve or remove events  

---

## ⚙️ Setup Instructions

1️⃣ Clone the Repository
```bash
git clone https://github.com/PoisenPrince/Vibio.git
cd Vibio


2️⃣ Install Dependencies
Frontend
cd src/frontend
npm install

Backend
cd ../backend
npm install

3️⃣ Environment Variables

Create a .env file inside /src/backend with:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key

4️⃣ Run the Application
Run Backend:
npm run dev

Run Frontend (in another terminal):
npm run dev


Frontend runs at: http://localhost:8000

Backend runs at: http://localhost:5000

🧠 Folder Structure (Simplified)
Vibio/
│
├── src/
│   ├── backend/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── server.ts
│   │   └── .env
│   │
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── context/
│   │   │   ├── hooks/
│   │   │   ├── pages/
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   └── public/
│   │
│   └── shared/
│       └── types/
│
├── .gitignore
└── README.md

🧑‍🤝‍🧑 Contributing

If you’re collaborating:

Fork the repository

Create a feature branch (git checkout -b feature-name)

Commit changes (git commit -m "Added new feature")

Push to your branch (git push origin feature-name)

Open a Pull Request 🚀

📜 License

This project is licensed under the MIT License — free to use and modify with attribution.

✨ Author

Yatharth Jain (PoisenPrince)
Khyati Sikarwar(sikarwarkhyati)