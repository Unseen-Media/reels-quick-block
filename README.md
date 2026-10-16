# Reels Quick Block for Instagram

A Chrome extension that lets you block the account of the Instagram reel you're watching, without leaving the reel.

- A red **Block @username** button shows who posted the reel on screen
- Tap it twice (or press **B** twice) to block that account
- Automatically skips to the next reel (can be turned off in the popup)
- The toolbar popup lists everyone you've blocked from reels

## Install (developer mode)

1. Open `chrome://extensions`
2. Turn on **Developer mode**
3. Click **Load unpacked** and select the `extension` folder
4. Go to `instagram.com/reels` while logged in

## Project layout

- `extension/`: the extension itself (Manifest V3)
- `docs/`: privacy policy, published with GitHub Pages
- `store/`: Chrome Web Store listing text and images
- `preview/`: interactive demo page
- `tools/make-icons.ps1`: regenerates the icons

## Privacy

No data is collected. See the [privacy policy](https://unseen-media.github.io/reels-quick-block/privacy.html).

Not affiliated with, endorsed by or sponsored by Instagram or Meta Platforms, Inc.
