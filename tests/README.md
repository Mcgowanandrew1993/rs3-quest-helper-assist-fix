# Regression checks

Run from the repository root with Node.js:

```sh
node tests/auto-evidence.cjs
node tests/dialogue-integration.cjs
node tests/completion-integration.cjs
```

These cover the fallback conversation state machine and actual assist-loop
progress updates, including quest offers and definitive completion evidence.

Additional image-reader and browser-worker checks were performed against
private user-supplied screenshots. Those full screenshots contain player/chat
information and are deliberately not included. Small generic interface anchors
used by the readers are included in dialog-frame.js and completion-frame.js.

Dialogue Auto was confirmed in live Alt1 on the tested 100% interface setup.
The v4.3 worker fix was tested in browsers from HTTP and file-backed origins;
live Alt1 verification of that latest worker fix is still pending.
