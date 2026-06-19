// constants/upload.constants.js
module.exports = {
  FILE_SIZE_LIMITS: {
    image: 10 * 1024 * 1024, // 10MB
    video: 500 * 1024 * 1024, // 500MB
    document: 50 * 1024 * 1024, // 50MB
    default: 200 * 1024 * 1024, // 200MB
  },

  ALLOWED_MIME_TYPES: {
    image: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
    ],
    video: [
      "video/mp4",
      "video/mpeg",
      "video/ogg",
      "video/webm",
      "video/quicktime",
      "video/x-msvideo",
    ],
    document: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/csv",
    ],
  },

  PRIVATE_FOLDERS: ["lms/student-payments-screenshot"],

  DEFAULT_FOLDERS: {
    payments: "lms/Payments_ScreenShots",
  },

  UPLOAD_CONFIG: {
     "registration-payment": {
    folder: "lms/temp/registration_payments",
    permanentFolder: "lms/Payments_ScreenShots",
    isPrivate: false,
    isPermanentPrivate: true,
    public: true,
    ttl: 48,
    allowedTypes: [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
    ],
    maxSize: 5 * 1024 * 1024, // 5MB
    description: "Registrations Payments"
},



 "course-image": {
    folder: "lms/temp/courses",
    permanentFolder: "lms/courses",
    isPrivate: false,
    isPermanentPrivate: false,
    public: true,
    ttl: 48,
    allowedTypes: [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
    ],
    maxSize: 5 * 1024 * 1024, // 5MB
    description: "Courses Images"
},
   
  },

  getUploadConfig: (type) => {
    const config = module.exports.UPLOAD_CONFIG[type];
    if (!config) {
      throw new Error(
        `Invalid upload type: ${type}. Available types: ${Object.keys(module.exports.UPLOAD_CONFIG).join(", ")}`,
      );
    }
    return config;
  },

  isValidUploadType: (type) => {
    return !!module.exports.UPLOAD_CONFIG[type];
  },

  getTTL: (type) => {
    const config = module.exports.getUploadConfig(type);
    return config.ttl;
  },

  getPermanentFolder: (type) => {
    const config = module.exports.getUploadConfig(type);
    return config.permanentFolder;
  },

  isPrivateFolder: (folderPath) => {
    const PRIVATE_FOLDERS = module.exports.PRIVATE_FOLDERS;
    return PRIVATE_FOLDERS.some(
      (privateFolder) =>
        folderPath.includes(privateFolder) ||
        privateFolder.includes(folderPath),
    );
  },
};
