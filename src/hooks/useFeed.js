import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { usePermissions } from './usePermissions';
import { feedValidationService } from '../services/feed/FeedValidationService';
import { FeedFilterService } from '../services/feed/FeedFilterService';

/**
 * useFeed — hook que orquestra todo o módulo de Posts.
 *
 * Padrão Observer: assina `userCoords` e `events` do AppContext.
 * Quando a posição muda, FeedValidationService recalcula o `currentEvent`
 * sem que FeedScreen precise conhecer nenhum detalhe de geolocalização.
 *
 * Separação de responsabilidades:
 *   FeedValidationService → sabe se o usuário PODE postar (onde ele está)
 *   FeedFilterService     → sabe O QUE mostrar (filtragem por papel/geo)
 *   useFeed               → orquestra os dois e expõe uma API limpa
 *   FeedScreen            → só renderiza o que useFeed retorna
 */
export function useFeed() {
  const {
    feedPosts,
    events,
    nearbyEventIds,
    userCoords,
    currentUser,
    addFeedPost,
    likePost,
    dislikePost,
  } = useApp();

  const perms = usePermissions();

  // ── Observer: recalcula evento atual quando a posição muda ────────────
  const [currentEvent, setCurrentEvent] = useState(null);

  useEffect(() => {
    const found = feedValidationService.findCurrentEvent(
      userCoords,
      events,
      currentUser?.role,
    );
    setCurrentEvent(found);
  }, [userCoords, events, currentUser?.role]);

  // ── Feed inteligente filtrado por papel e localização ─────────────────
  const posts = useMemo(() => {
    if (currentUser?.role === 'business') {
      const ownerIds = events
        .filter(e => e.ownerId === currentUser.id)
        .map(e => e.id);
      return FeedFilterService.filterForBusiness(feedPosts, ownerIds);
    }
    return FeedFilterService.filterForUser(
      feedPosts,
      currentEvent?.id ?? null,
      nearbyEventIds,
    );
  }, [feedPosts, currentEvent, nearbyEventIds, events, currentUser]);

  // ── Label de contexto para o header do feed ───────────────────────────
  const contextLabel = useMemo(
    () => FeedFilterService.feedContextLabel(currentEvent, nearbyEventIds, currentUser?.role),
    [currentEvent, nearbyEventIds, currentUser?.role],
  );

  // ── Validação de postagem (geofence) ──────────────────────────────────
  /**
   * Valida localização e persiste o post se aprovado.
   * @param {{ event, text, photos, tag, type }} postData
   * @returns {{ success: boolean, error: string | null }}
   */
  const submitPost = useCallback(async (postData) => {
    if (!perms.canPostToFeed()) {
      return { success: false, error: 'Seu perfil não permite criar posts.' };
    }

    const validation = feedValidationService.validatePostPermission(
      userCoords,
      postData.event,
      currentUser?.role,
    );
    if (!validation.allowed) {
      return { success: false, error: validation.reason };
    }

    const expiresAt = feedValidationService.calculateExpiry(postData.event);

    await addFeedPost({
      eventId: postData.event.id,
      eventName: postData.event.name,
      text: postData.text,
      photos: postData.photos,
      tag: postData.tag,
      type: postData.type,
      verified: nearbyEventIds.includes(postData.event.id),
      expiresAt,
    });

    return { success: true, error: null };
  }, [perms, userCoords, currentUser?.role, nearbyEventIds, addFeedPost]);

  // ── TTL label por post ────────────────────────────────────────────────
  const getTimeLeft = useCallback(
    (post) => feedValidationService.formatTimeLeft(post.expiresAt),
    [],
  );

  return {
    posts,
    currentEvent,
    contextLabel,
    canPost: perms.canPostToFeed(),
    submitPost,
    likePost,
    dislikePost,
    getTimeLeft,
  };
}
