import { createClient } from "redis";
import { REDIS_URL } from "../../../config/config.service.js";

export const redisClient = createClient({
  url: REDIS_URL,
});

export const redisConnection = async () => {
  await redisClient
    .connect()
    .then(() => {
      console.log("success to connect with redis");
    })
    .catch((error) => {
      console.log("error to connect with redis", error);
    });
  // try {
  //   await redisClient.connect();
  //   console.log("success to connect with redis");

  // } catch (error) {
  //   console.log("error to connect with redis", error);
  // }
};
