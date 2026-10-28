const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx=vm.createContext({console});vm.runInContext(fs.readFileSync('./fallback-auto.js','utf8'),ctx);
const T=ctx.QuestFallbackAuto;let count=0;
function test(name,fn){fn();count++;console.log('PASS',name)}
function input(t,kind,extra={}){return t.observe({key:'step',now:0,kind,fallback:true,match:kind==='options'?{subIndex:null}:null,index:kind==='options'?0:-1,last:0,signature:'menu',...extra})}
function menu(t,extra){input(t,'options',extra);return input(t,'options',extra)}
function response(t,extra){input(t,'response',extra);return input(t,'response',extra)}
test('seeing the correct choice never completes on its own',()=>{let t=new T();menu(t);assert(input(t,'closed').hold)});
test('one noisy menu frame is insufficient',()=>{let t=new T();input(t,'options');response(t);assert(input(t,'closed').hold)});
test('one noisy response frame is insufficient',()=>{let t=new T();menu(t);input(t,'response');assert(input(t,'closed').hold)});
test('stable expected choice then NPC response enables completion',()=>{let t=new T();menu(t);assert(response(t).ready);assert(input(t,'closed').ready)});
test('unreadable options cannot count as a response',()=>{let t=new T();menu(t);for(let i=0;i<10;i++)input(t,'unknown');assert(input(t,'closed').hold)});
test('multi-pick chain never finishes after its first choice',()=>{let t=new T();menu(t,{last:2});response(t);for(let i=0;i<100;i++)assert(input(t,'closed').hold)});
test('multi-pick chain completes after final choice and response',()=>{let t=new T();menu(t,{last:2});response(t);menu(t,{index:1,last:2,requiredIndices:[0,1,2],signature:'middle menu'});response(t);menu(t,{index:2,last:2,requiredIndices:[0,1,2],signature:'last menu'});response(t);assert(input(t,'closed').ready)});
test('step changes discard old evidence',()=>{let t=new T();menu(t);response(t);assert(input(t,'closed',{key:'next step'}).hold)});
test('substep changes discard old evidence',()=>{let t=new T();menu(t);response(t);menu(t,{match:{subIndex:1}});assert(input(t,'closed').hold)});
test('Accept does not complete at the quest offer',()=>{let t=new T();menu(t,{needsAccept:true});response(t);assert(input(t,'closed',{now:2000}).hold);assert(input(t,'closed',{now:20000}).hold)});
test('Accept needs a response following the offer interval',()=>{let t=new T();menu(t,{needsAccept:true});response(t);input(t,'closed',{now:2000});response(t,{now:4000});assert(input(t,'closed',{now:6000}).ready)});
test('ordinary reader is unaffected before fallback is used',()=>{let t=new T();assert(!input(t,'closed',{fallback:false}).hold)});
test('reset prevents repeated or carried-over completion',()=>{let t=new T();menu(t);response(t);t.reset();assert(input(t,'closed').hold)});
test('missing an intermediate choice keeps Auto paused',()=>{let t=new T();menu(t,{last:2,requiredIndices:[0,1,2]});response(t);menu(t,{index:2,last:2,requiredIndices:[0,1,2],signature:'last menu'});response(t);assert(input(t,'closed').hold)});
test('direct offer before any reply can finish after acceptance response',()=>{let t=new T();menu(t,{needsAccept:true});assert(input(t,'offer').hold);assert(response(t).ready);assert(input(t,'closed').ready)});
test('offer alone or dismissed offer never completes',()=>{let t=new T();menu(t,{needsAccept:true});input(t,'offer');for(let i=0;i<20;i++)assert(input(t,'closed').hold)});




