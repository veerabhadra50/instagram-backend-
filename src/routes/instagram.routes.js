import express from "express";
import { fetchAccountData } from "../services/instagram.service.js";
import { cleanUsername } from "../utils/validator.js";
import {
  getAnalytics,
  getProfile,
  getAccountData,
  getAccountDataV2,
  getUserAbout,
  getSimilarAccounts,
  getPosts,
  getReels,
  getStories,
  getHighlights,
  getHighlightStories,
  getTaggedPosts,
  getFollowers,
  getFollowersV2,
  getMediaDataV2,
  getMediaData,
  getMediaCodeOrId,
  getPostTitle,
  getPostLikers,
  getPostComments,
  getChildComments,
  getHashtag,
  search,
  getAllPostsReels,
  enrichMedia,
} from "../controllers/instagram.controller.js";

const router = express.Router();

// Debug: see raw profile fields
router.get("/debug-profile/:username", async (req, res) => {
  const data = await fetchAccountData(`https://www.instagram.com/${cleanUsername(req.params.username)}/`);
  res.json(data);
});

// Analytics (combined)
router.get("/analytics/:username", getAnalytics);

// Profile
router.get("/profile/:username", getProfile);
router.get("/account/:username", getAccountData);
router.get("/account-v2/:username", getAccountDataV2);
router.get("/about/:username", getUserAbout);
router.get("/similar/:username", getSimilarAccounts);

// Content
router.get("/posts/:username", getPosts);
router.get("/reels/:username", getReels);
router.get("/stories/:username", getStories);
router.get("/highlights/:username", getHighlights);
router.get("/highlight-stories/:highlightId", getHighlightStories);
router.get("/tagged/:username", getTaggedPosts);

// Followers
router.get("/followers/:username", getFollowers);
router.get("/followers-v2/:username", getFollowersV2);

// Media  (?url=...&type=post|reel)
router.get("/media/v2/:mediaCode", getMediaDataV2);
router.get("/media", getMediaData);
router.get("/media/id", getMediaCodeOrId);
router.get("/media/title", getPostTitle);
router.get("/media/likers/:mediaCode", getPostLikers);
router.get("/media/comments/:mediaCode", getPostComments);
router.get("/media/replies", getChildComments);

router.get("/all-posts-reels/:username", getAllPostsReels)
router.post("/enrich-media", enrichMedia)

// Search
router.get("/hashtag/:hashtag", getHashtag);
router.get("/search", search);

export default router;
