import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "uploads/chat";

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({

    destination(req, file, cb) {

        cb(null, uploadDir);

    },

    filename(req, file, cb) {

        const ext = path.extname(file.originalname);

        cb(
            null,
            Date.now() + "-" + Math.round(Math.random() * 1e9) + ext
        );

    }

});

const fileFilter = (req, file, cb) => {

    cb(null, true);

};

export default multer({

    storage,

    fileFilter,

    limits: {

        fileSize: 25 * 1024 * 1024,

    },

});