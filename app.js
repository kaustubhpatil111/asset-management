const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 3000;

// MongoDB connection
mongoose.connect(
  "mongodb+srv://kaustubhpatilcomp22:kpKP2005%40@cluster0.xzt7z.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // Serve static files from the root directory

// Session configuration
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true in production when using HTTPS
  })
);

// User schema and model
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// Asset schema and model
const assetSchema = new mongoose.Schema({
  name: String,
  type: String,
  macAddress: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  assignDate: { type: Date, default: Date.now },
  expiryDate: Date,
});

const Asset = mongoose.model("Asset", assetSchema);

// Sign-up route
app.post("/api/signup", async (req, res) => {
  const { username, email, phoneNumber, password } = req.body;

  try {
    // Check if the user already exists by username or email
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: "Username or email already exists" });
    }

    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ username, email, phoneNumber, password: hashedPassword });
    await user.save();

    res.json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error signing up user" });
  }
});

// Sign-in route
app.post("/api/signin", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare password with hashed password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Store session
    req.session.userId = user._id; // Replace with JWT for real app

    res.json({ message: "Login successful" });
  } catch (error) {
    res.status(500).json({ message: "Error signing in user" });
  }
});

// Middleware to check authentication
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
}

// Add Asset
app.post("/api/assets", isAuthenticated, async (req, res) => {
  try {
    const { name, type, macAddress, assignDate, expiryDate } = req.body;

    // Create a new asset
    const asset = new Asset({
      name,
      type,
      macAddress,
      owner: req.session.userId, // Link asset to the logged-in user
      assignDate: assignDate || Date.now(),
      expiryDate,
    });

    await asset.save();
    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: "Error saving asset" });
  }
});

// Delete Asset
app.delete("/api/assets/:id", isAuthenticated, async (req, res) => {
  try {
    await Asset.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ message: "Error deleting asset" });
  }
});

// Get Assets for Logged-in User (optionally filtered by type)
app.get("/api/assets", isAuthenticated, async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { owner: req.session.userId };
    if (type) {
      filter.type = type;
    }
    const assets = await Asset.find(filter).populate('owner', 'username');
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: "Error fetching assets" });
  }
});

// Handle favicon.ico requests to prevent 404
app.get('/favicon.ico', (req, res) => res.status(204));

// Serve the main HTML file
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
