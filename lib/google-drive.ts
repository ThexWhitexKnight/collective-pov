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
      fields: 'id,name',
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

async uploadFileSimple(
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
  const media = { mimeType, body: stream };

  // Simple upload - NO metadata request
  const response = await this.drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id', // ONLY get file ID
  });

  if (isPublic) {
    await this.drive.permissions.create({
      fileId: response.data.id,
      requestBody: { role: 'reader', type: 'anyone' },
    });
  }

  return { 
  fileId: response.data.id, 
  fileName: fileName,
  webViewLink: null,        // ← Add these missing fields
  webContentLink: null,     // ← Add these missing fields
  thumbnailLink: null       // ← Add these missing fields (will be set later)
};
}
  
  async getFileMetadata(fileId: string) {
    const response = await this.drive.files.get({
      fileId: fileId,
      fields: 'id,name,thumbnailLink',
    });
    return response.data;
  }
  async getThumbnailUrl(fileId: string) {
  try {
    const response = await this.drive.files.get({
      fileId: fileId,
      fields: 'thumbnailLink',
    });
    return response.data.thumbnailLink || null;
  } catch (error) {
    console.error('Failed to get thumbnail:', error);
    return null;
  }
}
}

export const googleDriveService = new GoogleDriveService();
