import express from "express";
import checkConnectionDB from "./DB/connectionDB.js";
import userRouter from "./modules/users/user.controller.js";
import cors from "cors";
import { PORT } from "../config/config.service.js";
import { redisConnection } from "./DB/redis/redis.db.js";
import messageRouter from "./modules/messages/message.controller.js";
const app = express();
const port = PORT;

const bootstrap = async () => {
  app.use(cors(), express.json());
  app.use("/uploads", express.static("uploads"));
  app.get("/", (req, res) => res.send("wellcome in saraha App"));

  checkConnectionDB();
  redisConnection();

  app.use("/users", userRouter);
  app.use("/messages", messageRouter);
  app.use("{/*demo}", (req, res, next) => {
    throw new Error(`URL ${req.originalUrl} Not Found ....`, { cause: 404 });
  });
  app.use((err, req, res, next) => {
    res
      .status(err.cause || 500)
      .json({ message: err.message, stack: err.stack });
  });
  // , error: err
  app.listen(port, () => console.log(`Example app listening on port ${port}!`));
};

export default bootstrap;
