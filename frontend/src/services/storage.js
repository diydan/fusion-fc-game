import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll,
  getMetadata,
  updateMetadata
} from 'firebase/storage';
import { storage } from '@/config/firebase';

// Avatar operations
export const uploadAvatar = async (userId, file) => {
  try {
    const storageRef = ref(storage, `avatars/${userId}/avatar`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return { url: downloadURL, path: snapshot.ref.fullPath, error: null };
  } catch (error) {
    return { url: null, path: null, error: error.message };
  }
};

export const getAvatarUrl = async (userId) => {
  try {
    const storageRef = ref(storage, `avatars/${userId}/avatar`);
    const url = await getDownloadURL(storageRef);
    return { url, error: null };
  } catch (error) {
    // Handle CORS or file not found errors gracefully
    if (error.code === 'storage/object-not-found' || error.message.includes('CORS')) {
      console.log('Avatar not found or CORS issue for user:', userId);
      return { url: null, error: null }; // Return null without error
    }
    return { url: null, error: error.message };
  }
};

export const deleteAvatar = async (userId) => {
  try {
    const storageRef = ref(storage, `avatars/${userId}/avatar`);
    await deleteObject(storageRef);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Game assets operations
export const uploadGameAsset = async (assetPath, file, metadata = {}) => {
  try {
    const storageRef = ref(storage, `game-assets/${assetPath}`);
    const snapshot = await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return { url: downloadURL, path: snapshot.ref.fullPath, error: null };
  } catch (error) {
    return { url: null, path: null, error: error.message };
  }
};

export const getGameAssetUrl = async (assetPath) => {
  try {
    const storageRef = ref(storage, `game-assets/${assetPath}`);
    const url = await getDownloadURL(storageRef);
    return { url, error: null };
  } catch (error) {
    return { url: null, error: error.message };
  }
};

export const listGameAssets = async (folderPath = '') => {
  try {
    const listRef = ref(storage, `game-assets/${folderPath}`);
    const result = await listAll(listRef);
    
    const items = await Promise.all(
      result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        const metadata = await getMetadata(itemRef);
        return {
          name: itemRef.name,
          fullPath: itemRef.fullPath,
          url,
          metadata
        };
      })
    );
    
    return { items, folders: result.prefixes.map(p => p.name), error: null };
  } catch (error) {
    return { items: [], folders: [], error: error.message };
  }
};

// Team content operations
export const uploadTeamContent = async (teamId, contentType, file, metadata = {}) => {
  try {
    const timestamp = Date.now();
    const fileName = `${contentType}_${timestamp}_${file.name}`;
    const storageRef = ref(storage, `team-content/${teamId}/${contentType}/${fileName}`);
    
    const customMetadata = {
      ...metadata,
      uploadedAt: new Date().toISOString(),
      contentType: contentType
    };
    
    const snapshot = await uploadBytes(storageRef, file, { customMetadata });
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return { 
      url: downloadURL, 
      path: snapshot.ref.fullPath, 
      fileName,
      error: null 
    };
  } catch (error) {
    return { url: null, path: null, fileName: null, error: error.message };
  }
};

export const getTeamContent = async (teamId, contentType = '') => {
  try {
    const path = contentType 
      ? `team-content/${teamId}/${contentType}`
      : `team-content/${teamId}`;
    const listRef = ref(storage, path);
    const result = await listAll(listRef);
    
    const items = await Promise.all(
      result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        const metadata = await getMetadata(itemRef);
        return {
          name: itemRef.name,
          fullPath: itemRef.fullPath,
          url,
          metadata: metadata.customMetadata || {},
          size: metadata.size,
          contentType: metadata.contentType,
          timeCreated: metadata.timeCreated
        };
      })
    );
    
    return { items, folders: result.prefixes.map(p => p.name), error: null };
  } catch (error) {
    return { items: [], folders: [], error: error.message };
  }
};

export const deleteTeamContent = async (filePath) => {
  try {
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Utility functions
export const getFileMetadata = async (filePath) => {
  try {
    const storageRef = ref(storage, filePath);
    const metadata = await getMetadata(storageRef);
    return { metadata, error: null };
  } catch (error) {
    return { metadata: null, error: error.message };
  }
};

export const updateFileMetadata = async (filePath, metadata) => {
  try {
    const storageRef = ref(storage, filePath);
    const updatedMetadata = await updateMetadata(storageRef, metadata);
    return { metadata: updatedMetadata, error: null };
  } catch (error) {
    return { metadata: null, error: error.message };
  }
};