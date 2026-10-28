# RS3 Quest Helper: Assist fixes

An unofficial fork of [Kiddsh9331/rs3-quest-helper](https://github.com/Kiddsh9331/rs3-quest-helper). Current patch version: **4.3**.

## Changes

- Modern dialogue-option detection when the original frame reader fails.
- NPC/player portrait replies and explicit quest-offer tracking for dialogue Auto.
- Reward-window text recognition that matches the open quest and completes its remaining steps independently of dialogue Auto.
- A real quest-point reward requirement for Hazeel Cult to reject its fake finish.
- Visible version label, reload button and Auto diagnostics.
- Local reward OCR that also works when Alt1 caches the page under a file address.

Walking, combat and item interactions remain manual. Dialogue Auto was confirmed
in live Alt1 on the tested setup. The latest v4.3 worker fix passes browser tests
from HTTP and file-backed origins, but live Alt1 confirmation is pending.

## Local installation

1. Install [Alt1 Toolkit](https://runeapps.org/alt1) and [Node.js LTS](https://nodejs.org/).
2. Download the repository with **Code → Download ZIP** and extract it.
3. Run **Start helper.cmd**, or run `node server.cjs` in the repository folder.
4. In Alt1's browser open **http://127.0.0.1:8765/index.html**, then use the Add to Alt1 banner.
5. Open **RS3 Quest Helper - Dialogue Test** and allow pixel/overlay permissions. Keep the local server running while using it.

Use RuneScape interface scaling at 100%. Turn on Assist for highlighting and
reward detection, and Auto for dialogue-step progression. Recognition stays on
your computer; screenshots are not sent to an external OCR service.

Progress/settings are saved locally. When moving between website addresses,
export progress from the previous app and import it into this one. Website
origins do not share saved progress automatically.

GitHub Pages is not enabled as part of creating this fork. The upstream Pages
workflow remains owner-restricted; use the local installation above for now.

## Credits and licensing

The original code, commit history and README credits are retained. Quest content
comes from the RuneScape Wiki; screen-reading libraries are Skillbert's Alt1
libraries. Tesseract.js, Tesseract.js-core and the English tessdata_fast model
have their notices in [ocr/THIRD-PARTY.md](ocr/THIRD-PARTY.md).

The upstream snapshot had no top-level licence file. This fork does not assign
a new licence to upstream code; component-specific notices continue to apply.

See [CHANGES.md](CHANGES.md) for the patch history and [tests](tests/README.md)
for the regression checks.
