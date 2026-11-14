# Temporary JSON authentication

Run `npm run dev`, then open `/login` or `/signup`. This implementation is for local development with a single Node.js server and a writable filesystem.

## Sample accounts

All accounts are fictional and use the password **`LearnSI2026!`**.

| Email | Student | Scenario |
| --- | --- | --- |
| `student@si-tutor.example` | Alex Morgan | High school; HSC Mathematics and AI & ML access |
| `maya@si-tutor.example` | Maya Chen | University; Calculus access |
| `narin@si-tutor.example` | Narin Sukjai | Lifelong learner; expired IELTS access |
| `jamie@si-tutor.example` | Jamie Taylor | New learner; empty library |

`users.json` contains IDs, names, emails, password hashes, student roles, learning stages, countries, learning goals, interests, creation dates, and course enrollments. Seed access expires on 14 February 2027; the expired example ended on 1 October 2026. Dates can be edited to test access expiry.

## Behaviour

- Sign up validates names, email, learning stage, password strength and confirmation. Emails are trimmed and matched without case sensitivity. Successful registration writes a new user to `users.json` and logs them in.
- Passwords use individually salted Node.js scrypt hashes. Password hashes are never included in API responses or client bundles.
- `GET /api/auth` returns the current public profile; `POST /api/auth` accepts `action: login` or `action: signup`; `DELETE /api/auth` logs out and invalidates the session.
- Session tokens use HttpOnly, SameSite=Lax cookies (Secure over HTTPS). Unchecked “Keep me logged in” uses a browser-session cookie with a 12-hour server lifetime. Checked uses a 30-day persistent cookie. **Restarting the server clears all sessions**, including remembered sessions; user accounts remain in JSON.
- Course purchases, progress and notes remain browser-local demonstrations, now separated by user ID. The old anonymous purchase/progress state is not assigned to a user. Demo course access is not a production authorization mechanism.
- Registration writes are serialized and use an atomic file replacement inside one server process. JSON storage is not suitable for multiple workers, serverless or production hosting.
- Use sample information only. There is no email verification or password-reset delivery in this demo.

## Database migration

Replace `src/lib/server/user-repository.ts` with a database adapter while keeping `findUser`, `authenticateUser`, and `createUser` contracts. Move in-memory sessions to persistent session storage; enforce a unique normalized email in the database. Replace browser-local course purchases/progress with authenticated server records and server-side course authorization before a production release. Add rate limiting, verification and recovery with the production auth provider.
