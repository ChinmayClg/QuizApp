# QuizAI - Smart Assessment Platform

QuizAI is a modern, AI-powered assessment platform designed for educators and students. It streamlines the process of creating, taking, and evaluating quizzes with advanced features like AI question generation, descriptive grading, and detailed analytics.

## ✨ Features

*   **For Teachers:**
    *   **AI-Powered Quiz Generation:** Automatically generate quizzes from text, topics, or notes using AI (powered by Gemini & Groq).
    *   **Automated Descriptive Grading:** Let AI automatically grade descriptive, long-form answers and provide feedback.
    *   **Question Bank Management:** Import, reorder, and manage questions effortlessly.
    *   **Customizable Settings:** Toggle negative marking, set time limits, and publish quizzes when ready.
    *   **Class & Student Management:** Create classrooms and track student performance with comprehensive analytics.

*   **For Students:**
    *   **Interactive Quizzes:** Take quizzes with a seamless, responsive UI.
    *   **AI Explanations:** Get detailed AI-generated explanations on why an answer was wrong.
    *   **Dashboard & Analytics:** Track performance history, scores, and active class enrollments.

## 🛠 Tech Stack

*   **Monorepo:** Turborepo
*   **Frontend:** React (Vite), TypeScript, CSS
*   **Backend:** NestJS, TypeScript
*   **Database:** PostgreSQL, Prisma ORM
*   **AI Integrations:** Google Gemini, Groq

## 🧪 Try It Out (Test Accounts)

You can explore the platform using the following test accounts. *(Note: Admin access is restricted for security purposes).*

### 👨‍🏫 Teacher Account
*   **Email:** `teacher@test.com`
*   **Password:** `password123`
*(Use this account to create quizzes, manage classes, and generate questions with AI)*

### 👨‍🎓 Student Account
*   **Email:** `student@test.com`
*   **Password:** `password123`
*(Use this account to take active quizzes, review history, and view AI grading feedback)*

## 🚀 Local Development Setup

### Prerequisites
*   Node.js & pnpm installed
*   PostgreSQL running locally

### Installation
1. Clone the repository and install dependencies:
   ```bash
   pnpm install
   ```
2. Setup Environment Variables:
   * Copy `.env.example` to `.env` in the root (and in `packages/database` / `apps/api` as needed).
   * Ensure `DATABASE_URL`, `JWT_SECRET`, and AI API keys are configured.

3. Setup Database:
   ```bash
   cd packages/database
   npx prisma db push
   pnpm run db:seed
   ```

4. Start Development Servers:
   ```bash
   pnpm run dev
   ```
   * Frontend runs on `http://localhost:5173`
   * Backend API runs on `http://localhost:10000`
