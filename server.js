const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins (restrict this in production)
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// Google Drive configuration
const KEYFILE_PATH = process.env.GOOGLE_KEYFILE_PATH || './service-account-key.json';
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || 'YOUR_FOLDER_ID_HERE';

// Initialize Google Drive API
let drive;

async function initializeDrive() {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: KEYFILE_PATH,
            scopes: ['https://www.googleapis.com/auth/drive.file']
        });

        drive = google.drive({ version: 'v3', auth });
        console.log('Google Drive API initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Google Drive:', error);
    }
}

// Initialize on startup
initializeDrive();

// Upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        if (!drive) {
            return res.status(500).json({ error: 'Google Drive not initialized' });
        }

        // Create file metadata
        const fileMetadata = {
            name: req.file.originalname,
            parents: [FOLDER_ID]
        };

        // Create media upload
        const media = {
            mimeType: req.file.mimetype,
            body: require('stream').Readable.from(req.file.buffer)
        };

        // Upload to Google Drive
        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, name, mimeType, webViewLink, webContentLink'
        });

        // Make file publicly accessible
        await drive.permissions.create({
            fileId: response.data.id,
            requestBody: {
                role: 'reader',
                type: 'anyone'
            }
        });

        res.json({
            success: true,
            file: {
                id: response.data.id,
                name: response.data.name,
                type: response.data.mimeType,
                url: response.data.webContentLink
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Get all files endpoint
app.get('/api/files', async (req, res) => {
    try {
        if (!drive) {
            return res.status(500).json({ error: 'Google Drive not initialized' });
        }

        // Query files in the folder
        const response = await drive.files.list({
            q: `'${FOLDER_ID}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType, createdTime, webViewLink, webContentLink, thumbnailLink)',
            orderBy: 'createdTime desc',
            pageSize: 100
        });

        const files = response.data.files || [];

        // Format files for frontend
        const formattedFiles = files.map(file => {
            // For images, use the Google Drive thumbnail API
            // For videos, we'll use the video file itself as thumbnail
            const isImage = file.mimeType.startsWith('image/');
            const thumbnailUrl = isImage 
                ? `https://drive.google.com/thumbnail?id=${file.id}&sz=w400`
                : file.webContentLink;

            return {
                id: file.id,
                name: file.name,
                type: file.mimeType,
                url: file.webContentLink,
                thumbnailUrl: thumbnailUrl,
                createdTime: file.createdTime
            };
        });

        res.json({ 
            success: true, 
            files: formattedFiles 
        });

    } catch (error) {
        console.error('List files error:', error);
        res.status(500).json({ error: 'Failed to list files' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        driveInitialized: !!drive,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});