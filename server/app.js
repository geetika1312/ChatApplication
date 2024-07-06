import express from "express";
import { connectDB } from "./utils/features.js";
import dotenv from "dotenv";
import { errorMiddleware } from "./middlewares/error.js";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { v4 as uuid } from "uuid";
import cors from "cors";
import { corsOptions } from "./constants/config.js";
import userRoute from "./routes/user.js";
import chatRoute from "./routes/chat.js";
import adminRoute from "./routes/admin.js";
import { createUser } from "./seeders/user.js";
import { createGroupChats, createMessagesInAChat, createSingleChats } from "./seeders/chat.js";
import { NEW_MESSAGE, NEW_MESSAGE_ALERT } from "./constants/events.js";
import { getSockets } from "./lib/helper.js";
import { Message } from "./models/message.js";

dotenv.config({
    path: "./.env",
});

// createSingleChats(10);
// createGroupChats(10);

const mongoURI = process.env.MONGO_URI;
const port = process.env.PORT || 3000;
const envMode = process.env.NODE_ENV.trim() || "PRODUCTION";
const adminSecretKey = process.env.ADMIN_SECRET_KEY || "adsasdsdfsdfsdfd";
const userSocketIDs = new Map();

connectDB(mongoURI);

// createMessagesInAChat("6686f8703996039f5ea6a855", 50)

//createUser(10);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: corsOptions,
});

app.use(express.json());
app.use(cookieParser());

connectDB("mongodb://localhost:27017")

app.use("/user", userRoute);
app.use("/chat", chatRoute);
app.use("/admin", adminRoute);

app.get("/", (req, res) => {
    res.send("Hello World");
});

io.use((socket, next) => {
    cookieParser()(
      socket.request,
      socket.request.res,
      async (err) => await socketAuthenticator(err, socket, next)
    );
  });

io.on("connection", (socket) => {
    const user = {
        _id:"asdfgf",
        name:"sdfdsf"
    }
    userSocketIDs.set(user._id.toString(), socket.id);
    console.log("a user connected", socket.id);

    socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
        const messageForRealTime = {
          content: message,
          _id: uuid(),
          sender: {
            _id: user._id,
            name: user.name,
          },
          chat: chatId,
          createdAt: new Date().toISOString(),
        };

        const messageForDB = {
            content: message,
            sender: user._id,
            chat: chatId,
        };

        const membersSocket = getSockets(members);
        io.to(membersSocket).emit(NEW_MESSAGE, {
            chatId,
            message: messageForRealTime,
          });
          io.to(membersSocket).emit(NEW_MESSAGE_ALERT, { chatId });

          try {
            await Message.create(messageForDB);
          } catch (error) {
            console.log(error);
          }
      
    })

    socket.on("disconnect", () => {
        console.log("user disconnected");
        userSocketIDs.delete(user._id.toString());
    })
})

app.use(errorMiddleware);

server.listen(port, () => {
    console.log(`Server is running on port ${port} in ${envMode} Mode`);
});

export {envMode, adminSecretKey, userSocketIDs };
