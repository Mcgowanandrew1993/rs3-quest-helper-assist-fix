/* Completion rewards are definitive evidence, independent of dialogue Auto.
 * Locate reward chrome first; OCR only its small message area, locally.
 */
(function (root) {
    "use strict";
    function normalise(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
    function matchesReward(text, quest) {
        var m = /\byou\s+have\s+completed\s+([^!]+)!/i.exec(text || "");
        if (!(m && normalise(quest) && normalise(m[1]) === normalise(quest))) return false;
        // Hazeel Cult deliberately shows a false finish on the Carnillean
        // route. Its genuine reward includes one Quest Point; five coins
        // or the quest name alone are insufficient evidence.
        if (normalise(quest) === "hazeelcult") {
            return /\b1\s+quest\s+point\b/i.test(text) && !/\bor\s+not\b/i.test(text);
        }
        return true;
    }
    function matchesChat(text, quest) {
        if (normalise(quest) === "hazeelcult") return false;
        var m = /\byou\s+have\s+completed\s*:?\s*['"]?(.+?)(?:!|['"]?\s*[-–—]|$)/i.exec(text || "");
        return !!(m && normalise(quest) && normalise(m[1]) === normalise(quest));
    }
    function Reader() {
        this.templates = null; this.busy = false; this.worker = null;
        this.nextScan = 0; this.lastQuest = null; this.error = null;
        var self = this, keys = Object.keys(QuestCompletionFrame);
        Promise.all(keys.map(function (k) { return A1lib.ImageDetect.imageDataFromBase64(QuestCompletionFrame[k]); }))
            .then(function (images) { self.templates = {}; keys.forEach(function (k, i) { self.templates[k] = images[i]; }); })
            .catch(function () { self.error = "Could not load reward-window images"; });
    }
    Reader.prototype.find = function (img) {
        if (!img || !this.templates) return null;
        var t = this.templates, lefts = img.findSubimage(t.tl);
        for (var i = 0; i < lefts.length; i++) {
            var p = lefts[i];
            if (img.width - p.x < 500 || img.height - p.y < 160) continue;
            var rights = img.findSubimage(t.tr, p.x + 450, p.y, Math.min(80, img.width - p.x - 450), 24);
            if (!rights.length) continue;
            var banners = img.findSubimage(t.banner, p.x + 130, p.y + 8, 250, 46);
            if (!banners.length) continue;
            var x = img.x + p.x + 40, y = img.y + banners[0].y + 91;
            var width = rights[0].x - p.x - 56, height = 54;
            if (x + width > img.x + img.width || y + height > img.y + img.height) continue;
            return { x: x, y: y, width: width, height: height };
        }
        return null;
    };
    Reader.prototype.getWorker = function () {
        if (!this.worker) {
            // Alt1 may cache pages under file://. Workers must still load
            // through the local HTTP service, never a file-relative URL.
            var base = location.protocol === "file:" ? "http://127.0.0.1:8765/" : location.href;
            this.worker = Tesseract.createWorker("eng", 1, {
                workerPath: new URL("ocr/worker.min.js", base).href,
                corePath: new URL("ocr/core/", base).href,
                langPath: new URL("ocr/lang/", base).href,
                gzip: false, cacheMethod: "none", workerBlobURL: true
            }).then(function (worker) {
                return worker.setParameters({ tessedit_pageseg_mode: "6" }).then(function () { return worker; });
            });
        }
        return this.worker;
    };
    Reader.prototype.scan = function (img, quest, complete) {
        if (this.busy || Date.now() < this.nextScan) return;
        this.nextScan = Date.now() + 1000;
        var area = this.find(img);
        if (!area) return;
        if (normalise(quest) === "hazeelcult") area.height = Math.min(160, img.y + img.height - area.y);
        var data = img.toData(area.x, area.y, area.width, area.height);
        var canvas = document.createElement("canvas");
        canvas.width = data.width; canvas.height = data.height;
        canvas.getContext("2d").putImageData(data, 0, 0);
        var enlarged = document.createElement("canvas");
        enlarged.width = data.width * 3; enlarged.height = data.height * 3;
        enlarged.getContext("2d").drawImage(canvas, 0, 0, enlarged.width, enlarged.height);
        var self = this;
        this.busy = true;
        Promise.resolve().then(function () { return self.getWorker(); })
            .then(function (worker) { return worker.recognize(enlarged); })
            .then(function (result) {
                self.lastText = result.data.text;
                self.error = null;
                if (matchesReward(result.data.text, quest)) complete(quest);
            }).catch(function (err) {
                self.error = "Reward text reader failed: " + (err && err.message ? err.message : String(err));
                self.worker = null;
            }).finally(function () { self.busy = false; });
    };
    Reader.matchesReward = matchesReward;
    Reader.matchesChat = matchesChat;
    Reader.normalise = normalise;
    root.QuestCompletionReader = Reader;
})(typeof window !== "undefined" ? window : globalThis);
