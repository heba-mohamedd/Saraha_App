import mongoose from "mongoose";
import { DB_URL } from "../../config/config.service.js";

const checkConnectionDB = async () => {
  await mongoose
    .connect(DB_URL, {
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => {
      console.log("DataBase connected Successfully");
    })
    .catch((error) => {
      console.log(error, "DB fail to connected ...");
    });
};

export default checkConnectionDB;
