# Stills (images instead of video)

- `envelope-flatlay.html`: blush-pink wedding envelope (stitched border, pearl trim, pearl wax seal with monogram, roses + eucalyptus) on silk.
  Edit the text/monogram in the script, copy `../../fonts` next to it, then screenshot at 1080x1920 with `deviceScaleFactor: 2` (Playwright).
- `hall-still.js`: renders one still of the 3-D wedding hall (chairs, aisle petals + candles, flower arch on a stage). Needs a built `palace-3d` page
  (`node scripts/render.mjs --template palace-3d --out OUT --preview 1` creates `OUT/build`):
  `node hall-still.js OUT/build out.png 2160 3840 0 1.9 -3 0 3.6 -46`  (args: width height camX camY camZ lookX lookY lookZ).
  It sets `PALACE_CFG.wedding = true`; about 60 s at 2160x3840.
