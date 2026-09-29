import express from "express";
import authRoutes from "./auth.js";
import noteRoutes from "./notes.js";
import setupRoutes from "./setup.js";
import userRoutes from "./users.js";

const router = express.Router();

router.use("/setup", setupRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/notes", noteRoutes);

export default router;
