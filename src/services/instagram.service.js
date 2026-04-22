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

export const fetchAccountData = (username) =>
  post("/ig_get_fb_profile.php", { username_or_url: username, data: "basic" });

export const fetchAccountDataV2 = (username) =>
  post("/ig_get_fb_profile_v3.php", { username_or_url: username });

export const searchInstagram = (query) =>
  post("/search_ig.php", { search_query: query });

export const fetchPosts = (usernameOrUrl) =>
  post("/get_ig_user_posts.php", { username_or_url: usernameOrUrl, amount: "50", pagination_token: "" });

export const fetchAllPosts = async (usernameOrUrl, maxItems = 1500) => {
  let all = [], token = "", page = 0
  while (page < 100) {
    const res = await post("/get_ig_user_posts.php", { username_or_url: usernameOrUrl, amount: "50", pagination_token: token })
    const items = res.posts || []
    all = all.concat(items)
    token = res.pagination_token || ""
    page++
    console.log(`[fetchAllPosts] page=${page} fetched=${items.length} total=${all.length}`)
    if (!token || items.length === 0 || all.length >= maxItems) break
  }
  return { posts: all }
}

export const fetchReels = (usernameOrUrl) =>
  post("/get_ig_user_reels.php", { username_or_url: usernameOrUrl, amount: "50", pagination_token: "" });

export const fetchAllReels = async (usernameOrUrl) => {
  let all = [], token = "", page = 0
  while (page < 100) {
    const res = await post("/get_ig_user_reels.php", { username_or_url: usernameOrUrl, amount: "50", pagination_token: token })
    const items = res.reels || []
    all = all.concat(items)
    token = res.pagination_token || ""
    page++
    console.log(`[fetchAllReels] page=${page} fetched=${items.length} total=${all.length}`)
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

export const fetchFollowers = (username) =>
  post("/get_ig_user_followers.php", { username_or_url: username, data: "followers", amount: "12", start_from: "0", search_query: "" });

export const fetchFollowersV2 = (username) =>
  post("/get_ig_user_followers_v2.php", { username_or_url: username, data: "followers", amount: "12", pagination_token: "" });

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
