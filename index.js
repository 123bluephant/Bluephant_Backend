import express from 'express';
import 'dotenv/config'
import cookieParser from "cookie-parser"
import path from 'path';
import dotenv from 'dotenv';
import { connectDB } from './db/db.js';
import UserRoute from "./route/user.route.js"
import submitRoute from "./route/submit.route.js"
import orderroute from "./route/orderRoutes.js"
dotenv.config();
import cors from "cors";
import { fileURLToPath } from 'url';

const app = express();
app.use(cors({
  origin:[ 'https://admin.bluephant.tech', 'https://bluephant.tech'], 
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5000;







connectDB();

app.use('/api',submitRoute)
app.use('/api/user',UserRoute)
app.use('/api/order',orderroute)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});