const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const config = require("./config");
const db = require("./db");

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: "100kb" }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
app.use("/api/super-admin", require("./routes/superAdmin"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/flags", require("./routes/flags"));

const frontendRoot = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(frontendRoot));
app.get("/", (req, res) => res.sendFile(path.join(frontendRoot, "index.html")));
app.get("/super-admin/*splat", (req, res) =>
  res.sendFile(path.join(frontendRoot, "super-admin", "index.html")),
);
app.get("/admin/*splat", (req, res) =>
  res.sendFile(path.join(frontendRoot, "admin", "index.html")),
);
app.get("/user/*splat", (req, res) =>
  res.sendFile(path.join(frontendRoot, "user", "index.html")),
);

app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: "Unexpected server error" });
});

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`Feature flag system running at http://localhost:${config.port}`);
  });
}

module.exports = app;
