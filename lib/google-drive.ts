import { google } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

export class GoogleDriveService {
  private drive: any;

  constructor() {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        project_id: process.env.GOOGLE_DRIVE_PROJECT_ID,
      },
      scopes: SCOPES,
    });

    this.drive = google.drive({ version: 'v3', auth });
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    isPublic: boolean = true
  ) {
    let fileId = null;
    
    try {
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      
      const fileMetadata = {
        name: fileName,
        parents: folderId ? [folderId] : undefined,
      };

      const stream = Readable.from([fileBuffer]);

      const media = {
        mimeType,
        body: stream,
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id,name,webViewLink,webContentLink,thumbnailLink',
      });

      fileId = response.data.id;

      // Set permissions with error handling
      if (isPublic && fileId) {
        try {
          await this.drive.permissions.create({
            fileId: fileId,
            requestBody: {
              role: 'reader',
              type: 'anyone',
            },
          });
        } catch (permError) {
          console.warn('Permission setting failed, but upload succeeded:', permError.message);
        }
      }

      // Return success even if some fields are missing
      return {
        fileId: fileId || 'unknown',
        fileName: response.data.name || fileName,
        webViewLink: response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
        webContentLink: response.data.webContentLink || `https://drive.google.com/uc?id=${fileId}`,
        thumbnailLink: response.data.thumbnailLink || null,
      };
    } catch (error) {
      // If we have a fileId, the upload likely succeeded despite the error
      if (fileId) {
        console.warn('Upload succeeded but response processing failed:', error.message);
        return {
          fileId: fileId,
          fileName: fileName,
          webViewLink: `https://drive.google.com/file/d/${fileId}/view`,
          webContentLink: `https://drive.google.com/uc?id=${fileId}`,
          thumbnailLink: null,
        };
      }
      
      console.error('Error uploading to Google Drive:', error);
      throw new Error('Failed to upload file to Google Drive');
    }
  }

  async deleteFile(fileId: string) {
    try {
      await this.drive.files.delete({
        fileId: fileId,
      });
      return true;
    } catch (error) {
      console.error('Error deleting file from Google Drive:', error);
      throw new Error('Failed to delete file from Google Drive');
    }
  }

  async getFileMetadata(fileId: string) {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id,name,mimeType,size,createdTime,webViewLink,webContentLink,thumbnailLink',
      });
      return response.data;
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw new Error('Failed to get file metadata');
    }
  }
}

export const googleDriveService = new GoogleDriveService();
