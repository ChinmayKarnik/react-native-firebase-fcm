import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';

const StorageScreen = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<Array<{url: string; path: string}>>([]);

  const selectFromGallery = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });

    if (result.assets && result.assets[0]) {
      uploadImage(result.assets[0].uri!);
    }
  };

  const takePhoto = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
    });

    if (result.assets && result.assets[0]) {
      uploadImage(result.assets[0].uri!);
    }
  };

  const uploadImage = async (uri: string) => {
    const userId = auth().currentUser?.uid;
    if (!userId) {
      Alert.alert('Error', 'Please sign in first');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create unique filename
      const filename = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
      const storageRef = storage().ref(`users/${userId}/photos/${filename}`);

      // Upload with progress tracking
      const task = storageRef.putFile(uri);

      task.on('state_changed', snapshot => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
        console.log(`Upload: ${progress.toFixed(0)}%`);
      });

      await task;

      // Get download URL
      const downloadURL = await storageRef.getDownloadURL();
      const fullPath = storageRef.fullPath;
      
      setImageUrl(downloadURL);
      setUploadedImages(prev => [{url: downloadURL, path: fullPath}, ...prev]);

      Alert.alert('Success', 'Photo uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      Alert.alert('Upload Error', `${error.code || 'Unknown'}: ${error.message || 'Failed to upload photo'}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteImage = async (url: string, path: string) => {
    try {
      const storageRef = storage().ref(path);
      await storageRef.delete();

      setUploadedImages(prev => prev.filter(img => img.url !== url));
      if (imageUrl === url) {
        setImageUrl(null);
      }

      Alert.alert('Success', 'Photo deleted');
    } catch (error: any) {
      console.error('Delete error:', error);
      Alert.alert('Delete Error', error.message || 'Failed to delete photo');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Cloud Storage Demo</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={selectFromGallery}
          disabled={uploading}>
          <Text style={styles.buttonText}>📷 Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={takePhoto}
          disabled={uploading}>
          <Text style={styles.buttonText}>📸 Camera</Text>
        </TouchableOpacity>
      </View>

      {uploading && (
        <View style={styles.progressContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.progressText}>
            Uploading: {uploadProgress.toFixed(0)}%
          </Text>
        </View>
      )}

      {imageUrl && uploadedImages[0] && (
        <View style={styles.imageContainer}>
          <Text style={styles.sectionTitle}>Last Uploaded:</Text>
          <Image source={{uri: imageUrl}} style={styles.image} />
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteImage(uploadedImages[0].url, uploadedImages[0].path)}>
            <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {uploadedImages.length > 0 && (
        <View style={styles.galleryContainer}>
          <Text style={styles.sectionTitle}>All Uploaded Photos:</Text>
          {uploadedImages.map((item, index) => (
            <View key={index} style={styles.galleryItem}>
              <Image source={{uri: item.url}} style={styles.thumbnailImage} />
              <TouchableOpacity
                style={styles.smallDeleteButton}
                onPress={() => deleteImage(item.url, item.path)}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>How it works:</Text>
        <Text style={styles.infoText}>
          1. Select photo from gallery or take with camera
        </Text>
        <Text style={styles.infoText}>
          2. Photo uploads to Firebase Storage
        </Text>
        <Text style={styles.infoText}>
          3. Progress tracked in real-time
        </Text>
        <Text style={styles.infoText}>
          4. Download URL generated for display
        </Text>
        <Text style={styles.infoText}>
          5. Photos stored at: users/[userId]/photos/
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FF6B35',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  progressText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  imageContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: '#E63946',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  galleryContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  galleryItem: {
    marginBottom: 15,
  },
  thumbnailImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  smallDeleteButton: {
    backgroundColor: '#E63946',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  infoContainer: {
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});

export default StorageScreen;
