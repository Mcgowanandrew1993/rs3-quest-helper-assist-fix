/* Conservative conversation evidence for the modern dialogue fallback.
 * Pure state machine, also exercised by the offline regression suite.
 */
(function (root) {
    "use strict";
    function Tracker() { this.reset(); }
    Tracker.prototype.reset = function () {
        this.key = null; this.active = false; this.target = null;
        this.pending = null; this.confirmed = -1; this.responded = false;
        this.confirmedIndices = {}; this.requiredIndices = [];
        this.seenIndices = {}; this.lastKind = "not scanned";
        this.responseFrames = 0; this.acceptGap = null; this.accepted = false;
        this.needsAccept = false; this.last = -1;
        this.offerSeen = false;
    };
    Tracker.prototype.observe = function (s) {
        if (this.key !== s.key) { this.reset(); this.key = s.key; }
        this.lastKind = s.kind;
        if (s.fallback) this.active = true;
        if (!this.active) return { hold: false };
        if (s.kind === "options") {
            this.responseFrames = 0;
            if (s.match && s.index >= 0) {
                var id = String(s.match.subIndex);
                if (this.target !== id) {
                    this.target = id; this.pending = null; this.confirmed = -1;
                    this.confirmedIndices = {};
                    this.seenIndices = {};
                    this.responded = false; this.acceptGap = null; this.accepted = false;
                    this.offerSeen = false;
                }
                this.last = s.last;
                this.seenIndices[s.index] = true;
                this.requiredIndices = s.requiredIndices || [s.last];
                this.needsAccept = !!s.needsAccept;
                if (this.pending && this.pending.index === s.index && this.pending.signature === s.signature) {
                    this.pending.frames++;
                } else {
                    // A different expected menu can confirm the preceding
                    // choice, but is not itself proof the final pick was made.
                    if (this.pending && this.pending.frames >= 2 && s.index > this.pending.index) {
                        this.confirmed = Math.max(this.confirmed, this.pending.index);
                        this.confirmedIndices[this.pending.index] = true;
                    }
                    this.pending = { index: s.index, signature: s.signature, frames: 1 };
                }
            }
        } else if (s.kind === "offer") {
            this.responseFrames = 0;
            // The offer itself proves the intervening phase, even when no
            // reply appeared between choosing the option and opening it.
            if (this.target !== null && this.needsAccept) this.offerSeen = true;
        } else if (s.kind === "response") {
            this.responseFrames++;
            if (this.responseFrames >= 2 && this.pending && this.pending.frames >= 2) {
                this.confirmed = Math.max(this.confirmed, this.pending.index);
                this.confirmedIndices[this.pending.index] = true;
                this.responded = true;
                this.pending = null;
            }
            // An explicit Accept instruction needs a response *after* the
            // intervening offer/hidden phase, not just the response before it.
            if (this.responseFrames >= 2 && (this.offerSeen ||
                (this.acceptGap !== null && s.now - this.acceptGap >= 1000))) {
                this.accepted = true;
            }
        } else {
            this.responseFrames = 0;
            if (s.kind === "closed" && this.needsAccept && this.responded && this.confirmed >= this.last && this.acceptGap === null) {
                this.acceptGap = s.now;
            }
        }
        var confirmedIndices = this.confirmedIndices;
        var ready = this.target !== null && this.last >= 0 && this.requiredIndices.every(function (i) { return confirmedIndices[i]; }) &&
            this.responded && (!this.needsAccept || this.accepted);
        return { hold: !ready, ready: ready,
            reason: this.target === null ? "waiting for a matching choice" : !this.responded ? "choice seen, but no reply confirmed" :
                this.needsAccept && !this.accepted ? "waiting for the quest acceptance and following dialogue" :
                "waiting for the remaining choices and an NPC response" };
    };
    Tracker.prototype.summary = function () {
        var self = this, required = this.requiredIndices;
        var seen = required.filter(function (i) { return self.seenIndices[i]; }).length;
        var confirmed = required.filter(function (i) { return self.confirmedIndices[i]; }).length;
        return "Screen: " + ({options:"choices",response:"reply",offer:"quest offer",unknown:"unreadable dialogue",closed:"not recognised"}[this.lastKind] || this.lastKind) +
            " | Choices seen: " + seen + "/" + required.length + " | Confirmed after reply: " + confirmed + "/" + required.length +
            " | Reply confirmed: " + (this.responded ? "yes" : "no") +
            (this.needsAccept ? " | Acceptance: " + (this.accepted ? "confirmed" : "waiting") : "");
    };
    root.QuestFallbackAuto = Tracker;
})(typeof window !== "undefined" ? window : globalThis);
