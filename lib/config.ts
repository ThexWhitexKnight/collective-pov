export function isGoogleDriveConfigured(): boolean {
  const requiredEnvVars = [
    'GOOGLE_DRIVE_CLIENT_EMAIL',
    'GOOGLE_DRIVE_PRIVATE_KEY',
    'GOOGLE_DRIVE_PROJECT_ID',
    'GOOGLE_DRIVE_FOLDER_ID'
  ];

  return requiredEnvVars.every(envVar => {
    const value = process.env[envVar];
    return value && value.trim() !== '';
  });
}

export function getGoogleDriveConfig() {
  return {
    clientEmail: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
    privateKey: process.env.GOOGLE_DRIVE_PRIVATE_KEY,
    projectId: process.env.GOOGLE_DRIVE_PROJECT_ID,
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
    isConfigured: isGoogleDriveConfigured()
  };
}
