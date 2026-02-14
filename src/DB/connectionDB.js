import mongoose from "mongoose";

const checkConnectionDB = async () => {
  await mongoose
    .connect("mongodb://127.0.0.1:27017/saraha-app", {
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
