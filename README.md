# Event Management System (EMS) 📅

The **Event Management System (EMS)** is a comprehensive platform designed to streamline event organization. It enables organizers to create and monitor events in real-time, while allowing participants to browse a global catalog and reserve specific seats through an interactive map.

This project is architected as a **Modular Monolith**, focusing on data integrity and high performance under high-concurrency scenarios.

---

## 🚀 Key Features

### 🔐 Authentication & Authorization
- Robust authentication via **JWT** with role-based access control
- Three distinct user roles: **Admin**, **Organizer**, and **Participant**
- Secure password encryption with BCrypt

### 📋 Event Management
- Full CRUD capabilities for events with multi-step creation wizard
- Support for both physical venues and online sessions
- Event categories and status management (Draft, Published, Cancelled, Completed)
- Interactive location maps powered by **Leaflet + OpenStreetMap**

### 🎫 Real-time Seat Reservation
- Interactive seat map with visual status indicators
- **Temporary hold system (10-minute lock)** to prevent double-booking
- Real-time updates via **WebSockets (STOMP + SockJS)**
- Automatic lock expiration with scheduled cleanup

### 📊 Dashboards

#### Admin Dashboard
- Platform-wide statistics and analytics
- User management with role assignment
- Content moderation and reports handling
- System logs monitoring
- Category and system configuration management

#### Organizer Dashboard
- Real-time analytics on occupancy rates and revenue
- Participant list with booking details
- Quick actions: schedule changes and mass messaging
- Event performance statistics

#### Participant Dashboard
- Event catalog with search and filtering
- My bookings with digital tickets
- Notifications system (booking confirmations, schedule changes, organizer messages)
- Event feedback submission

### 🔔 Notification System
- Real-time notifications via WebSocket
- Persistent notifications stored in database
- Automatic notifications for:
  - Booking confirmations
  - Event schedule changes
  - Organizer messages to participants

### 🎟️ Digital Tickets
- Digital ticket generation for confirmed bookings
- Ticket details with participant info, seat number, and event details

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend** | Java 21, Spring Boot 3.5, Spring Security (JWT), Spring Data JPA |
| **Frontend** | React 19, Vite 7, React Router 7 |
| **Database** | PostgreSQL 16 |
| **Maps** | Leaflet, React-Leaflet, OpenStreetMap (Nominatim) |
| **Real-time** | Spring WebSocket, STOMP, SockJS |
| **Containerization** | Docker & Docker Compose |

---

## 🏗️ Architecture & Design

### Concurrency Control
- **Pessimistic Locking:** Applied at the database level to ensure that even with thousands of simultaneous clicks on the same seat, only one user successfully acquires the lock.
- **Lock Expiration Scheduler:** Background job running every 30 seconds to release expired seat locks.

### Real-time Communication
- **Stateful WebSockets:** Real-time state management to broadcast seat availability changes instantly to all connected clients.
- **STOMP Protocol:** Structured messaging with topic-based subscriptions for seats, organizer notifications, and event announcements.

### Project Structure
```
backend/
├── core/
│   ├── config/          # Security, WebSocket, CORS configurations
│   └── services/        # JWT service
└── modules/
    ├── admin/           # Admin dashboard, user management, reports
    ├── auth/            # Authentication, user entities, JWT
    ├── booking/         # Seat reservation, lock management, scheduling
    ├── event/           # Event CRUD, organizer features
    └── notification/    # Real-time notifications, WebSocket handlers

frontend/
├── components/          # Reusable components (EventMap, ProtectedRoute)
├── context/             # Auth context provider
├── hooks/               # Custom hooks (useSeatWebSocket)
├── pages/               # Dashboard pages (Admin, Organizer, Participant)
└── services/            # API and auth services
```

---

## 🚀 Getting Started

### Prerequisites
- Java 21+
- Node.js 18+
- Docker & Docker Compose

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ems-project.git
   cd ems-project
   ```

2. **Start the database**
   ```bash
   docker-compose up -d
   ```

3. **Run the backend**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

4. **Run the frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080

### Default Users (DataSeeder)
| Role | Username | Password |
| :--- | :--- | :--- |
| Admin | admin | admin123 |
| Organizer | organizer | org123 |
| Participant | participant | part123 |

---

## 📝 API Endpoints

### Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |

### Events
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/events` | List published events |
| GET | `/api/events/{id}` | Get event details |
| GET | `/api/events/{id}/seats` | Get event seats |
| POST | `/api/events` | Create event (Organizer) |
| PUT | `/api/events/{id}` | Update event (Organizer) |
| POST | `/api/events/{id}/message` | Send message to participants |

### Bookings
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/bookings/lock` | Lock a seat |
| POST | `/api/bookings/confirm` | Confirm booking |
| POST | `/api/bookings/release` | Release locked seat |
| DELETE | `/api/bookings/{id}` | Cancel booking |

### Participant
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/participant/bookings` | Get my bookings |
| GET | `/api/participant/notifications` | Get notifications |
| POST | `/api/participant/feedback` | Submit event feedback |

---

## 📝 Development Roadmap

- [x] **Phase 1**: Initial architecture setup (Spring + React)
- [x] **Phase 2**: Database modeling and Docker configuration
- [x] **Phase 3**: Authentication & Authorization (JWT)
- [x] **Phase 4**: Core Event CRUD & Catalog
- [x] **Phase 5**: Real-time Seat Reservation System (WebSockets + Locking)
- [x] **Phase 6**: Organizer Dashboard with Analytics
- [x] **Phase 7**: Participant Dashboard with Notifications
- [x] **Phase 8**: Admin Dashboard with User Management
- [x] **Phase 9**: Interactive Maps (Leaflet + OpenStreetMap)
- [x] **Phase 10**: Notification System (Schedule changes, Organizer messages)
- [ ] **Phase 11**: Google Calendar API Integration (.ics export)
- [ ] **Phase 12**: Email notifications (SMTP)
- [ ] **Phase 13**: Payment integration

---

## 📸 Screenshots

*Coming soon*

---

## 📄 License

This project is licensed under the MIT License.

---

Developed with ❤️ by Catarina Sousa
