import express from "express"; //  web framework hai jo APIs, routes, servers banane
import "dotenv/config"; // automatically call dotenv.config() ko
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth.route.js"
import userRoutes from "./routes/user.route.js"
import chatRoutes from "./routes/chat.route.js"

import { connectDB } from "./lib/db.js";

const app= express(); //middleware, routes, etc. define kar sakte ho.
const PORT = process.env.PORT;

const  __dirname = path.resolve();

app.use(cors({
   origin: "http://localhost:5173",
   credentials: true // allow frontend to send cookies
})
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);


if(process.env.NODE_ENV === "production") {
   app.use(express.static(path.join(__dirname, "../frontend/dist")));

   app.get("*", (req,res)=> {
      res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
   }) 
}


app.listen(PORT, ()=> {
   console.log(`Server is runnning on this port ${PORT}`);
   connectDB(); //server start hote hi database bhi connect ho jaye.
});
