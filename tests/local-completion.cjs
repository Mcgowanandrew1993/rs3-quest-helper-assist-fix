const fs = require('fs'), vm = require('vm'), assert = require('assert');
const saved = {};
const c = vm.createContext({console, Date, URL, localStorage:{getItem(k){return saved[k] || null},setItem(k,v){saved[k]=v}},document:{getElementById(){return {textContent:'',classList:{toggle(){}}}}}}); c.window=c;
vm.runInContext(fs.readFileSync('fallback-auto.js','utf8'),c);
const inject = `window.fixture = {
setup:function(){guide={title:'Test/Quick guide',name:'Test'};flatSteps=[{sectionIndex:0,stepIndex:0},{sectionIndex:0,stepIndex:1}];progress={};rmStatuses={test:'NOT_STARTED'};renderSteps=function(){};},
mark:markQuestComplete,status:function(){return questStatus({title:'Test/Quick guide',name:'Test'})},
tick:function(i,done){setDone(flatSteps[i],done)},migrate:rememberCompletedGuides,
legacy:function(partial){progress={'Test/Quick guide':{done:partial?{'0:0':true}:{'0:0':true,'0:1':true}}}},
merge:function(){progress={};mergeProgress(progress,{'Test/Quick guide':{completed:true,done:{}}})}
};`;
vm.runInContext(fs.readFileSync('app.js','utf8').replace(/\tinit\(\);\s*\}\)\(\);\s*$/,inject+'\n})();'),c);
const f=c.fixture; f.setup(); f.mark(); assert.equal(f.status(),'COMPLETED');
f.tick(0,false); assert.equal(f.status(),'NOT_STARTED');
f.tick(0,true); assert.equal(f.status(),'COMPLETED');
f.merge(); assert.equal(f.status(),'COMPLETED');
saved['rs3qh-guides-v11']=JSON.stringify({'Test/Quick guide':{data:{sections:[{steps:[{},{}]}]}}});
f.legacy(false);f.migrate();assert.equal(f.status(),'COMPLETED');
f.legacy(true);f.migrate();assert.equal(f.status(),'NOT_STARTED');
console.log('PASS local completion overrides stale sync, undo reopens, all steps complete, import preserves completion, legacy full guides migrate, partial guides remain visible');
