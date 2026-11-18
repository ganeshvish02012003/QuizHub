# QuizHub

QuizHub is a React and Express quiz app with timed multiple-choice quizzes,
server-scored attempts, answer review, search, categories, and a quiz creator.
Quizzes and attempt scores are stored in MongoDB. Starter quizzes are added
automatically when the database has no quizzes.

## Run locally

1. Configure `backend/.env` with `MONGO_URI`, `JWT_SECRET`, `PORT`, and
   `FRONTEND_URL`. `MONGO_DNS_SERVERS` is optional and can override the
   machine's DNS servers for MongoDB SRV lookups.
2. Start the API:

   ```sh
   cd backend
   npm install
   npm run dev
   ```

3. In another terminal, start the frontend:

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

Vite proxies `/api` requests to `http://localhost:8080`.
