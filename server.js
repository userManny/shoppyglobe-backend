const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);


require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Product = require("./models/Product");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Cart = require("./models/Cart");
const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log("MongoDB connection error:", err));

app.get("/", (req, res) => {
    res.send("ShoppyGlobe API is running");
});

app.get("/products", async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch products"
        });
    }
});

app.post("/products", async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();

        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({
            message: "Failed to add product"
        });
    }
});

app.get("/products/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.status(200).json(product);
    } catch (error) {
        res.status(400).json({
            message: "Invalid product ID"
        });
    }
});

app.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required"
            });
        }

        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            username,
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({
            message: "User registered successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Registration failed"
        });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({
            message: "Login successful",
            token: token
        });
 } catch (error) {
    console.log(error);
    res.status(500).json({
        message: "Login failed"
    });
}
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "Access denied. Please login."
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

app.post("/cart", authenticateToken, async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId || !quantity) {
            return res.status(400).json({
                message: "Product ID and quantity are required"
            });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        const cartItem = new Cart({
            userId: req.userId,
            productId,
            quantity
        });

        await cartItem.save();

        res.status(201).json(cartItem);
    } catch (error) {
        res.status(400).json({
            message: "Failed to add product to cart"
        });
    }
});

app.put("/cart/:id", authenticateToken, async (req, res) => {
    try {
        const { quantity } = req.body;

        if (!quantity) {
            return res.status(400).json({
                message: "Quantity is required"
            });
        }

        const cartItem = await Cart.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.userId
            },
            { quantity },
            { new: true }
        );

        if (!cartItem) {
            return res.status(404).json({
                message: "Cart item not found"
            });
        }

        res.status(200).json(cartItem);
    } catch (error) {
        res.status(400).json({
            message: "Failed to update cart"
        });
    }
});

app.delete("/cart/:id", authenticateToken, async (req, res) => {
    try {
        const cartItem = await Cart.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!cartItem) {
            return res.status(404).json({
                message: "Cart item not found"
            });
        }

        res.status(200).json({
            message: "Product removed from cart"
        });
    } catch (error) {
        res.status(400).json({
            message: "Failed to remove product from cart"
        });
    }
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});