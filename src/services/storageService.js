import * as ImagePicker from 'expo-image-picker';
// src/services/storageService.js
import { supabase } from '../lib/supabase';

export const storageService = {
  async uploadEventPhoto(uri, userId) {
    try {
      const ext = uri.split('.').pop()?.split('?')[0] ?? 'jpg';
      const fileName = `${userId}/${Date.now()}.${ext}`;

      const response = await fetch(uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('event-photos')
        .upload(fileName, blob, {
          contentType: `image/${ext}`,
          upsert: false,
        });

      if (uploadError) return { url: null, error: uploadError.message };

      const { data } = supabase.storage
        .from('event-photos')
        .getPublicUrl(fileName);

      return { url: data.publicUrl, error: null };
    } catch (e) {
      return { url: null, error: 'Erro ao fazer upload.' };
    }
  },

  async saveEventPhotos(eventId, photoUrls) {
    const { error } = await supabase
      .from('events')
      .update({ photos: photoUrls })
      .eq('id', eventId);
    return { error };
  },
};