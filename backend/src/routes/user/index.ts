import express from "express";
import authRoutes from "./auth.js";
import noteRoutes from "./notes.js";
import postRoutes from "./posts.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/notes", noteRoutes);
router.use("/posts", postRoutes);

export default router;
