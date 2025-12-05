const express = require('express');
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');

const router = express.Router();

// Initialize GridFS
let gfs;
const conn = mongoose.connection;

conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
});

/**
 * GET /api/files/:filename
 * Retrieve and stream a file from GridFS
 */
router.get('/:filename', async (req, res) => {
    try {
        const { filename } = req.params;

        if (!gfs) {
            return res.status(500).json({
                error: { message: 'GridFS not initialized' }
            });
        }

        // Find the file in GridFS
        const file = await gfs.files.findOne({ filename: filename });

        if (!file) {
            return res.status(404).json({
                error: { message: 'File not found' }
            });
        }

        // Check if file is an image or other type
        const isImage = file.contentType && file.contentType.startsWith('image/');

        // Set appropriate headers
        res.set('Content-Type', file.contentType);
        res.set('Content-Disposition', isImage ? 'inline' : `attachment; filename="${file.filename}"`);

        // Create read stream and pipe to response
        const readStream = gfs.createReadStream({
            filename: file.filename
        });

        readStream.on('error', (err) => {
            console.error('Stream error:', err);
            res.status(500).json({
                error: { message: 'Error streaming file' }
            });
        });

        readStream.pipe(res);
    } catch (error) {
        console.error('File retrieval error:', error);
        res.status(500).json({
            error: { message: 'Failed to retrieve file' }
        });
    }
});

/**
 * DELETE /api/files/:filename
 * Delete a file from GridFS (optional, for cleanup)
 */
router.delete('/:filename', async (req, res) => {
    try {
        const { filename } = req.params;

        if (!gfs) {
            return res.status(500).json({
                error: { message: 'GridFS not initialized' }
            });
        }

        await gfs.files.deleteOne({ filename: filename });

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
