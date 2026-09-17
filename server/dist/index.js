"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("./routes/auth"));
const movies_1 = __importDefault(require("./routes/movies"));
const nominations_1 = __importDefault(require("./routes/nominations"));
const votes_1 = __importDefault(require("./routes/votes"));
const users_1 = __importDefault(require("./routes/users"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/auth', auth_1.default);
app.use("/api/movies", movies_1.default);
app.use("/api/nominations", nominations_1.default);
app.use("/api/votes", votes_1.default);
app.use("/api/users", users_1.default);
app.get("/", (req, res) => {
    res.send("Movie Club API is running");
});
// We will add movie routes here shortly
const PORT = process.env.PORT || 3000;
// Start server!!
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map