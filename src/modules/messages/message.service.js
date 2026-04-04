import * as db_service from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";
import messageModel from "../../DB/models/message.model.js";
import { successResponse } from "../../common/utils/response.success.js";
import cloudinary from "../../common/utils/cloudinary.js";

export const sendMessage = async (req, res, next) => {
  const images = [];
  const { content, userId } = req.body;

  const user = await db_service.findById({
    model: userModel,
    filter: { _id: userId },
  });
  if (!user) {
    throw new Error("user not Exist");
  }

  if (req.files?.length) {
    for (const file of req.files) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        {
          folder: "sarah-app/messages",
        },
      );

      images.push({ secure_url, public_id });
    }
  }
  const messages = await db_service.create({
    model: messageModel,
    data: {
      content,
      userId: user._id,
      attachments: images,
    },
  });

  successResponse({ res, status: 201, data: messages });
};

export const getMessage = async (req, res, next) => {
  const { messageId } = req.params;

  const message = await db_service.findOne({
    model: messageModel,
    filter: {
      _id: messageId,
      userId: req.user._id,
    },
  });

  if (!message) {
    throw new Error("message not exist or not auth");
  }

  successResponse({ res, status: 200, data: message });
};

export const getMessages = async (req, res, next) => {
  const messages = await db_service.find({
    model: messageModel,
    filter: {
      userId: req.user._id,
    },
  });

  successResponse({ res, status: 200, data: messages });
};
