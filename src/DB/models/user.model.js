import mongoose from "mongoose";
import { GenderEnum, ProviderEnum } from "../../common/enum/user.enum.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 20,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 20,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minLength: 6,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
      enum: Object.values(GenderEnum),
      default: GenderEnum.male,
    },
    profilePicture: String,
    confirmed: Boolean,
    provider: {
      type: String,
      enum: Object.values(ProviderEnum),
      default: ProviderEnum.system,
    },
  },
  {
    timestamps: true,
    strictQuery: true, // sign by field not in schema will ignore it
    // toJSON: { virtuals: true },
    // toObject: { virtuals: true },
  },
);

userSchema
  .virtual("userName")
  .get(function () {
    return this.firstName + " " + this.lastName;
  })
  .set(function (v) {
    const [firstName, lastName] = v.split(" ");
    this.set({ firstName, lastName });
  });

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
