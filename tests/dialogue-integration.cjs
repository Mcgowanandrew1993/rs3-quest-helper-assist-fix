const fs=require('fs'),vm=require('vm'),assert=require('assert');
let now=0,kind='closed',status='',done=0;
const ctx=vm.createContext({console,URL,Date:class extends Date{static now(){return now}},localStorage:{getItem(){return null},setItem(){}},document:{getElementById(){return {set textContent(v){status=v},classList:{toggle(){}}}}},alt1:{rsLinked:true},A1lib:{captureHoldFullRs(){return {}}}});ctx.window=ctx;
vm.runInContext(fs.readFileSync('./fallback-auto.js','utf8'),ctx);
const inject=`window.runAutoFixture=function(chat){
 guide={title:'test',sections:[]}; flatSteps=[{text:'Talk to Sir Amik Varze.',chat:chat,sectionIndex:0,stepIndex:0}];progress={};convo.key=null;optScreen.key=null;fallbackAuto.reset();autoAdvance=true;assistTickN=0;
 renderSteps=function(){};drawOptionBoxes=function(){};clearAssistOverlay=function(){};
 dialogReader={usingButtonFallback:true,fallbackKind:'options',find:function(){this.usingButtonFallback=true;this.fallbackKind=window.fixtureKind;return window.fixtureKind==='closed'?false:{x:0,y:0,width:520,height:145}},read:function(){return window.fixtureKind==='options'?{title:'',opts:[{text:'Who are you?'},{text:'I seek a quest!'},{text:'Other'},{text:'Farewell.'}]}:{title:'',text:[]}}};
 return function(){assistTick();return !!progress.test.done['0:0']};
};`;
let app=fs.readFileSync('./app.js','utf8').replace(/\tinit\(\);\s*\}\)\(\);\s*$/,inject+'\n})();');vm.runInContext(app,ctx);
function frames(run,k,n){ctx.fixtureKind=k;let result;for(let i=0;i<n;i++){now+=200;result=run();assert(!status.includes('read failed'),status)}return result}
let run=ctx.runAutoFixture('2 I seek a quest!');assert(!frames(run,'options',10));assert(!frames(run,'closed',30));console.log('PASS integration: closing a highlighted menu without response cannot tick');
run=ctx.runAutoFixture('2 I seek a quest!');frames(run,'options',10);assert(!frames(run,'response',20));assert(frames(run,'closed',12));console.log('PASS integration: choice, response, then closure ticks actual guide progress');
run=ctx.runAutoFixture('2 I seek a quest! / Accept');frames(run,'options',10);frames(run,'response',10);assert(!frames(run,'closed',30));frames(run,'response',10);assert(frames(run,'closed',12));console.log('PASS integration: quest offer pause holds, following response and closure tick');



