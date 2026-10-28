# Dialogue detection test

Based on Kiddsh9331/rs3-quest-helper commit 6653079b2c2160e1988c0421ebe58efac3af9774.

The unmodified bundled reader fails to locate the dialogue on the supplied
2559 x 1439 screenshot. Its modern answer-button anchors do match all four
choices, and existing OCR reads all four choices correctly when frame detection
is bypassed.

dialog-fallback.js preserves the original frame reader, then falls back to
2–5 aligned, evenly spaced modern button anchors with readable choice text.
It derives bounds from the buttons and clears its cached result on every scan.
No screenshot-specific coordinates or answer text are used in the patch.

Version 2 adds modern dialogue-frame corner samples and a choice-header sample
from the supplied screenshot. Matching corners locate variable-size response
frames; an unchanged choice header with unreadable buttons remains unknown.
The original response-screen code path then advances the option-chain pointer.

fallback-auto.js adds conservative conversation evidence. Expected choices need
two consecutive observations and a following response (or a later expected menu
for intermediate choices). All matchable candidates of a sequential chain must
be confirmed. A visible menu alone or closing a menu without a response cannot
finish the step. Explicit Accept instructions require a following dialogue after
the offer/hidden interval. Missing evidence holds indefinitely instead of using
the upstream tracker's stall timeout. Existing conversation debounce, multi-talk
counting and substep handling are retained. Auto toggle and Assist changes reset
the added evidence; actual step changes reset it on the next observation.

The tiny OCR-line crop in libs/dialog.js is also bounded against its actual x
position, fixing reads from cropped or translated captures.

Validation: the four real screenshot choices still read correctly; translated
capture and menu disappearance checks pass. Simulated frames verify response vs
unreadable-option classification. Fourteen state-machine tests and three actual
assist-loop simulations cover premature closure, missing intermediate choices,
step/substep changes, acceptance pauses and final progress writes. Live NPC
response frame detection has not yet been confirmed by the user.

This is a local test copy, not an upstream release. It has not been verified in
the live Alt1 host yet. It requires Node.js and a local-only HTTP server.
The included launcher uses this computer's bundled Node runtime, or Node on PATH.
Keep the server running while using the addon. To stop it, close its server
window, or stop the node process whose command line ends in this folder's server.cjs.

The app name and localhost origin separate it from the original helper. Export
progress from the original and import it here if needed. Original sources and
credits are retained in README.md and libs/.

## Version 3

The supplied Imp Catcher narration screenshot confirms that reply frames have
no close button and use different right and bottom corner pixels. Add separate
reply-corner assets and require the visible Continue button for response
classification. An unreadable choice menu or a blank frame never counts as a
response. Both real screenshot fixtures now pass. Nine image-reader checks and
seventeen conversation/integration checks pass. Actual live Auto advancement
still needs user confirmation after reloading this update.

## Version 4

Add quest reward-window detection using two ornamental corners and the common
Congratulations banner. Only this window's small completion-message region is
read with a local Tesseract.js worker and English model. The full "You have
completed [name]!" sentence must match the open guide's name after punctuation
normalisation. The completion scan runs before dialogue and current-step checks,
independently of Auto. A matching screen marks every step and substep complete,
resets conversation evidence and retains a completion status.

Results from OCR are checked against the current guide again to reject results
from a previously selected quest. The chat completion path now also requires
an exact matching quest name rather than a generic congratulations message.

The actual Imp Catcher reward screenshot passes panel detection and OCR tests,
including a browser run using the packaged local worker and language model.
Integration checks confirm completion with Auto off and a non-dialogue step
selected, plus rejection of wrong quest names and stale results. No live Alt1
reward-screen verification has yet been reported for this version.

## Version 4.1

Add a persistent version strip and Reload update button. Add an Auto evidence
readout showing current screen classification, expected choices seen, choices
confirmed by reply transitions and quest acceptance state. Paused status now
separates missing matching choices from missing replies. Reward OCR failures
are shown in the diagnostic readout. The saved launch URL is stable again;
script/style cache versions are managed within the page.

Conversation and quest-completion integration checks continue to pass. This is
a diagnostic improvement, not a claim that live dialogue Auto is fixed.

## Version 4.2

Fix portrait reply detection: portraits/shadows invalidate the earlier lower
corner samples, and the player's right portrait also obscures the upper-right
sample. For the NPC layout use matching upper corners plus the Continue control.
For the player layout use the top-left sample, centred Continue control and the
invariant bottom border beneath it. Never use portrait pixels as anchors.

Recognise quest offers by the paired Accept Quest and Not Right Now controls.
The tracker now records this explicit phase and accepts a subsequent reply as
continuation, including offers that open directly after the selected choice.
Previously it required a response before the offer, creating a deadlock in the
reported Hazeel Cult sequence. An offer alone cannot complete the step.

All nine real screenshot classifications pass (choice menu, offer, six portrait
replies and closed dialogue). Replaying those captures through the actual
assist loop completes the first Hazeel Cult step after the last reply closes,
and never while a reply or offer remains visible. Sixteen state-machine tests,
three dialogue integration tests, three completion integration tests and the
existing image-reader regression checks pass. Live confirmation remains needed.

## Version 4.3

Fix OCR worker loading when Alt1 caches the app under file://. OCR assets are
explicitly loaded from the loopback HTTP server in this mode and the worker
uses a Blob wrapper. Public vendor OCR files receive CORS headers; other files
do not. The server remains bound to 127.0.0.1. Synchronous worker-start failures
also flow through the normal recovery handler rather than leaving OCR busy.

For Hazeel Cult, a matching completion sentence now additionally requires the
real "1 Quest Point" reward. Read the reward list for this exception and reject
an "Or not" message. Chat messages alone cannot finish Hazeel Cult, avoiding
its known false finish. Other quest completion behavior is unchanged.

Browser tests from both HTTP and file-backed origins recognise the real Imp
Catcher and Hazeel Cult screenshots. Tests reject Hazeel name-only, five-coin,
chat-only and mismatched completion evidence. Dialogue and completion progress
integration checks continue to pass. Live Alt1 verification is still needed.
