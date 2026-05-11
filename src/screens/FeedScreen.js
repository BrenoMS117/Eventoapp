import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

const { width } = Dimensions.get('window');

const HEAT_COLORS = {
  BLAZING: '#FF4500', HOT: '#E83B5C', WARM: '#F59E0B', COOL: '#3B82F6',
};

const POST_TYPES = [
  { key: 'geral', label: 'Geral', icon: '💬' },
  { key: 'lotacao', label: 'Crowd', icon: '👥' },
  { key: 'dica', label: 'Tip', icon: '💡' },
  { key: 'alerta', label: 'Alert', icon: '⚡' },
  { key: 'acessibilidade', label: 'Access', icon: '♿' },
];

function VibeMini({ value }) {
  const color = value > 70 ? COLORS.primary : value > 40 ? COLORS.purple : '#3B82F6';
  return (
    <View style={{ height: 4, width: 60, backgroundColor: COLORS.bgOverlay, borderRadius: 2, overflow: 'hidden' }}>
      <View style={{ height: '100%', width: `${value}%`, backgroundColor: color, borderRadius: 2 }} />
    </View>
  );
}

function PostCard({ post, onLike }) {
  const heatColor = HEAT_COLORS[post.heatLevel] || COLORS.primary;
  return (
    <View style={s.postCard}>
      {/* Heat level tag */}
      {post.heatLevel && (
        <View style={[s.heatTag, { backgroundColor: heatColor }]}>
          <Text style={s.heatTagText}>HEAT LEVEL: {post.heatLevel} 🔥</Text>
        </View>
      )}

      {/* Image placeholder area */}
      <View style={[s.postImageArea, { backgroundColor: post.user.color + '33' }]}>
        <Text style={{ fontSize: 32 }}>
          {post.type === 'alerta' ? '⚡' : post.type === 'dica' ? '💡' : '🎵'}
        </Text>
      </View>

      {/* Footer */}
      <View style={s.postFooter}>
        <View style={s.postUser}>
          <View style={[s.avatar, { backgroundColor: post.user.color }]}>
            <Text style={s.avatarText}>{post.user.initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.userName}>{post.user.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="location-outline" size={10} color={COLORS.textMuted} />
              <Text style={s.userLocation}>{post.eventName}</Text>
            </View>
          </View>
          <TouchableOpacity style={s.locationPin}>
            <Ionicons name="location" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {post.text ? <Text style={s.postText} numberOfLines={2}>{post.text}</Text> : null}

        <View style={s.postActions}>
          <TouchableOpacity style={s.actionBtn} onPress={() => onLike(post.id)}>
            <View style={s.actionBubble}>
              <Text style={{ fontSize: 18 }}>❤️</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn}>
            <View style={s.actionBubble}>
              <Text style={{ fontSize: 18 }}>⭐</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn}>
            <View style={[s.actionBubble, { backgroundColor: COLORS.primary + '33' }]}>
              <Text style={{ fontSize: 18 }}>🔥</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const { feedPosts, events, addFeedPost, likePost, nearbyEventIds, logout } = useApp();
  const [composing, setComposing] = useState(false);
  const [newText, setNewText] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedType, setSelectedType] = useState('geral');
  const [textErr, setTextErr] = useState('');

  function submitPost() {
    if (!newText.trim() || newText.trim().length < 3) { setTextErr('Mínimo 3 caracteres.'); return; }
    if (!selectedEvent) { setTextErr('Selecione um evento.'); return; }
    addFeedPost({
      eventId: selectedEvent.id,
      eventName: selectedEvent.name,
      text: newText.trim(),
      tag: `#${POST_TYPES.find(t => t.key === selectedType)?.label || 'Geral'}`,
      type: selectedType,
    });
    setNewText(''); setComposing(false); setSelectedEvent(null); setSelectedType('geral'); setTextErr('');
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="pulse" size={18} color={COLORS.primary} />
          <Text style={s.logo}>LiveVibe</Text>
        </View>
        <Text style={s.headerTitle}>Community</Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <TouchableOpacity style={s.postBtn} onPress={() => setComposing(v => !v)}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={s.postBtnText}>Post</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={() => Alert.alert('Sair?', '', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sair', onPress: logout }])}>
            <Ionicons name="person-circle-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Composer */}
      {composing && (
        <View style={s.composer}>
          <Text style={s.composerLabel}>Evento</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            {events.filter(e => e.isLive || nearbyEventIds.includes(e.id)).map(e => (
              <TouchableOpacity key={e.id}
                style={[s.eventChip, selectedEvent?.id === e.id && s.eventChipOn]}
                onPress={() => { setSelectedEvent(e); setTextErr(''); }}>
                <Text style={[s.eventChipText, selectedEvent?.id === e.id && { color: '#fff' }]} numberOfLines={1}>{e.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={s.composerLabel}>Tipo</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {POST_TYPES.map(t => (
              <TouchableOpacity key={t.key}
                style={[s.typeChip, selectedType === t.key && s.typeChipOn]}
                onPress={() => setSelectedType(t.key)}>
                <Text style={[s.typeChipText, selectedType === t.key && { color: '#fff' }]}>{t.icon} {t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[s.composerInput, textErr && { borderColor: COLORS.danger }]}
            placeholder="O que está acontecendo agora?"
            placeholderTextColor={COLORS.textMuted}
            value={newText}
            onChangeText={v => { setNewText(v); setTextErr(''); }}
            multiline autoFocus maxLength={280}
          />
          {textErr ? <Text style={s.errText}>{textErr}</Text> : null}
          <Text style={s.charCount}>{newText.length}/280</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => { setComposing(false); setTextErr(''); }}>
              <Text style={{ fontSize: 14, color: COLORS.textSub }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.submitBtn} onPress={submitPost}>
              <Text style={{ fontSize: 14, color: '#fff', fontWeight: '700' }}>Publicar →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[s.sectionTitle, { paddingHorizontal: 16, marginBottom: 14 }]}>Community Feed</Text>

        {/* Vibe tag tooltip hint */}
        <View style={s.vibeTagHint}>
          <Text style={s.vibeTagText}>Vibe Tag</Text>
        </View>

        {/* Posts grid */}
        <View style={s.postsGrid}>
          {feedPosts.map(post => (
            <View key={post.id} style={s.postWrapper}>
              <PostCard post={post} onLike={likePost} />
            </View>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_W = (width - 48) / 2;

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  logo: { fontSize: 16, fontWeight: '900', color: COLORS.text },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  iconBtn: { padding: 4 },
  postBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.full },
  postBtnText: { fontSize: 13, color: '#fff', fontWeight: '700' },

  composer: { backgroundColor: COLORS.bgCard, padding: 14, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  composerLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  eventChip: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.bgOverlay, borderRadius: RADIUS.full, marginRight: 8, borderWidth: 0.5, borderColor: COLORS.border },
  eventChipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  eventChipText: { fontSize: 12, color: COLORS.textSub, fontWeight: '500' },
  typeChip: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: COLORS.bgOverlay, borderRadius: RADIUS.full, borderWidth: 0.5, borderColor: COLORS.border },
  typeChipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeChipText: { fontSize: 12, color: COLORS.textSub },
  composerInput: { backgroundColor: COLORS.bgOverlay, borderRadius: RADIUS.md, padding: 12, fontSize: 14, color: COLORS.text, minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: COLORS.border },
  errText: { fontSize: 12, color: COLORS.danger, marginTop: 4 },
  charCount: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right', marginTop: 4 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: RADIUS.md, borderWidth: 0.5, borderColor: COLORS.border },
  submitBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 9, borderRadius: RADIUS.md },

  sectionTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  vibeTagHint: { alignSelf: 'center', backgroundColor: COLORS.bgCard, paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.lg, marginBottom: 12, borderWidth: 0.5, borderColor: COLORS.border },
  vibeTagText: { fontSize: 13, fontWeight: '600', color: COLORS.text },

  postsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 14 },
  postWrapper: { width: CARD_W },

  postCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.sm },
  heatTag: { paddingHorizontal: 10, paddingVertical: 6 },
  heatTagText: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  postImageArea: { height: 160, justifyContent: 'center', alignItems: 'center' },
  postFooter: { padding: 10 },
  postUser: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  avatar: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  userName: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  userLocation: { fontSize: 10, color: COLORS.textMuted },
  locationPin: { padding: 2 },
  postText: { fontSize: 12, color: COLORS.textSub, lineHeight: 17, marginBottom: 8 },
  postActions: { flexDirection: 'row', gap: 6 },
  actionBtn: {},
  actionBubble: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.bgOverlay, justifyContent: 'center', alignItems: 'center' },
});
