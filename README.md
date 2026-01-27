# Event Management System (EMS) 📅

The **Event Management System (EMS)** is a comprehensive platform designed to streamline event organization. It enables organizers to create and monitor events in real-time, while allowing participants to browse a global catalog and reserve specific seats through an interactive map.

This project is architected as a **Modular Monolith**, focusing on data integrity and high performance under high-concurrency scenarios.

---

## 🚀 Key Features

* **User Module:** Robust authentication via **JWT** with granular access control (Admin/Organizer vs. Attendee).
* **Event Management:** Full CRUD capabilities for events, supporting both physical venues and online sessions.
* **Real-time Seat Reservation:** Interactive seat map featuring a **temporary hold system (10-minute lock)** powered by WebSockets to eliminate double-booking.
* **Organizer Dashboard:** Real-time analytics on occupancy rates, registration trends, and attendee demographics.
* **Calendar Integration:** Seamless event export to **Google Calendar** via `.ics` file generation.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend** | Java 21, Spring Boot 3.5, Spring Security (JWT) |
| **Frontend** | React (Vite), Tailwind CSS, TanStack Query |
| **Database** | PostgreSQL 16 |
| **Communication** | Spring WebSocket + STOMP |
| **Containerization** | Docker & Docker Compose |

---

## 🏗️ Architecture & Design

To ensure consistency in high-demand environments, the EMS implements:
* **Pessimistic Locking:** Applied at the database level to ensure that even with thousands of simultaneous clicks on the same seat, only one user successfully acquires the lock.
* **Stateful WebSockets:** Real-time state management to broadcast seat availability changes instantly to all connected clients.
* **Modular Monolith:** Organized by domain packages to ensure a clean separation of concerns and ease of future scaling.

---

## 📝 Development Roadmap

To ensure consistency in high-demand environments, the EMS implements:
* [x] **Phase 1**: Initial architecture setup (Spring + React)

* [x] **Phase 2**: Database modeling and Docker configuration

* [x] **Phase 3**: Authentication & Authorization (JWT)

* [ ] **Phase 4**: Core Event CRUD & Catalog

* [ ] **Phase 5**: Real-time Seat Reservation System (WebSockets + Locking)

* [ ] **Phase 6**: Google Calendar API Integration

---

Developed with ❤️ by Catarina Sousa
