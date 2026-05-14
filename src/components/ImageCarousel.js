import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { COLORS, RADIUS } from "../utils/theme";

const { width: SCREEN_W } = Dimensions.get("window");

// ─── Carrossel somente leitura (detalhe do evento) ───────────
export function PhotoCarousel({ photos, height = 260 }) {
  const [active, setActive] = useState(0);

  if (!photos || photos.length === 0) return null;

  return (
    <View style={{ height, backgroundColor: COLORS.bgCard }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
          setActive(idx);
        }}
      >
        {photos.map((uri, i) => (
          <Image
            key={i}
            source={{ uri }}
            style={{ width: SCREEN_W, height, resizeMode: "cover" }}
          />
        ))}
      </ScrollView>

      {/* Dots */}
      {photos.length > 1 && (
        <View style={s.dots}>
          {photos.map((_, i) => (
            <View key={i} style={[s.dot, i === active && s.dotActive]} />
          ))}
        </View>
      )}

      {/* Counter */}
      <View style={s.counter}>
        <Text style={s.counterText}>
          {active + 1}/{photos.length}
        </Text>
      </View>
    </View>
  );
}

// ─── Seletor de fotos editável (painel do estabelecimento) ───
export function PhotoManager({ photos = [], onAdd, onRemove, maxPhotos = 8 }) {
  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permissão necessária",
        "Permita o acesso à galeria para adicionar fotos.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.7,
      aspect: [16, 9],
    });
    if (!result.canceled && result.assets?.length > 0) {
      onAdd(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permissão necessária", "Permita o acesso à câmera.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      aspect: [16, 9],
    });
    if (!result.canceled && result.assets?.length > 0) {
      onAdd(result.assets[0].uri);
    }
  }

  function confirmRemove(idx) {
    Alert.alert("Remover foto", "Deseja remover esta foto?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: () => onRemove(idx) },
    ]);
  }

  function showAddOptions() {
    Alert.alert("Adicionar foto", "Escolha uma opção", [
      { text: "Galeria", onPress: pickImage },
      { text: "Câmera", onPress: takePhoto },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.photoRow}
      >
        {/* Existing photos */}
        {photos.map((uri, i) => (
          <View key={i} style={s.photoThumb}>
            <Image source={{ uri }} style={s.thumbImg} />
            <TouchableOpacity
              style={s.removeBtn}
              onPress={() => confirmRemove(i)}
            >
              <Ionicons name="close-circle" size={20} color="#fff" />
            </TouchableOpacity>
            {i === 0 && (
              <View style={s.coverLabel}>
                <Text style={s.coverText}>Capa</Text>
              </View>
            )}
          </View>
        ))}

        {/* Add button */}
        {photos.length < maxPhotos && (
          <TouchableOpacity style={s.addThumb} onPress={showAddOptions}>
            <Ionicons name="camera-outline" size={26} color={COLORS.primary} />
            <Text style={s.addThumbText}>
              {photos.length === 0 ? "Adicionar\nfoto" : "Mais\nfotos"}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {photos.length === 0 && (
        <Text style={s.hint}>
          A primeira foto será usada como capa do evento
        </Text>
      )}
    </View>
  );
}

// ─── Seletor inline para posts do feed ───────────────────────
export function PostPhotoSelector({ photos = [], onAdd, onRemove }) {
  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permissão necessária", "Permita o acesso à galeria.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.6,
    });
    if (!result.canceled && result.assets?.length > 0) {
      onAdd(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permissão necessária", "Permita o acesso à câmera.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (!result.canceled && result.assets?.length > 0) {
      onAdd(result.assets[0].uri);
    }
  }

  function showOptions() {
    Alert.alert("Adicionar foto", "", [
      { text: "Galeria", onPress: pickImage },
      { text: "Câmera", onPress: takePhoto },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  if (photos.length === 0) {
    return (
      <TouchableOpacity style={s.postPhotoBtn} onPress={showOptions}>
        <Ionicons name="camera-outline" size={18} color={COLORS.primary} />
        <Text style={s.postPhotoBtnText}>Adicionar foto</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ marginTop: 8 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {photos.map((uri, i) => (
          <View key={i} style={s.postPhotoThumb}>
            <Image source={{ uri }} style={s.postThumbImg} />
            <TouchableOpacity style={s.removeBtn} onPress={() => onRemove(i)}>
              <Ionicons name="close-circle" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
        {photos.length < 4 && (
          <TouchableOpacity style={s.addPostThumb} onPress={showOptions}>
            <Ionicons name="add" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  // Carousel
  dots: {
    position: "absolute",
    bottom: 12,
    flexDirection: "row",
    alignSelf: "center",
    gap: 5,
  },
  dot: {
    width: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  dotActive: { backgroundColor: "#fff", width: 28 },
  counter: {
    position: "absolute",
    bottom: 10,
    right: 14,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  counterText: { fontSize: 11, color: "#fff", fontWeight: "600" },

  // Photo manager
  photoRow: { gap: 10, paddingVertical: 4 },
  photoThumb: {
    width: 100,
    height: 75,
    borderRadius: RADIUS.md,
    overflow: "hidden",
    position: "relative",
  },
  thumbImg: { width: "100%", height: "100%", resizeMode: "cover" },
  removeBtn: {
    position: "absolute",
    top: 3,
    right: 3,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
  },
  coverLabel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(232,59,92,0.85)",
    paddingVertical: 3,
    alignItems: "center",
  },
  coverText: { fontSize: 10, color: "#fff", fontWeight: "700" },
  addThumb: {
    width: 100,
    height: 75,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgOverlay,
    borderWidth: 1.5,
    borderColor: COLORS.primary + "66",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  addThumbText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "600",
    textAlign: "center",
  },
  hint: { fontSize: 12, color: COLORS.textMuted, marginTop: 8 },

  // Post photo
  postPhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary + "18",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: COLORS.primary + "44",
    marginTop: 8,
  },
  postPhotoBtnText: { fontSize: 13, color: COLORS.primary, fontWeight: "600" },
  postPhotoThumb: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.md,
    overflow: "hidden",
    position: "relative",
  },
  postThumbImg: { width: "100%", height: "100%", resizeMode: "cover" },
  addPostThumb: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgOverlay,
    borderWidth: 1.5,
    borderColor: COLORS.primary + "66",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
});
