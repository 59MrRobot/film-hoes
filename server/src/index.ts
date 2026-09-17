import "dotenv/config";
import express from "express";
import cors from "cors";
import authRouter from "./routes/auth";
import moviesRouter from "./routes/movies";
import nominationsRouter from "./routes/nominations";
import votesRouter from "./routes/votes";
import usersRouter from "./routes/users";
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use("/api/movies", moviesRouter);
app.use("/api/nominations", nominationsRouter);
app.use("/api/votes", votesRouter);
app.use("/api/users", usersRouter);

app.get("/", (req, res) => {
  res.send("Movie Club API is running");
});

// We will add movie routes here shortly

const PORT = process.env.PORT || 3000;

// Start server!!
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
