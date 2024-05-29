const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../public/images');

    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath);
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  }
});

const upload = multer({ storage })

module.exports = { upload, storage};
