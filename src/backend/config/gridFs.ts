// src/backend/config/gridFs.ts

import { GridFsStorage } from 'multer-gridfs-storage';
import dotenv from 'dotenv';
import { resolve } from 'path'; // Used for resolving path, though not strictly needed here

dotenv.config({ path: resolve(process.cwd(), ".env") });

const mongoURI: string = process.env.MONGO_URI || "";

// Initialize GridFS storage configuration
const storage = new GridFsStorage({
    url: mongoURI,
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
        // This logic determines the name and type of the file stored in GridFS
        const match = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

        if (match.indexOf(file.mimetype) === -1) {
            // Return an error for non-image files
            const filename = `${Date.now()}-nonimage-${file.originalname}`;
            return filename;
        }

        return {
            bucketName: "photos", // Name of the GridFS collection where files will be stored (photos.files and photos.chunks)
            filename: `${Date.now()}-${file.originalname}`,
        };
    }
});

// Export the storage engine for use with Multer
export default storage;