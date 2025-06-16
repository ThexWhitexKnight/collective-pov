
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/heic',
  'image/heif'
];

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/mov',
  'video/avi',
  'video/quicktime'
];

export const ALL_ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
export const MAX_VIDEO_DURATION_HD = 10 * 60; // 10 minutes in seconds
export const MAX_VIDEO_DURATION_4K = 5 * 60; // 5 minutes in seconds

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileType: 'image' | 'video' | 'unknown';
}

export function validateFile(file: File): FileValidationResult {
  // Check file type
  if (!ALL_ALLOWED_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not supported. Please use JPG, PNG, HEIC, MP4, MOV, or AVI files.`,
      fileType: 'unknown'
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the maximum limit of 500MB.`,
      fileType: ALLOWED_IMAGE_TYPES.includes(file.type) ? 'image' : 'video'
    };
  }

  const fileType = ALLOWED_IMAGE_TYPES.includes(file.type) ? 'image' : 'video';

  return {
    isValid: true,
    fileType
  };
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = getFileExtension(originalName);
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  
  return `${nameWithoutExt}_${timestamp}_${randomString}.${extension}`;
}

export async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = URL.createObjectURL(file);
  });
}

export async function validateVideoFile(file: File): Promise<FileValidationResult> {
  const basicValidation = validateFile(file);
  
  if (!basicValidation.isValid || basicValidation.fileType !== 'video') {
    return basicValidation;
  }

  try {
    const duration = await getVideoDuration(file);
    
    // Estimate if it's 4K based on file size (rough heuristic)
    const is4K = file.size > 100 * 1024 * 1024; // Files over 100MB likely 4K
    const maxDuration = is4K ? MAX_VIDEO_DURATION_4K : MAX_VIDEO_DURATION_HD;
    
    if (duration > maxDuration) {
      const maxMinutes = Math.floor(maxDuration / 60);
      const quality = is4K ? '4K' : 'HD';
      return {
        isValid: false,
        error: `Video duration (${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}) exceeds the maximum limit of ${maxMinutes} minutes for ${quality} videos.`,
        fileType: 'video'
      };
    }

    return {
      isValid: true,
      fileType: 'video'
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to validate video file. Please try again.',
      fileType: 'video'
    };
  }
}
