
# GameBalance

### Gaming Behavior and Wellness Monitoring System

GameBalance is a full-stack web application developed as a **university final-year Software Engineering project**.

The system helps gamers monitor their gaming habits, stress levels, and sleep patterns through activity tracking, wellness assessments, and rule-based risk analysis.

**[Live Demo](https://gamebalancedemo.netlify.app/)**

---

## Overview

GameBalance provides a centralized platform for tracking gaming behavior and understanding its relationship with personal wellness.

The application combines gaming activity, stress assessments, and sleep records to generate risk scores, identify behavioral trends, and provide personalized recommendations.

The project demonstrates practical software engineering concepts, including full-stack development, RESTful API design, relational database management, authentication, and cloud deployment.

## Features

- **Gaming Tracker** — Record gaming sessions and monitor playing time.
- **Stress Monitor** — Complete assessments and review stress levels.
- **Sleep Tracker** — Track sleep duration and sleeping patterns.
- **Risk Analysis** — Generate rule-based wellness risk scores and recommendations.
- **Weekly Reports** — View wellness summaries and receive reports via email.
- **Authentication** — Secure login, JWT authentication, and email-based password recovery.
- **User Profile** — Manage account information and security settings.
- **Admin Dashboard** — Monitor platform activity and manage users with role-based access control.

## Tech Stack

| Category | Technologies |
|----------|--------------|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Node.js, Express.js |
| Database | MySQL (Aiven) |
| Authentication | JWT, bcrypt |
| Email Service | Resend |
| Deployment | Netlify, Netlify Functions |

## Project Structure

```text
GameBalance/
├── backend/          # REST API and business logic
├── frontend/         # React application
├── .gitignore
├── netlify.toml
└── README.md
```

## Getting Started

### Prerequisites

- Node.js and npm
- MySQL database
- Git

### Installation

Clone the repository:

```bash
git clone https://github.com/D3NUW4NXD/GameBalance.git
cd GameBalance
```

Install dependencies:

```bash
npm --prefix backend install
npm --prefix frontend install
```

Configure the required database, JWT, and Resend environment variables in `backend/.env`.

Create and configure the MySQL database using the schema required by the backend.

Start the backend:

```bash
npm --prefix backend run dev
```

Start the frontend in another terminal:

```bash
npm --prefix frontend run dev
```

The frontend will be available at the local URL provided by Vite.

## Academic Purpose

GameBalance was developed as a **final-year university project in Software Engineering**.

The project focuses on designing and implementing a complete web-based monitoring system using modern software development practices.

Its primary objectives are to:

- Develop a full-stack application with a responsive user interface.
- Implement secure authentication and role-based access control.
- Design and integrate a relational database.
- Analyze gaming and wellness data using rule-based techniques.
- Provide meaningful reports and recommendations.
- Deploy and maintain a cloud-hosted application.

GameBalance is intended for educational and self-monitoring purposes. Its wellness recommendations are not medical diagnoses.

## Developer

**D3NUW4NXD**

GitHub: [github.com/D3NUW4NXD](https://github.com/D3NUW4NXD)

---

**GameBalance — Play Smart. Live Balanced.**
