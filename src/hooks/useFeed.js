import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { usePermissions } from './usePermissions';
import { feedValidationService } from '../services/feed/FeedValidationService';
import { FeedFilterService } from '../services/feed/FeedFilterService';
import { feedService } from '../services/feedService';

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

  // ── Evento atual (Observer de posição) ────────────────────────────────
  const [currentEvent, setCurrentEvent] = useState(null);

  useEffect(() => {
    const found = feedValidationService.findCurrentEvent(
      userCoords,
      events,
      currentUser?.role,
    );
    setCurrentEvent(found);
  }, [userCoords, events, currentUser?.role]);

  // ── Paginação por cursor ───────────────────────────────────────────────
  const [extraPosts, setExtraPosts]     = useState([]);
  const [hasMore, setHasMore]           = useState(true);
  const [loadingMore, setLoadingMore]   = useState(false);
  const cursorRef  = useRef(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (feedPosts.length > 0 && cursorRef.current === null) {
      cursorRef.current = feedPosts[feedPosts.length - 1].createdAt ?? null;
    }
  }, [feedPosts]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoadingMore(true);
    try {
      const { data, nextCursor, error } = await feedService.getPaged(
        cursorRef.current,
        20,
      );
      if (!error && data?.length) {
        setExtraPosts((prev) => [...prev, ...data]);
        cursorRef.current = nextCursor;
        if (!nextCursor) setHasMore(false);
      } else {
        setHasMore(false);
      }
    } finally {
      loadingRef.current = false;
      setLoadingMore(false);
    }
  }, [hasMore]);

  // ── Posts filtrados por papel e localização ───────────────────────────
  const posts = useMemo(() => {
    if (currentUser?.role === 'business') {
      const ownerIds = events
        .filter((e) => e.ownerId === currentUser.id)
        .map((e) => e.id);
      return FeedFilterService.filterForBusiness(feedPosts, ownerIds);
    }
    return FeedFilterService.filterForUser(
      feedPosts,
      currentEvent?.id ?? null,
      nearbyEventIds,
    );
  }, [feedPosts, currentEvent, nearbyEventIds, events, currentUser]);

  const extraFiltered = useMemo(() => {
    if (!extraPosts.length) return [];
    if (currentUser?.role === 'business') {
      const ownerIds = events
        .filter((e) => e.ownerId === currentUser.id)
        .map((e) => e.id);
      return FeedFilterService.filterForBusiness(extraPosts, ownerIds);
    }
    return FeedFilterService.filterForUser(
      extraPosts,
      currentEvent?.id ?? null,
      nearbyEventIds,
    );
  }, [extraPosts, currentEvent, nearbyEventIds, events, currentUser]);

  const allPosts = useMemo(
    () => [...posts, ...extraFiltered],
    [posts, extraFiltered],
  );

  // ── Rótulo de contexto ────────────────────────────────────────────────
  const contextLabel = useMemo(
    () => FeedFilterService.feedContextLabel(currentEvent, nearbyEventIds, currentUser?.role),
    [currentEvent, nearbyEventIds, currentUser?.role],
  );

  // ── Validação e envio de post ─────────────────────────────────────────
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

  // ── Rótulo de expiração por post ──────────────────────────────────────
  const getTimeLeft = useCallback(
    (post) => feedValidationService.formatTimeLeft(post.expiresAt),
    [],
  );

  return {
    posts: allPosts,
    currentEvent,
    contextLabel,
    canPost: perms.canPostToFeed(),
    submitPost,
    likePost,
    dislikePost,
    getTimeLeft,
    loadMore,
    hasMore,
    loadingMore,
  };
}
