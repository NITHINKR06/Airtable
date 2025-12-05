const express = require('express');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const mongoose = require('mongoose');

const router = express.Router();

// Create GridFS storage engine
const storage = new GridFsStorage({
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/airtable-form-builder',
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
        return {
            filename: `${Date.now()}-${file.originalname}`,
            bucketName: 'uploads' // Collection name will be uploads.files and uploads.chunks
        };
    }
});

// File filter to validate file types
const fileFilter = (req, file, cb) => {
    // Accept common file types
    const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${file.mimetype} is not supported`), false);
    }
};

// Configure multer with GridFS storage
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

/**
 * POST /api/upload
 * Upload one or more files to GridFS
 */
router.post('/', upload.array('files', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                error: { message: 'No files uploaded' }
            });
        }

        // Build public URLs for uploaded files
        const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
        const uploadedFiles = req.files.map(file => ({
            url: `${baseUrl}/api/files/${file.filename}`,
            filename: file.originalname,
            size: file.size,
            type: file.mimetype
        }));

        res.status(200).json({
            message: 'Files uploaded successfully',
            files: uploadedFiles
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            error: { message: 'Failed to upload files' }
        });
    }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: { message: 'File size exceeds 10MB limit' }
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                error: { message: 'Too many files. Maximum 10 files allowed' }
            });
        }
        return res.status(400).json({
            error: { message: error.message }
        });
    }

    if (error) {
        return res.status(400).json({
            error: { message: error.message }
        });
    }

    next();
});

module.exports = router;
