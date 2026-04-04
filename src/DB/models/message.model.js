import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      minLength: 1,
      trim: true,
    },
    attachments: [
      {
        secure_url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  {
    timestamps: true,
    strictQuery: true,
  },
);

const messageModel =
  mongoose.models.message || mongoose.model("message", messageSchema);

export default messageModel;
