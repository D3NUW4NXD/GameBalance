# GameBalance

### Gaming Behavior and Wellness Monitoring System

GameBalance is a full-stack web application developed as a **university final-year Software Engineering project**.

The system helps gamers monitor their gaming habits, stress levels, and sleep patterns through activity tracking, wellness assessments, and rule-based risk analysis.

**[Live Demo](https://gamebalancedemo.netlify.app/)**

---

## Overview

GameBalance provides a centralized platform for tracking gaming behavior and understanding its relationship with personal wellness.

The application combines recorded gaming sessions, stress assessments, and sleep information to generate rule-based risk scores, identify behavioral trends, and provide personalized recommendations.

The project demonstrates practical software engineering concepts, including full-stack development, RESTful API design, relational database management, authentication, role-based access control, and cloud deployment.

## Features

- **Gaming Tracker** — Record gaming sessions, monitor playing time, and review gaming history.
- **Stress Monitor** — Complete questionnaire-based assessments and review calculated stress levels.
- **Sleep Tracker** — Record sleep duration, sleep quality, and sleeping patterns.
- **Risk Analysis** — Generate rule-based wellness risk scores, identify trends, and receive recommendations.
- **Weekly Wellness Reports** — View summaries of gaming activity, stress, and sleep information, with email delivery support.
- **Authentication** — User registration, secure login, JWT authentication, and email-based password recovery.
- **Profile Management** — Update account information, manage profile pictures, and change passwords through email verification.
- **Notifications** — Receive application alerts, wellness notifications, and system feedback.
- **Admin Dashboard** — Monitor user activity, risk information, and system statistics.
- **Super Admin Management** — Manage administrator roles, create user accounts, and control account suspensions and restrictions.
- **Responsive Interface** — Access the application through desktop and mobile layouts.

## Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Node.js, Express.js |
| Database | MySQL (Aiven) |
| Authentication | JWT, bcryptjs |
| Email Service | Brevo / Resend (configurable) |
| Deployment | Netlify, Netlify Functions |
| API Testing | Postman |
| Version Control | Git, GitHub |

## Project Structure

```text
GameBalance/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # API request handling and business logic
│   ├── middleware/      # Authentication and authorization
│   ├── routes/          # REST API endpoints
│   ├── services/        # Email and supporting services
│   └── server.js        # Express application
├── frontend/
│   ├── public/          # Static assets
│   └── src/
│       ├── api/         # API client
│       ├── components/  # Reusable UI components
│       ├── context/     # Application state
│       └── pages/       # Application pages
├── .gitignore
├── netlify.toml
└── README.md
```

## Getting Started

### Prerequisites

- Node.js and npm
- MySQL database
- Git
- Email service credentials for email-related features

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/D3NUW4NXD/GameBalance.git
cd GameBalance
```

**2. Install dependencies**

```bash
npm --prefix backend install
npm --prefix frontend install
```

**3. Configure environment variables**

Create a `.env` file inside the `backend` directory.

Configure the required database connection and authentication settings:

```env
DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_SSL_CA_B64=

JWT_SECRET=
```

The database SSL certificate is configured through `DB_SSL_CA_B64` when required by the hosting environment.

**4. Configure transactional email**

GameBalance supports **Brevo and Resend** through a configurable email service.

For Brevo:

```env
EMAIL_PROVIDER=brevo
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=GameBalance
```

For Resend:

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=
REPORT_EMAIL_FROM=
PASSWORD_EMAIL_FROM=
```

Only one email provider needs to be configured. The current backend defaults to Resend when `EMAIL_PROVIDER` is not specified.

Email-related features require valid provider credentials and an appropriately configured sender address.

**Never commit `.env` files, API keys, passwords, or other credentials to GitHub.**

**5. Configure the database**

Create and configure the required MySQL tables and initial assessment-question data before starting the application.

The backend requires the database structure used by the authentication, gaming, stress, sleep, risk analysis, reporting, and administration modules.

**6. Start the backend**

```bash
npm --prefix backend run dev
```

**7. Start the frontend**

Open another terminal:

```bash
npm --prefix frontend run dev
```

The frontend will be available at the local address provided by Vite.

Configure `VITE_API_URL` when a custom backend API address is required.

### Production Build

To build the frontend for production:

```bash
npm --prefix frontend run build
```

The deployed application uses Netlify Functions for backend requests and Aiven MySQL for cloud database storage.

## Testing

GameBalance was evaluated through manual functional testing and additional API verification using Postman.

- **65 manual functional test cases** were recorded as passed, covering the main user and administrative features.
- **15 Postman API test cases** passed their configured assertions, covering database connectivity, authentication, access restrictions, gaming tracking, stress monitoring, sleep tracking, risk analysis, and weekly wellness reporting.

The testing included positive and negative scenarios to verify expected responses and access restrictions.

These results apply to the selected test conditions and do not guarantee that the application is free from all defects.

## Project Limitations

GameBalance is designed for educational and personal wellness monitoring.

- Gaming, stress, and sleep information depends on user-provided records.
- Risk scores are generated using predefined rules rather than clinically validated prediction models.
- The application does not establish a statistically measured relationship between gaming duration and stress.
- Profile-image storage in the current serverless implementation is temporary and is not intended as reliable permanent file storage.
- Formal participant-based user acceptance testing and comprehensive automated security and performance testing have not been completed.

GameBalance does not provide medical diagnoses or professional healthcare advice.

## Academic Purpose

GameBalance was developed as a **final-year university project in Software Engineering**.

The project focuses on designing and implementing an integrated monitoring application using practical software development techniques.

Its primary objectives are to:

- Develop a full-stack application with a responsive user interface.
- Implement authentication and role-based access control.
- Design and integrate a relational database.
- Combine gaming and wellness data using rule-based analysis.
- Provide understandable reports, alerts, and recommendations.
- Demonstrate API development, testing, and cloud deployment.

The completed system demonstrates the application of software engineering principles across frontend development, backend services, database design, security, and deployment.

## Developer

**D3NUW4NXD**

GitHub: [github.com/D3NUW4NXD](https://github.com/D3NUW4NXD)

---

### Support

If you like **GameBalance** or find this project useful, consider supporting my work by buying me a coffee. Your support helps me continue learning, developing, and building new projects.

<a href="https://www.buymeacoffee.com/chathuradei" target="_blank">
  <img src="https://img.shields.io/badge/Buy%20me%20a%20coffee-FF8A65?style=for-the-badge&logo=buymeacoffee&logoColor=white" height="40" alt="Buy Me a Coffee"/>
</a>

---

**GameBalance — Play Smart. Live Balanced.**
