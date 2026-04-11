# Insta Analytics Backend

## Endpoints
- GET /api/instagram/reels/:username → {username, total_reels_count, reels_count}
- GET /api/instagram/analytics/:username → Profile + posts + reels list + avgs

Reels count from profile API. List paginated if needed (?maxReels=200).

Server: `npm run dev` (port 5000)
CORS for localhost:5173.

Test: http://localhost:5000/api/instagram/reels/virat.kohli

