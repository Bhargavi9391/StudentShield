const reportRoutes = require("./routes/reportRoutes");
const authRoutes = require("./routes/authRoutes");

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const opportunityRoutes = require("./routes/opportunityRoutes");

const app = express();

app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "https://student-shield-wid9lhj9x-bhargavi9391s-projects.vercel.app"
        ],
        credentials: true
    })
);

app.use(express.json());

connectDB();


app.use("/api/auth", authRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/reports", reportRoutes);


app.get("/", (req, res) => {
    res.json({
        message: "StudentShield Node API is running"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Node server running on http://localhost:${PORT}`);
});