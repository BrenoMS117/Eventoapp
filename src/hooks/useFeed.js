import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { usePermissions } from './usePermissions';
import { feedValidationService } from '../services/feed/FeedValidationService';
import { FeedFilterService } from '../services/feed/FeedFilterService';
import { feedService } from '../services/feedService';

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
 *   useFeed               → orquestra os dois, expõe API limpa + paginação
 *   FeedScreen            → só renderiza o que useFeed retorna
 *
 * Paginação por cursor:
 *   - Posts iniciais (até 30) vêm do AppContext via feedService.getAll()
 *   - Posts adicionais vêm de feedService.getPaged(cursor) ao rolar até o fim
 *   - cursor = created_at do post mais antigo já carregado
 *   - Não há sobreposição: AppContext traz os mais novos, getPaged traz os mais antigos
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

  // ── Paginação por cursor ───────────────────────────────────────────────
  /** Posts carregados além da janela inicial do AppContext */
  const [extraPosts, setExtraPosts] = useState([]);
  const [hasMore, setHasMore]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  /**
   * created_at do post mais antigo já exibido.
   * Inicializado a partir do último post do AppContext no primeiro render
   * com dados disponíveis; atualizado a cada página carregada.
   */
  const cursorRef    = useRef(null);
  /** Guard: impede chamadas simultâneas a loadMore */
  const loadingRef   = useRef(false);

  // Inicializa o cursor quando feedPosts do AppContext chegam pela primeira vez
  useEffect(() => {
    if (feedPosts.length > 0 && cursorRef.current === null) {
      // feedPosts está ordenado por created_at DESC → o último é o mais antigo
      cursorRef.current = feedPosts[feedPosts.length - 1].createdAt ?? null;
    }
  }, [feedPosts]);

  /**
   * Carrega a próxima página de posts.
   * Chamado pelo FeedScreen quando o usuário chega perto do fim da lista.
   */
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
        // Sem dados ou erro → não há mais páginas
        setHasMore(false);
      }
    } finally {
      loadingRef.current = false;
      setLoadingMore(false);
    }
  }, [hasMore]);

  // ── Feed inteligente filtrado por papel e localização ─────────────────
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

  // ── Posts adicionais filtrados (páginas 2, 3, ...) ────────────────────
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

  /** Lista completa para exibição: posts recentes (AppContext) + extras (paginados) */
  const allPosts = useMemo(
    () => [...posts, ...extraFiltered],
    [posts, extraFiltered],
  );

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
    posts: allPosts,
    currentEvent,
    contextLabel,
    canPost: perms.canPostToFeed(),
    submitPost,
    likePost,
    dislikePost,
    getTimeLeft,
    // Paginação
    loadMore,
    hasMore,
    loadingMore,
  };
}
