import multer from "multer";
import fs from "node:fs";

export const multer_local = ({
  custom_path = "General",
  custom_types = [],
}) => {
  const full_path = `uploads/${custom_path}`;
  if (!fs.existsSync(full_path)) {
    fs.mkdirSync(full_path, { recursive: true });
  }
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, full_path);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + ".png");
    },
  });
  function fileFilter(req, file, cb) {
    if (!custom_types.includes(file.mimetype)) {
      cb(new Error("Invalid File type"));
    }
    cb(null, true);
  }

  const upload = multer({ storage, fileFilter });
  return upload;
};

export const multer_host = ({ custom_types = [] }) => {
  const storage = multer.diskStorage({}); // will send to folder temp

  function fileFilter(req, file, cb) {
    if (!custom_types.includes(file.mimetype)) {
      return cb(new Error("Invalid File type"), false);
    }

    cb(null, true);
  }

  const upload = multer({ storage, fileFilter });
  return upload;
};
