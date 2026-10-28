/* Local compatibility patch for Kiddsh9331/rs3-quest-helper.
 * Keep the stock reader first; recover option menus from matching button
 * anchors when changed window chrome prevents frame recognition.
 */
(function () {
    "use strict";
    var proto = Dialog.default.prototype;
    var stockFind = proto.find, stockRead = proto.read;
    var chrome = null;
    if (typeof QuestDialogFrame !== "undefined") {
        var keys = Object.keys(QuestDialogFrame);
        Promise.all(keys.map(function (k) { return A1lib.ImageDetect.imageDataFromBase64(QuestDialogFrame[k]); }))
            .then(function (images) { chrome = {}; keys.forEach(function (k, i) { chrome[k] = images[i]; }); });
    }
    function modernFrame(reader, img) {
        if (!chrome) return false;
        var lefts = img.findSubimage(chrome.tl);
        for (var i = 0; i < lefts.length; i++) {
            var p = lefts[i];
            if (img.width - p.x < 320 || img.height - p.y < 106) continue;
            var rights = [];
            [chrome.tr, chrome.replyTr].forEach(function (template) {
                if (template) rights = rights.concat(img.findSubimage(template, p.x + 300, p.y,
                    Math.min(600, img.width - p.x - 300), 16));
            });
            var x = img.x + p.x - 2, y = img.y + p.y - 2;
            var width = rights.length ? rights[0].x - p.x + 20 : Math.min(720, img.width - p.x + 2);
            // Portrait shadows change the lower corner pixels. Two matching
            // upper corners plus a Continue button identify a reply without
            // requiring a parchment sample next to the portrait.
            var continueMatches = chrome.replyContinue ? img.findSubimage(chrome.replyContinue,
                p.x, p.y + 65, Math.min(width - 4, img.width - p.x),
                Math.min(280, img.height - p.y - 65)) : [];
            if (!rights.length) {
                // A player's portrait can cover the upper-right corner too.
                // Recover the width from the centred Continue button, but
                // require the unchanged bottom border directly beneath it.
                continueMatches = continueMatches.filter(function (c) {
                    return chrome.replyBottom && img.findSubimage(chrome.replyBottom,
                        c.x + 19, c.y + 23, chrome.replyBottom.width, chrome.replyBottom.height).length;
                });
                if (!continueMatches.length) continue;
                width = Math.round(2 * (continueMatches[0].x + chrome.replyContinue.width / 2 - (p.x - 2)));
                if (width < 350 || width > 700) continue;
            }
            var bottoms = [];
            [chrome.bl, chrome.replyBl].forEach(function (template) {
                if (template) bottoms = bottoms.concat(img.findSubimage(template, p.x, p.y + 90, 16,
                    Math.min(270, img.height - p.y - 90)));
            });
            if (!bottoms.length && !continueMatches.length) continue;
            var height = continueMatches.length ? continueMatches[0].y + chrome.replyContinue.height + 5 - (p.y - 2) :
                bottoms[0].y - p.y + 18;
            if (x < img.x || y < img.y || x + width > img.x + img.width || y + height > img.y + img.height) continue;
            reader.pos = { x: x, y: y, width: width, height: height, legacy: false };
            // A menu whose button OCR failed is still a menu, not an NPC
            // response. Require the reply frame and its Continue button,
            // without the choice-menu title, before confirming a response.
            var titleMatches = img.findSubimage(chrome.optionsTitle, p.x + 30, p.y,
                Math.max(200, width - 50), 32);
            var isResponse = !titleMatches.length && continueMatches.length > 0;
            reader.usingButtonFallback = true;
            reader.fallbackKind = isResponse ? "response" : "unknown";
            reader.fallbackResult = { title: "", text: isResponse ? [] : null, opts: null };
            return reader.pos;
        }
        return false;
    }
    function questOffer(reader, img) {
        if (!chrome || !chrome.offerAccept || !chrome.offerDecline) return false;
        var accepts = img.findSubimage(chrome.offerAccept);
        for (var i = 0; i < accepts.length; i++) {
            var a = accepts[i], sx = Math.max(0, a.x - 180);
            var declines = img.findSubimage(chrome.offerDecline, sx, a.y, a.x - sx, chrome.offerDecline.height);
            if (!declines.length) continue;
            var d = declines[0];
            reader.pos = { x: img.x + d.x, y: img.y + d.y,
                width: a.x + chrome.offerAccept.width - d.x, height: chrome.offerAccept.height, legacy: false };
            reader.usingButtonFallback = true;
            reader.fallbackKind = "offer";
            reader.fallbackResult = { title: "", text: null, opts: null };
            return reader.pos;
        }
        return false;
    }
    proto.find = function (img) {
        this.usingButtonFallback = false;
        this.fallbackKind = null;
        this.fallbackResult = null;
        var pos = stockFind.call(this, img);
        if (pos || !img) return pos;
        var offer = questOffer(this, img);
        if (offer) return offer;
        this.pos = { x: img.x, y: img.y, width: img.width, height: img.height, legacy: false };
        var anchors = this.findOptions(img).map(function (a) {
            return { x: a.x + img.x, y: a.y + img.y, hover: a.hover, active: a.active };
        });
        var groups = [];
        anchors.sort(function (a, b) { return a.y - b.y; });
        anchors.forEach(function (a) {
            var group = groups.find(function (g) {
                var last = g[g.length - 1];
                return Math.abs(last.x - a.x) <= 2 && a.y - last.y >= 18 && a.y - last.y <= 32;
            });
            if (group) group.push(a); else groups.push([a]);
        });
        for (var gi = 0; gi < groups.length; gi++) {
            var rows = groups[gi];
            // Multiple aligned, evenly spaced anchors plus readable text
            // reduce the chance of mistaking unrelated UI for a dialogue.
            if (rows.length < 2 || rows.length > 5) continue;
            var gap = rows[1].y - rows[0].y;
            if (rows.some(function (r, i) { return i && Math.abs(r.y - rows[i - 1].y - gap) > 2; })) continue;
            var opts = this.readOptions(img, rows);
            if (opts.length !== rows.length || opts.some(function (o) { return !o.text || o.text.trim().length < 2; })) continue;
            // Bound the buttons themselves, without assuming window width.
            var scanX = rows[0].x, scanY = rows[0].y;
            var data = img.toData(scanX, scanY, Math.min(710, img.x + img.width - scanX),
                Math.min(img.y + img.height - scanY, rows[rows.length - 1].y - scanY + 16));
            var right = rows[0].x + 80;
            rows.forEach(function (r) {
                var y = r.y + 7 - scanY, lastDark = r.x + 80;
                for (var x = r.x + 30; x < Math.min(img.x + img.width, r.x + 700); x++) {
                    var k = (y * data.width + x - scanX) * 4;
                    if (data.data[k] + data.data[k + 1] + data.data[k + 2] < 250) lastDark = x;
                    if (x - lastDark > 20) break;
                }
                right = Math.max(right, lastDark + 6);
            });
            var left = Math.max(img.x, rows[0].x - 5);
            var top = Math.max(img.y, rows[0].y - 20);
            this.pos = { x: left, y: top, width: Math.min(right, img.x + img.width) - left,
                height: Math.min(img.y + img.height, rows[rows.length - 1].y + 22) - top, legacy: false };
            this.fallbackResult = { title: "", text: null, opts: opts };
            this.usingButtonFallback = true;
            this.fallbackKind = "options";
            return this.pos;
        }
        var frame = modernFrame(this, img);
        if (frame) return frame;
        this.pos = null;
        return false;
    };
    proto.read = function (img) {
        return this.usingButtonFallback ? this.fallbackResult : stockRead.call(this, img);
    };
})();

