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
    try {
      console.log('Starting upload for:', fileName, 'Size:', fileBuffer.length, 'Type:', mimeType);
      
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      console.log('Using folder ID:', folderId);
      
      const fileMetadata = {
        name: fileName,
        parents: folderId ? [folderId] : undefined,
      };

      // Create stream using Readable.from() method
      const stream = Readable.from([fileBuffer]);
      console.log('Created stream for upload');

      const media = {
        mimeType,
        body: stream,
      };

      console.log('Calling Google Drive API...');
      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id,name,webViewLink,webContentLink,thumbnailLink',
      });

      console.log('Google Drive API response:', response.data);

      // Set file permissions based on public/private setting
      if (isPublic) {
        console.log('Setting public permissions...');
        await this.drive.permissions.create({
          fileId: response.data.id,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });
        console.log('Permissions set successfully');
      }

      const result = {
        fileId: response.data.id,
        fileName: response.data.name,
        webViewLink: response.data.webViewLink,
        webContentLink: response.data.webContentLink,
        thumbnailLink: response.data.thumbnailLink,
      };

      console.log('Upload completed successfully:', result);
      return result;
    } catch (error) {
      console.error('Detailed error uploading to Google Drive:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error status:', error.status);
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
