const multer = require("multer");
const path = require("node:path");
const fs = require("node:fs/promises");
const { randomUUID } = require("node:crypto");

const imagesDirectory = path.resolve(
    process.env.UPLOAD_DIR || path.join(__dirname, "../../public/images"),
);

const uploadImage = multer({
    storage: multer.memoryStorage(),
    limits: {
        files: 1,
        fileSize: 5 * 1024 * 1024,
        fields: 9,
        fieldSize: 32 * 1024,
        fieldArrayIndexLimit: 0,
    },
}).single("image");

function detectImage(buffer) {
    if (
        buffer
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    ) {
        return "png";
    }
    if (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) {
        return "jpg";
    }
    if (
        buffer.toString("ascii", 0, 4) === "RIFF" &&
        buffer.toString("ascii", 8, 12) === "WEBP" &&
        ["VP8 ", "VP8L", "VP8X"].includes(buffer.toString("ascii", 12, 16))
    ) {
        return "webp";
    }
    return null;
}

function localFilename(imagePath) {
    const match = /^\/images\/([^/\\]+)$/.exec(imagePath ?? "");
    const name = match?.[1];
    if (
        !name ||
        name.startsWith(".") ||
        !/\.(?:jpe?g|png|webp|gif)$/i.test(name)
    ) {
        return null;
    }
    if (/[\u0000-\u001f\u007f]/.test(name)) {
        return null;
    }
    return name;
}

function imageUrl(imagePath) {
    const filename = localFilename(imagePath);
    return filename ? "/images/" + encodeURIComponent(filename) : null;
}

async function writeImage(file, extension) {
    const filename = randomUUID() + "." + extension;
    await fs.mkdir(imagesDirectory, { recursive: true });
    const destination = path.join(imagesDirectory, filename);
    const handle = await fs.open(destination, "wx");
    try {
        try {
            await handle.writeFile(file.buffer);
        } finally {
            await handle.close();
        }
    } catch (error) {
        await fs.unlink(destination).catch(() => {});
        throw error;
    }
    return "/images/" + filename;
}

async function removeImage(imagePath) {
    const filename = localFilename(imagePath);
    if (filename) {
        await fs.rm(path.join(imagesDirectory, filename), { force: true });
    }
}

module.exports = {
    uploadImage,
    imagesDirectory,
    imageUrl,
    detectImage,
    writeImage,
    removeImage,
};
