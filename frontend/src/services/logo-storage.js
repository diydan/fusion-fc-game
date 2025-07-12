import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/config/firebase';

// Store generated logos in Firebase Storage
export const saveGeneratedLogo = async (userId, logoBlob, logoData) => {
  try {
    const timestamp = Date.now();
    const fileName = `logo_${timestamp}_${logoData.businessName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    const storageRef = ref(storage, `generated-logos/${userId}/${fileName}`);
    
    const metadata = {
      customMetadata: {
        businessName: logoData.businessName,
        businessType: logoData.businessType,
        style: logoData.style || '',
        colors: logoData.colors || '',
        provider: logoData.provider,
        prompt: logoData.prompt,
        generatedAt: new Date().toISOString()
      }
    };
    
    const snapshot = await uploadBytes(storageRef, logoBlob, metadata);
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

// Get user's generated logos
export const getUserLogos = async (userId) => {
  try {
    const { listAll } = await import('firebase/storage');
    const listRef = ref(storage, `generated-logos/${userId}`);
    const result = await listAll(listRef);
    
    const logos = await Promise.all(
      result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        const { getMetadata } = await import('firebase/storage');
        const metadata = await getMetadata(itemRef);
        return {
          name: itemRef.name,
          fullPath: itemRef.fullPath,
          url,
          metadata: metadata.customMetadata || {},
          size: metadata.size,
          timeCreated: metadata.timeCreated
        };
      })
    );
    
    return { logos, error: null };
  } catch (error) {
    return { logos: [], error: error.message };
  }
};

// Delete a stored logo
export const deleteGeneratedLogo = async (filePath) => {
  try {
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Download logo from AI provider and convert to blob
export const downloadLogoAsBlob = async (logoUrl) => {
  try {
    const response = await fetch(logoUrl);
    if (!response.ok) {
      throw new Error(`Failed to download logo: ${response.statusText}`);
    }
    const blob = await response.blob();
    return { blob, error: null };
  } catch (error) {
    return { blob: null, error: error.message };
  }
};
