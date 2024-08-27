import {useState} from 'react';
import {StyleSheet, View, Alert} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {useSystem} from '@/powersync/system';
import React from 'react';
import {Button} from 'react-native-paper';
import {Image} from 'expo-image';

interface Props {
  size: number;
  url: string | null;
  onUpload: (filePath: string) => void;
  testID?: string;
}

export default function Avatar({url, size = 150, onUpload, testID}: Props) {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(url);
  const avatarSize = {height: size, width: size};

  const {supabaseConnector} = useSystem();

  async function uploadAvatar() {
    try {
      setUploading(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Restrict to only images
        allowsMultipleSelection: false, // Can only select one image
        allowsEditing: true, // Allows the user to crop / rotate their photo before uploading it
        quality: 1,
        exif: false, // We don't want nor need that data.
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('User cancelled image picker.');
        return;
      }

      const image = result.assets[0];
      console.log('Got image', image);

      if (!image.uri) {
        throw new Error('No image uri!'); // This should never happen
      }

      const arraybuffer = await fetch(image.uri).then(res => res.arrayBuffer());

      const fileExt = image.uri?.split('.').pop()?.toLowerCase() ?? 'jpeg';
      const path = `${Date.now()}.${fileExt}`;
      const {data: uploadData, error: uploadError} = await supabaseConnector.client.storage
        .from('avatars')
        .upload(path, arraybuffer, {
          contentType: image.mimeType ?? 'image/jpeg',
        });

      if (uploadError) {
        throw uploadError;
      }

      console.log('Uploaded image:', uploadData.path);

      // Get the public URL of the uploaded image
      const {data: urlData} = supabaseConnector.client.storage
        .from('avatars')
        .getPublicUrl(uploadData.path);

      if (urlData) {
        setAvatarUrl(urlData.publicUrl);
        onUpload(urlData.publicUrl);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      } else {
        throw error;
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <View>
      {avatarUrl ? (
        <Image
          testID={testID}
          source={{uri: avatarUrl}}
          accessibilityLabel="Avatar"
          style={[avatarSize, styles.avatar, styles.image]}
        />
      ) : (
        <View style={[avatarSize, styles.avatar, styles.noImage]} />
      )}
      <View style={styles.uploadBtn}>
        <Button mode="outlined" onPress={uploadAvatar} disabled={uploading}>
          {uploading ? 'Uploading ...' : 'Upload'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 100,
    overflow: 'hidden',
    maxWidth: '100%',
  },
  image: {
    objectFit: 'cover',
    paddingTop: 0,
  },
  noImage: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgb(200, 200, 200)',
    borderRadius: 5,
  },
  uploadBtn: {
    marginTop: 10,
  },
});
