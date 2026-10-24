import multer from "multer";

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, callback) => {
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}.pdf`;
    callback(null, uniqueName);
  },
});

function fileFilter(req, file, callback) {
  if (
    file.mimetype !== "application/pdf" ||
    !file.originalname.toLowerCase().endsWith(".pdf")
  ) {
    return callback(new Error("Only PDF files are allowed"));
  }

  callback(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
});

export default upload;