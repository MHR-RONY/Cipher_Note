import "dotenv/config";
import { connectDB } from "./config/db.js";
import app from "./app.js";

await connectDB();
app.listen(process.env.PORT || 5000);
