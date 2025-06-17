import { google } from 'googleapis';

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
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      
      const fileMetadata = {
        name: fileName,
        parents: folderId ? [folderId] : undefined,
      };

      // Use buffer directly without stream conversion
      const media = {
        mimeType,
        body: fileBuffer,
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id,name,webViewLink,webContentLink,thumbnailLink',
      });

      // Set file permissions based on public/private setting
      if (isPublic) {
        await this.drive.permissions.create({
          fileId: response.data.id,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });
      }

      return {
        fileId: response.data.id,
        fileName: response.data.name,
        webViewLink: response.data.webViewLink,
        webContentLink: response.data.webContentLink,
        thumbnailLink: response.data.thumbnailLink,
      };
    } catch (error) {
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
