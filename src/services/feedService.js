import { supabase } from '../lib/supabase';

export const feedService = {
  async getAll() {
    const { data, error } = await supabase
      .from('feed_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) return { data: null, error };
    return { data: data.map(_mapPost), error: null };
  },

  async getByEvent(eventId) {
    const { data, error } = await supabase
      .from('feed_posts')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });
    if (error) return { data: null, error };
    return { data: data.map(_mapPost), error: null };
  },

  async create(post, user) {
    const { data, error } = await supabase
      .from('feed_posts')
      .insert({
        event_id: post.eventId,
        event_name: post.eventName,
        user_id: user.id,
        user_name: user.name.split(' ')[0],
        user_initials: user.avatar,
        user_color: '#9FE1CB',
        text: post.text,
        tag: post.tag,
        type: post.type,
        verified: post.verified ?? false,
      })
      .select()
      .single();
    if (error) return { data: null, error };
    return { data: _mapPost(data), error: null };
  },

  async like(postId) {
    const { data: post } = await supabase
      .from('feed_posts')
      .select('likes')
      .eq('id', postId)
      .single();
    if (!post) return;
    await supabase.from('feed_posts').update({ likes: post.likes + 1 }).eq('id', postId);
  },

  // Realtime subscription
  subscribe(callback) {
    return supabase
      .channel('feed_posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed_posts' }, payload => {
        callback(_mapPost(payload.new));
      })
      .subscribe();
  },
};

function _mapPost(d) {
  const timeAgo = Math.floor((Date.now() - new Date(d.created_at).getTime()) / 60000);
  return {
    id: d.id,
    eventId: d.event_id,
    eventName: d.event_name,
    user: {
      name: d.user_name,
      initials: d.user_initials,
      color: d.user_color ?? '#9FE1CB',
      textColor: '#04342C',
    },
    text: d.text,
    tag: d.tag,
    type: d.type ?? 'geral',
    likes: d.likes ?? 0,
    replies: d.replies ?? 0,
    verified: d.verified ?? false,
    time: timeAgo === 0 ? 'agora mesmo' : `há ${timeAgo} min`,
    timeAgo,
  };
}
