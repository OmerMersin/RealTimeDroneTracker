/**
 * server.js
 *
 * 1) Install dependencies:
 *    npm install express node-fetch
 *
 * 2) Run with:
 *    node server.js
 *
 * 3) Access your locally served/cached tiles at:
 *    http://localhost:3000/tiles/{z}/{x}/{y}.png
 */

const express = require("express");
const fetch = require("node-fetch"); // For fetching remote tiles
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// --------------
// 1) Replace with your Mapbox (or other) tile URL
// --------------
// Example with Mapbox Satellite (PNG/JPEG). Use your own access token
const TILE_URL_TEMPLATE =
  "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoib21lcm1lcnNpbiIsImEiOiJjbTFqM25rOWQwMGdtMmlzOHBldjQ5YTUwIn0.fONq3Y7j9GLxFTiy0ixAEw";

// --------------
// 2) Directory to store cached tiles
// --------------
const TILE_CACHE_DIR = path.join(__dirname, "tiles");
const PLACEHOLDER_TILE = path.join(__dirname, "placeholder.png"); // Transparent PNG

// Make sure the tiles directory exists
if (!fs.existsSync(TILE_CACHE_DIR)) {
  fs.mkdirSync(TILE_CACHE_DIR, { recursive: true });
}

// --------------
// 3) Route for tiles: /tiles/:z/:x/:y.png
// --------------
app.get("/tiles/:z/:x/:y.png", async (req, res) => {
  try {
    // Extract parameters
    const { z, x, y } = req.params;
    // Build local file path: e.g. /tiles/10/300/400.png
    const tilePath = path.join(TILE_CACHE_DIR, z, x);
    const tileFile = path.join(tilePath, `${y}.png`);

    // Check if tile is cached locally
    if (fs.existsSync(tileFile)) {
      // If cached, serve from disk
      console.log(`Serving from cache: ${tileFile}`);
      res.sendFile(tileFile);
    } else {
        // Serve a placeholder immediately while downloading in background
        res.sendFile(PLACEHOLDER_TILE);

        // Fetch and store the tile asynchronously
        fetchTileAndCache(z, x, y, tilePath);
    }
} catch (error) {
        console.error("Error fetching tile:", error);
        res.status(500).send("Internal Server Error");
      }});

//       // If not cached, we must download it
//       console.log(`Downloading new tile for z=${z}, x=${x}, y=${y}`);
      
//       // Construct the remote tile URL
//       const remoteTileUrl = TILE_URL_TEMPLATE
//         .replace("{z}", z)
//         .replace("{x}", x)
//         .replace("{y}", y);

//       const response = await fetch(remoteTileUrl);
//       if (!response.ok) {
//         return res.status(response.status).send("Tile fetch error");
//       }

//       const buffer = await response.buffer();

//       // Ensure directory path exists before writing file
//       fs.mkdirSync(tilePath, { recursive: true });
//       fs.writeFileSync(tileFile, buffer);

//       // Now serve the freshly downloaded tile
//       res.contentType("image/png");
//       res.send(buffer);
//     }
//   } catch (error) {
//     console.error("Error fetching tile:", error);
//     res.status(500).send("Internal Server Error");
//   }

// Function to download tile in background
async function fetchTileAndCache(z, x, y, tilePath) {
    const remoteTileUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/${z}/${x}/${y}?access_token=pk.eyJ1Ijoib21lcm1lcnNpbiIsImEiOiJjbTFqM25rOWQwMGdtMmlzOHBldjQ5YTUwIn0`;

    try {
        const response = await fetch(remoteTileUrl);
        if (!response.ok) throw new Error("Tile fetch failed");

        const buffer = await response.buffer();

        // Save tile to disk
        fs.mkdirSync(path.dirname(tilePath), { recursive: true });
        fs.writeFileSync(tilePath, buffer);

        console.log(`Cached new tile: ${tilePath}`);
    } catch (error) {
        console.error(`Failed to download tile (${z}/${x}/${y}):`, error);
    }
}
// --------------
// 4) Serve static frontend (Optional)
// --------------
// If you have an index.html in ./public, serve it:
app.use(express.static(path.join(__dirname, "public")));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
