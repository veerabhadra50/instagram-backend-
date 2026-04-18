import axios from "axios";

const getConfig = () => ({
  baseURL: `https://${process.env.RAPID_API_HOST}`,
  headers: {
    "X-RapidAPI-Key": process.env.RAPID_API_KEY,
    "X-RapidAPI-Host": process.env.RAPID_API_HOST,
    "Content-Type": "application/x-www-form-urlencoded",
  },
});

const post = async (path, body) => {
  const { baseURL, headers } = getConfig();
  const res = await axios.post(`${baseURL}${path}`, new URLSearchParams(body), { headers });
  return res.data;
};

const get = async (path) => {
  const { baseURL, headers } = getConfig();
  const res = await axios.get(`${baseURL}${path}`, { headers });
  return res.data;
};

// Full profile with follower_count, following_count, media_count, total_clips_count
export const fetchAccountData = (username) =>
  post("/ig_get_fb_profile.php", { username_or_url: username, data: "basic" });

// Account Data V2
export const fetchAccountDataV2 = (username) =>
  post("/ig_get_fb_profile_v3.php", { username_or_url: username });

// Search - uses search_query param
export const searchInstagram = (query) =>
  post("/search_ig.php", { search_query: query });

// Content
export const fetchPosts = (usernameOrUrl) =>
  post("/get_ig_user_posts.php", { username_or_url: usernameOrUrl, amount: "50", pagination_token: "" });

export const fetchAllPosts = async (usernameOrUrl) => {
  let all = [], token = "", page = 0
  while (page < 30) {
    const res = await post("/get_ig_user_posts.php", { username_or_url: usernameOrUrl, amount: "50", pagination_token: token })
    const items = res.posts || []
    all = all.concat(items)
    token = res.pagination_token || ""
    page++
    if (!token || items.length === 0) break
  }
  return { posts: all }
}

export const fetchReels = (usernameOrUrl) =>
  post("/get_ig_user_reels.php", { username_or_url: usernameOrUrl, amount: "50", pagination_token: "" });

// Extract date from Instagram media ID (timestamp encoded in top 32 bits)
const dateFromMediaId = (id) => {
  try {
    if (!id) return ''
    const ts = Math.floor(parseInt(BigInt(id.toString()).toString()) / 1000000000000)
    if (ts > 1000000000 && ts < 9999999999) return new Date(ts * 1000).toISOString().split('T')[0]
    // fallback: shift right 23 bits
    const shifted = Number(BigInt(id.toString()) >> 23n)
    if (shifted > 1000000000 && shifted < 9999999999) return new Date(shifted * 1000).toISOString().split('T')[0]
  } catch { }
  return ''
}

const extractReelDate = (i) => {
  const item = (i.node?.media) || i.node || i
  const ts = item.taken_at || i.taken_at || item.device_timestamp || i.device_timestamp
    || item.caption?.created_at || item.clip_metadata?.original_sound_info?.progressive_download_url
    || item.organic_tracking_token || null
  if (ts && typeof ts === 'number' && ts > 1000000000) return new Date(ts * 1000).toISOString().split('T')[0]
  // Extract from Instagram media ID (top bits encode timestamp)
  const id = item.id || item.pk || i.id || i.pk
  if (id) {
    try {
      const shifted = Number(BigInt(String(id)) >> 23n)
      if (shifted > 1000000000 && shifted < 9999999999) return new Date(shifted * 1000).toISOString().split('T')[0]
    } catch {}
  }
  return ''
}

export const fetchAllReels = async (usernameOrUrl) => {
  let all = [], token = "", page = 0
  while (page < 10) {
    const res = await post("/get_ig_user_reels.php", { username_or_url: usernameOrUrl, amount: "50", pagination_token: token })
    const items = res.reels || []
    if (page === 0 && items.length > 0) {
      const sample = items[0]
      const item = (sample.node?.media) || sample.node || sample
      console.log("[REEL KEYS]", Object.keys(sample))
      console.log("[REEL ITEM KEYS]", Object.keys(item))
      console.log("[REEL taken_at]", item.taken_at, sample.taken_at, "[id]", item.id || item.pk)
      console.log("[REEL DATE RESULT]", extractReelDate(sample))
    }
    all = all.concat(items)
    token = res.pagination_token || ""
    page++
    if (!token || items.length === 0) break
  }
  return { reels: all }
}

export const fetchStories = (username) =>
  post("/get_ig_user_stories.php", { username_or_url: username });

export const fetchHighlights = (username) =>
  post("/get_ig_user_highlights.php", { username_or_url: username });

export const fetchHighlightStories = (highlightId) =>
  post("/get_highlights_stories.php", { highlight_id: highlightId });

export const fetchTaggedPosts = (username) =>
  post("/get_ig_user_tagged_posts.php", { username_or_url: username, amount: "12", pagination_token: "" });

export const fetchUserAbout = (username) =>
  get(`/get_ig_user_about.php?username_or_url=${username}`);

export const fetchSimilarAccounts = (username) =>
  get(`/get_ig_similar_accounts.php?username_or_url=${username}`);

// Followers
export const fetchFollowers = (username) =>
  post("/get_ig_user_followers.php", { username_or_url: username, data: "followers", amount: "12", start_from: "0", search_query: "" });

export const fetchFollowersV2 = (username) =>
  post("/get_ig_user_followers_v2.php", { username_or_url: username, data: "followers", amount: "12", pagination_token: "" });

// Media
export const fetchMediaDataV2 = (mediaCode) =>
  get(`/get_media_data_v2.php?media_code=${mediaCode}`);

export const fetchMediaDataV2ById = (mediaId) =>
  get(`/get_media_data_v2.php?media_id=${mediaId}`);

export const fetchMediaData = (mediaUrl, type = "post") =>
  get(`/get_media_data.php?reel_post_code_or_url=${encodeURIComponent(mediaUrl)}&type=${type}`);

export const fetchMediaCodeOrId = (mediaCode, mediaId) =>
  get(`/media_data_id.php?media_code=${mediaCode}&media_id=${mediaId}`);

export const fetchPostTitle = (mediaUrl, type = "post") =>
  get(`/get_reel_title.php?reel_post_code_or_url=${encodeURIComponent(mediaUrl)}&type=${type}`);

export const fetchPostLikers = (mediaCode) =>
  get(`/get_post_likers.php?media_code=${mediaCode}`);

export const fetchPostComments = (mediaCode, sortOrder = "popular") =>
  get(`/get_post_comments.php?media_code=${mediaCode}&sort_order=${sortOrder}`);

export const fetchChildComments = (postId, commentId) =>
  get(`/get_post_child_comments.php?post_id=${postId}&comment_id=${commentId}`);

export const searchHashtag = (hashtag) =>
  get(`/search_hashtag.php?hashtag=${hashtag}`);
