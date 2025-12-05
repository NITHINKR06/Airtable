const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

/**
 * GET /api/files/:filename
 * Retrieve and stream a file from GridFS
 */
router.get('/:filename', async (req, res) => {
    try {
        const { filename } = req.params;

        // Get GridFS bucket
        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: 'uploads'
        });

        // Find the file
        const files = await mongoose.connection.db
            .collection('uploads.files')
            .find({ filename: filename })
            .toArray();

        if (!files || files.length === 0) {
            return res.status(404).json({
                error: { message: 'File not found' }
            });
        }

        const file = files[0];

        // Check if file is an image or other type
        const isImage = file.contentType && file.contentType.startsWith('image/');

        // Set appropriate headers
        res.set('Content-Type', file.contentType);
        res.set('Content-Disposition', isImage ? 'inline' : `attachment; filename="${file.filename}"`);

        // Create read stream and pipe to response
        const downloadStream = bucket.openDownloadStreamByName(filename);

        downloadStream.on('error', (err) => {
            console.error('Stream error:', err);
            if (!res.headersSent) {
                res.status(500).json({
                    error: { message: 'Error streaming file' }
                });
            }
        });

        downloadStream.pipe(res);
    } catch (error) {
        console.error('File retrieval error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                error: { message: 'Failed to retrieve file' }
            });
        }
    }
});

/**
 * DELETE /api/files/:filename
 * Delete a file from GridFS (optional, for cleanup)
 */
router.delete('/:filename', async (req, res) => {
    try {
        const { filename } = req.params;

        // Get GridFS bucket
        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: 'uploads'
        });

        // Find the file
        const files = await mongoose.connection.db
            .collection('uploads.files')
            .find({ filename: filename })
            .toArray();

        if (!files || files.length === 0) {
            return res.status(404).json({
                error: { message: 'File not found' }
            });
        }

        // Delete the file
        await bucket.delete(files[0]._id);

        res.json({
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('File deletion error:', error);
        res.status(500).json({
            error: { message: 'Failed to delete file' }
        });
    }
});

module.exports = router;
