require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/db/mongodb");

// Connect to MongoDB Atlas
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
