# Internship Project

This project is a full-stack internship assignment with:

- A portfolio-style landing section
- A To-Do app (add, edit, delete, mark complete)
- A registration form connected to Node.js + MySQL backend
- A dynamic background color changer

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: MySQL
- Packages: `bcrypt`, `cors`, `express`, `mysql2`

## Folder Structure

- `index.html`: Main page UI
- `style.css`: Styling and layout
- `script.js`: Frontend logic (todo, registration, color changer)
- `server.js`: Express server and registration API
- `package.json`: Scripts and dependencies

## Features

### Portfolio Section

- Intro/profile area with contact call-to-action
- Contact button smoothly scrolls to registration form

### To-Do App

- Add new task
- Edit existing task
- Delete task
- Click task text to mark complete/incomplete
- Live task counter update
- If edited task is saved empty, it auto-deletes

### Registration Form

- Fields: Name, Email, Password, Phone
- Client-side validation:
  - All fields required
  - Email format check
  - Password minimum 6 characters
  - Phone must contain 10 to 15 digits
- Password show/hide toggle
- Sends data to backend `POST /register`
- Password is hashed using `bcrypt` before DB insert
- Duplicate email/name/phone values are currently allowed

### Dynamic Background Color

- Manual color change button support
- Automatic color rotation at intervals
- Gradient background updates with current color code

## Prerequisites

- Node.js (v18 or above recommended)
- MySQL Server running locally

## Installation

```bash
npm install
```

## Database Configuration

`server.js` reads these environment variables:

- `DB_HOST` (default: `localhost`)
- `DB_USER` (default: `root`)
- `DB_PASSWORD` (default: empty)
- `DB_NAME` (default: `internship_assignment`)
- `DB_PORT` (default: `3306`)

On startup, server will:

1. Create database if not exists
2. Create `users` table if not exists
3. Remove unique email index if present (to allow duplicates)

## Run Project

```bash
npm start
```

Expected logs:

- `MySQL connected and users table is ready.`
- `Server running at http://localhost:3000`

Open in browser:

- `http://localhost:3000`

Note:

- Always open through `http://localhost:3000`
- Do not open `index.html` directly

## API Details

### `POST /register`

Registers a user into MySQL.

Request JSON:

```json
{
  "name": "Test User",
  "email": "test@mail.com",
  "password": "123456",
  "phone": "9876543210"
}
```

Success response (`201`):

```json
{
  "message": "User registered successfully"
}
```

Validation errors (`400`) examples:

- `All fields are required`
- `Invalid email format`
- `Password must be at least 6 characters`
- `Phone should contain 10 to 15 digits`

Database unavailable (`503`):

- `Database is not connected...`

## Manual Testing

1. Add, edit, and delete todo tasks.
2. Edit a task to empty text and save: task should delete.
3. Submit valid registration: success message should appear.
4. Submit invalid email: validation message should appear.
5. Submit password shorter than 6: validation message should appear.
6. Submit same email/name multiple times: should still insert.

## Troubleshooting

- If `npm start` fails:
  - Confirm Node.js is installed: `node -v`
  - Confirm dependencies installed: `npm install`
- If registration fails with DB error:
  - Start MySQL service
  - Check DB credentials in environment variables
- If API response does not match latest code:
  - Stop old Node process
  - Start server again with `npm start`
- If frontend looks stale:
  - Hard refresh browser (`Ctrl + Shift + R`)

## Scripts

- `npm start`: Start server (`node server.js`)
- `npm run dev`: Start server in dev mode (`node server.js`)
- `npm test`: Placeholder test script

## Author

Internship Assignment Project
