# 🎉 Party Tracker — Full Stack Application

A fun office party scheduling app built with **Spring Boot**, **React**, and **Microsoft SQL Server**.

---

## 📦 Project Structure

```
party-tracker/
├── backend/          ← Spring Boot REST API
│   ├── pom.xml
│   └── src/
│       └── main/
│           ├── java/com/partytracker/
│           │   ├── entity/          ← JPA Entities (User, Cycle, PartyAssignment, Holiday)
│           │   ├── repository/      ← Spring Data JPA repos
│           │   ├── service/         ← Business logic
│           │   ├── controller/      ← REST endpoints
│           │   ├── dto/             ← Request/Response DTOs
│           │   └── config/          ← CORS + Exception handler
│           └── resources/
│               └── application.properties
└── frontend/         ← React App
    ├── package.json
    └── src/
        ├── api/         ← Axios API calls
        ├── components/  ← Navbar, SpinningWheel, Stars
        ├── context/     ← App state (auth, user session)
        ├── pages/       ← All pages
        ├── utils/       ← Confetti helpers
        ├── App.js
        └── index.css
```

---

## 🛠️ Prerequisites

- **Java 21+**
- **Maven 3.8+**
- **Node.js 18+**
- **Microsoft SQL Server** (local or Azure)
- **SQL Server Management Studio** (optional)

---

## ⚙️ Backend Setup

### 1. Create the Database

Run this in SQL Server:
```sql
CREATE DATABASE PartyTracker;
```

### 2. Configure Application Properties

Edit `backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=PartyTracker;encrypt=true;trustServerCertificate=true
spring.datasource.username=sa
spring.datasource.password=YourPassword123!

# Change this!
app.admin.password=admin123
```

### 3. Run the Backend

```bash
cd backend
mvn spring-boot:run
```

The API will start at `http://localhost:8080`

---

## 🎨 Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure API URL (optional)

By default the frontend proxies to `http://localhost:8080`.

To change it, set in `.env`:
```
REACT_APP_API_URL=http://your-server:8080/api
```

### 3. Run the Frontend

```bash
npm start
```

Frontend runs at `http://localhost:3000`

---

## 🎯 Features Overview

### 🏠 Home Page
- Shows **today's party host** with confetti explosions 🎊
- Users click their name to "log in" and see their schedule
- Admin login button in the top-right

### 📅 Calendar Page
- Full monthly calendar view
- **Drag & Drop** to reassign individual party days (admin only)
- **Drag All** button to shift everyone from a date onwards
- Color-coded: 🔴 upcoming, ✅ completed, 🟣 today, 🔵 holidays
- Admin can mark today's party as complete

### 👥 Manage Users (Admin)
- Add employees by name
- New employees are **automatically added to the end** of the current cycle
- Remove/deactivate employees

### 🏖️ Manage Holidays (Admin)
- Add holidays with a date and description
- Parties on holiday dates are **automatically shifted forward**
- Saturdays and Sundays are always skipped

### 🎯 New Cycle (Admin)
Three ways to allocate:

1. **🖱️ Drag & Drop** — Add users from a list, reorder by dragging
2. **🤖 Auto Allocate** — Click one button to randomly shuffle everyone
3. **🎰 Spinning Wheel** — Fun animated wheel to pick users one by one with confetti!

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/today` | Today's party host |
| `GET` | `/api/users` | All active users |
| `GET` | `/api/assignments` | Current cycle assignments |
| `GET` | `/api/holidays` | All holidays |
| `GET` | `/api/cycle/active` | Active cycle info |
| `POST` | `/api/admin/login` | Admin login |
| `POST` | `/api/admin/users` | Add user |
| `DELETE` | `/api/admin/users/{id}` | Remove user |
| `POST` | `/api/admin/holidays` | Add holiday |
| `DELETE` | `/api/admin/holidays/{id}` | Remove holiday |
| `POST` | `/api/admin/cycle/start` | Start new cycle |
| `PUT` | `/api/admin/assignments/reassign` | Reassign single party |
| `PUT` | `/api/admin/assignments/drag-all` | Bulk shift from date |
| `PUT` | `/api/admin/assignments/swap` | Swap two assignments |
| `PUT` | `/api/admin/assignments/{id}/complete` | Mark party done |

---

## 🗄️ Database Schema

Tables auto-created by Hibernate (`ddl-auto=update`):

- **users** — employee records
- **cycles** — each cycle (everyone throws once)
- **party_assignments** — who throws on which date
- **holidays** — non-working dates

---

## 🚀 Deployment Tips

- Build frontend: `npm run build` → serve with nginx or Spring Boot static resources
- Build backend: `mvn package` → run `java -jar target/party-tracker-1.0.0.jar`
- Change `app.admin.password` in production!
- Set `spring.jpa.hibernate.ddl-auto=none` in production and use migrations

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 3.2, Spring Data JPA |
| Database | Microsoft SQL Server |
| ORM | Hibernate |
| Frontend | React 18 |
| Routing | React Router v6 |
| Drag & Drop | @dnd-kit |
| Animations | CSS + canvas-confetti |
| Styling | Custom CSS (dark party theme) |
| HTTP Client | Axios |
| Notifications | react-hot-toast |
| Date Handling | date-fns |
