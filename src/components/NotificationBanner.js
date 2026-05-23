import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notificationService } from '../services/notifications/NotificationService';
import { COLORS } from '../utils/theme';

const DISPLAY_MS   = 4000;
const SLIDE_IN_MS  = 350;
const SLIDE_OUT_MS = 280;

export function NotificationBanner() {
  const [current, setCurrent] = useState(null);
  const pendingRef = useRef([]);
  const shownIds   = useRef(new Set());
  const slideY     = useRef(new Animated.Value(-120)).current;
  const timer      = useRef(null);
  const insets     = useSafeAreaInsets();

  useEffect(() => {
    const unsub = notificationService.subscribe(notifications => {
      const fresh = notifications.filter(
        n => !n.read && !shownIds.current.has(n.id),
      );
      if (fresh.length === 0) return;

      const high   = fresh.filter(n => n.priority === 'high');
      const normal = fresh.filter(n => n.priority !== 'high');
      const toAdd  = [...high, ...normal].filter(
        n => !pendingRef.current.find(p => p.id === n.id),
      );

      pendingRef.current = [...pendingRef.current, ...toAdd];
      showNext();
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function showNext() {
    setCurrent(prev => {
      if (prev !== null) return prev;
      return dequeue();
    });
  }

  function dequeue() {
    if (pendingRef.current.length === 0) return null;
    const [next, ...rest] = pendingRef.current;
    pendingRef.current = rest;
    shownIds.current.add(next.id);
    return next;
  }

  useEffect(() => {
    if (!current) return;

    slideY.setValue(-120);
    Animated.spring(slideY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();

    timer.current = setTimeout(dismiss, DISPLAY_MS);
    return () => clearTimeout(timer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  function dismiss() {
    clearTimeout(timer.current);
    Animated.timing(slideY, {
      toValue: -120,
      duration: SLIDE_OUT_MS,
      useNativeDriver: true,
    }).start(() => {
      if (current) notificationService.markRead(current.id);
      const next = dequeue();
      setCurrent(next);
    });
  }

  if (!current) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 8, transform: [{ translateY: slideY }] },
      ]}
    >
      <Pressable onPress={dismiss} style={styles.inner} android_ripple={null}>
        <View style={[styles.iconWrap, { backgroundColor: `${current.color}22` }]}>
          <Ionicons name={current.icon} size={20} color={current.color} />
        </View>

        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={1}>{current.title}</Text>
          <Text style={styles.body}  numberOfLines={2}>{current.body}</Text>
        </View>

        <Ionicons name="close" size={16} color={COLORS.textMuted} style={styles.close} />
      </Pressable>

      {current.priority === 'high' && (
        <View style={[styles.priorityStripe, { backgroundColor: current.color }]} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position:    'absolute',
    left:        16,
    right:       16,
    zIndex:      9999,
    elevation:   20,
    borderRadius: 14,
    backgroundColor: '#1C2033',
    borderWidth: 1,
    borderColor: '#1E2540',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    overflow:    'hidden',
  },
  inner: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  iconWrap: {
    width:          40,
    height:         40,
    borderRadius:   20,
    alignItems:     'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize:    13,
    fontWeight:  '700',
    color:       '#F1F5F9',
    marginBottom: 2,
  },
  body: {
    fontSize:   12,
    color:      '#94A3B8',
    lineHeight: 16,
  },
  close: {
    padding: 4,
  },
  priorityStripe: {
    position: 'absolute',
    left:     0,
    top:      0,
    bottom:   0,
    width:    3,
    borderTopLeftRadius:    14,
    borderBottomLeftRadius: 14,
  },
});
