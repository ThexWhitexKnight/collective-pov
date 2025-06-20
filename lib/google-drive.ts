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
  }

  async deleteFile(fileId: string) {
    await this.drive.files.delete({
      fileId: fileId,
    });
    return true;
  }

  async getFileMetadata(fileId: string) {
    const response = await this.drive.files.get({
      fileId: fileId,
      fields: 'id,name,thumbnailLink',
    });
    return response.data;
  }
}

export const googleDriveService = new GoogleDriveService();
