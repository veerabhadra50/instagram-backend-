import {
  fetchAccountData,
  fetchAccountDataV2,
  fetchPosts,
  fetchAllPosts,
  fetchAllReels,
  fetchReels,
  fetchStories,
  fetchHighlights,
  fetchHighlightStories,
  fetchTaggedPosts,
  fetchFollowers,
  fetchFollowersV2,
  fetchUserAbout,
  fetchSimilarAccounts,
  fetchMediaDataV2,
  fetchMediaDataV2ById,
  fetchMediaData,
  fetchMediaCodeOrId,
  fetchPostTitle,
  fetchPostLikers,
  fetchPostComments,
  fetchChildComments,
  searchHashtag,
  searchInstagram,
  post,
} from "../services/instagram.service.js";

import { cleanUsername } from "../utils/validator.js";

const handle = (fn) => async (req, res) => {
  try {
    const data = await fn(req);
    res.json(data);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};

const handleLong = (fn) => async (req, res) => {
  // Keep connection alive during long pagination requests
  req.socket.setTimeout(300000);
  res.setTimeout(300000);
  try {
    const data = await fn(req);
    res.json(data);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};

const getMediaCode = (item) =>
  item.code || item.shortcode || item.media_code || null

const enrichWithMediaData = async (items) => {
  const BATCH = 5
  const results = [...items]
  for (let i = 0; i < results.length; i += BATCH) {
    const batch = results.slice(i, i + BATCH)
    await Promise.all(batch.map(async (item, idx) => {
      // Skip images — Instagram doesn't provide view counts for photos
      if (item.media_type === 'image') return
      try {
        const code = getMediaCode(item)
        if (!code) return
        const d = await fetchMediaDataV2(code)
        results[i + idx] = {
          ...item,
          views: d.video_play_count || d.video_view_count || d.play_count || item.views || 0,
          likes: d.edge_media_preview_like?.count || d.like_count || item.likes || 0,
          comments: d.edge_media_to_parent_comment?.count || d.comment_count || item.comments || 0,
          shares: 0,
        }
      } catch { /* keep original */ }
    }))
  }
  return results
}

const getThumbnail = (item) => {
  const candidates = item.image_versions2?.candidates;
  return candidates?.[0]?.url || item.thumbnail_url || item.display_url || "";
};

export const getAnalytics = handle(async (req) => {
  const username = cleanUsername(req.params.username);
  const igUrl = `https://www.instagram.com/${username}/`;

  // Fetch profile + posts + reels + profileV2 in parallel
  const [profileData, postsData, reelsData, profileV2Data] = await Promise.all([
    fetchAccountData(igUrl),
    fetchPosts(igUrl),
    fetchReels(igUrl),
    fetchAccountDataV2(igUrl).catch(() => ({})),
  ]);

  // ig_get_fb_profile.php returns fields directly at root level
  const profile = profileData || {};
  const profileV2 = profileV2Data?.data?.user || profileV2Data?.user || profileV2Data || {};

  // Fallback: get pic from posts user object
  const postUser = (postsData.posts || [])[0]?.node?.user || {};

  const rawPosts = (postsData.posts || []).map((i) => i.node || i);
  const rawReels = (reelsData.reels || []).map((i) => (i.node?.media) || i.node || i);

  const posts = rawPosts.map((item) => ({
    id: item.id || item.pk,
    code: item.code || item.shortcode || null,
    thumbnail: getThumbnail(item),
    likes: item.like_count || 0,
    comments: item.comment_count || 0,
    views: item.video_play_count || item.play_count || item.view_count || 0,
    shares: 0,
    media_type: item.product_type === 'clips' ? 'reel' : 'image',
    date: item.taken_at ? new Date(item.taken_at * 1000).toISOString().split('T')[0] : "",
  }))

  const reels = rawReels.map((item) => ({
    id: item.id || item.pk,
    code: item.code || item.shortcode || null,
    thumbnail: getThumbnail(item),
    likes: item.like_count || 0,
    views: item.video_play_count || item.play_count || item.view_count || 0,
    comments: item.comment_count || 0,
    shares: 0,
    media_type: 'reel',
    date: item.taken_at ? new Date(item.taken_at * 1000).toISOString().split('T')[0] : "",
  }))

  const imagePosts = posts.filter(p => p.media_type === 'image')
  const videoInPosts = posts.filter(p => p.media_type === 'reel')

  const avgLikes = posts.length ? Math.round(posts.reduce((s, p) => s + p.likes, 0) / posts.length) : 0;
  const avgComments = posts.length ? Math.round(posts.reduce((s, p) => s + p.comments, 0) / posts.length) : 0;
  const avgReelViews = reels.length ? Math.round(reels.reduce((s, r) => s + r.views, 0) / reels.length) : 0;

  console.log("=== PROFILE V2 RAW ===", JSON.stringify(profileV2, null, 2));
  console.log("=== PROFILE RAW ===", JSON.stringify(profile, null, 2));

  return {
    username: profile.username || postUser.username || username,
    full_name: profile.full_name || postUser.full_name || "",
    biography: profile.biography || "",
    followers: profile.follower_count || 0,
    following: profile.following_count || 0,
    posts_count: profile.media_count || 0,
    is_private: profile.is_private || false,
    is_business: profile.is_business || false,
    is_creator: profile.is_creator || false,
    profile_pic: profile.profile_pic_url || profile.hd_profile_pic_url_info?.url || postUser.hd_profile_pic_url_info?.url || postUser.profile_pic_url || "",
    reels_count: reels.length || profileV2.total_clips_count || profile.total_clips_count || 0,
    collab_count: profile.collab_media_count || 0,
    avg_likes: avgLikes,
    avg_comments: avgComments,
    avg_reel_views: avgReelViews,
    images_count: imagePosts.length,
    videos_in_posts: videoInPosts.length,
    posts,
    reels,
  };
});

export const enrichMedia = handle(async (req) => {
  const { items } = req.body
  if (!items || !items.length) return { items: [] }
  const enriched = await enrichWithMediaData(items)
  return { items: enriched }
})

export const getAllPostsReels = async (req, res) => {
  const username = cleanUsername(req.params.username)
  const igUrl = `https://www.instagram.com/${username}/`

  // SSE headers — keeps connection alive during long pagination
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  try {
    const profileData = await fetchAccountData(igUrl).catch(() => ({}))
    const mediaCount = profileData.media_count || 500

    const posts = [], reels = [], seenIds = new Set()

    // Paginate posts
    let token = '', page = 0
    while (page < 75) {
      try {
        const r = await post('/get_ig_user_posts.php', { username_or_url: igUrl, amount: '35', pagination_token: token })
        const items = r.posts || []
        for (const i of items) {
          const item = i.node || i
          const id = String(item.id || item.pk || '')
          if (!id || seenIds.has(id)) continue
          seenIds.add(id)
          const isReel = item.product_type === 'clips' || item.media_type === 2
          const date = item.taken_at ? new Date(item.taken_at * 1000).toISOString().split('T')[0] : ''
          const entry = { id, code: item.code || item.shortcode || null, likes: item.like_count || 0, comments: item.comment_count || 0, views: item.video_play_count || item.play_count || 0, shares: 0, media_type: isReel ? 'reel' : 'image', date }
          if (isReel) reels.push(entry); else posts.push(entry)
        }
        send({ type: 'progress', posts: posts.length, reels: reels.length })
        token = r.pagination_token || ''
        page++
        if (!token || items.length === 0 || (posts.length + reels.length) >= mediaCount) break
        await new Promise(r => setTimeout(r, 150))
      } catch { break }
    }

    // Paginate reels for view counts
    token = ''; page = 0
    while (page < 75) {
      try {
        const r = await post('/get_ig_user_reels.php', { username_or_url: igUrl, amount: '35', pagination_token: token })
        const items = r.reels || []
        for (const i of items) {
          const item = (i.node?.media) || i.node || i
          const id = String(item.id || item.pk || '')
          const views = item.video_play_count || item.play_count || item.view_count || 0
          const existing = reels.find(r => r.id === id)
          if (existing) { existing.views = views || existing.views; continue }
          if (seenIds.has(id)) continue
          seenIds.add(id)
          const date = item.taken_at ? new Date(item.taken_at * 1000).toISOString().split('T')[0] : ''
          reels.push({ id, code: item.code || item.shortcode || null, likes: item.like_count || 0, comments: item.comment_count || 0, views, shares: 0, media_type: 'reel', date })
        }
        send({ type: 'progress', posts: posts.length, reels: reels.length })
        token = r.pagination_token || ''
        page++
        if (!token || items.length === 0) break
        await new Promise(r => setTimeout(r, 150))
      } catch { break }
    }

    send({ type: 'done', posts, reels })
  } catch (err) {
    send({ type: 'error', message: err.message })
  }

  res.end()
}

export const getProfile = handle((req) => fetchAccountData(`https://www.instagram.com/${cleanUsername(req.params.username)}/`));
export const getAccountData = handle((req) => fetchAccountData(`https://www.instagram.com/${cleanUsername(req.params.username)}/`));
export const getAccountDataV2 = handle((req) => fetchAccountDataV2(`https://www.instagram.com/${cleanUsername(req.params.username)}/`));
export const getUserAbout = handle((req) => fetchUserAbout(cleanUsername(req.params.username)));
export const getSimilarAccounts = handle((req) => fetchSimilarAccounts(cleanUsername(req.params.username)));
export const getPosts = handle(async (req) => {
  const igUrl = `https://www.instagram.com/${cleanUsername(req.params.username)}/`;
  const result = await fetchPosts(igUrl);
  return { posts: (result.posts || []).map(i => { const item = i.node || i; return { id: item.id || item.pk, thumbnail: getThumbnail(item), likes: item.like_count || 0, comments: item.comment_count || 0, views: item.view_count || 0, date: item.taken_at ? new Date(item.taken_at * 1000).toLocaleDateString() : "" }; }) };
});
export const getReels = handle(async (req) => {
  const igUrl = `https://www.instagram.com/${cleanUsername(req.params.username)}/`;
  const result = await fetchReels(igUrl);
  return { reels: (result.reels || []).map(i => { const item = (i.node?.media) || i.node || i; return { id: item.id || item.pk, thumbnail: getThumbnail(item), likes: item.like_count || 0, views: item.play_count || 0, comments: item.comment_count || 0, date: item.taken_at ? new Date(item.taken_at * 1000).toLocaleDateString() : "" }; }) };
});
export const getStories = handle((req) => fetchStories(`https://www.instagram.com/${cleanUsername(req.params.username)}/`));
export const getHighlights = handle((req) => fetchHighlights(`https://www.instagram.com/${cleanUsername(req.params.username)}/`));
export const getHighlightStories = handle((req) => fetchHighlightStories(req.params.highlightId));
export const getTaggedPosts = handle((req) => fetchTaggedPosts(`https://www.instagram.com/${cleanUsername(req.params.username)}/`));
export const getFollowers = handle((req) => fetchFollowers(`https://www.instagram.com/${cleanUsername(req.params.username)}/`));
export const getFollowersV2 = handle((req) => fetchFollowersV2(`https://www.instagram.com/${cleanUsername(req.params.username)}/`));
export const getMediaDataV2 = handle((req) => fetchMediaDataV2(req.params.mediaCode));
export const getMediaData = handle((req) => fetchMediaData(req.query.url, req.query.type));
export const getMediaCodeOrId = handle((req) => fetchMediaCodeOrId(req.query.media_code, req.query.media_id));
export const getPostTitle = handle((req) => fetchPostTitle(req.query.url, req.query.type));
export const getPostLikers = handle((req) => fetchPostLikers(req.params.mediaCode));
export const getPostComments = handle((req) => fetchPostComments(req.params.mediaCode, req.query.sort_order));
export const getChildComments = handle((req) => fetchChildComments(req.query.post_id, req.query.comment_id));
export const getHashtag = handle((req) => searchHashtag(req.params.hashtag));
export const search = handle((req) => searchInstagram(req.query.q));
