const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const handler = require('../api/leads');
const realFetch = global.fetch;
afterEach(() => { global.fetch = realFetch; delete process.env.GOOGLE_SHEETS_WEBHOOK_URL; delete process.env.GOOGLE_SHEETS_SECRET; });
const lead = {name:'Integration Test',phone:'9000000000',email:'',course:'ADCA+ with AI',message:'=IMPORTXML("test")',submissionId:'12345678-1234-1234-1234-123456789012'};
async function call(overrides = {}) {
  const req = {method:'POST',headers:{'content-type':'application/json',host:'example.com',origin:'https://example.com'},body:{...lead},...overrides};
  const res = {setHeader(){},status(n){this.code=n;return this;},json(data){this.data=data;return this;}};
  await handler(req,res);
  return res;
}
function configured() {
  process.env.GOOGLE_SHEETS_WEBHOOK_URL='https://script.google.com/macros/s/test/exec';
  process.env.GOOGLE_SHEETS_SECRET='x'.repeat(64);
}
test('unconfigured storage never reports success', async () => {
  assert.equal((await call()).code,503);
});
test('rejects invalid phone, method, JSON, origin and oversized input', async () => {
  assert.equal((await call({body:{...lead,phone:'123'}})).code,400);
  assert.equal((await call({method:'GET'})).code,405);
  assert.equal((await call({body:'broken json'})).code,400);
  assert.equal((await call({headers:{'content-type':'application/json',host:'example.com',origin:'https://other.com'}})).code,403);
  assert.equal((await call({body:{...lead,message:'x'.repeat(2001)}})).code,400);
});
test('success requires a matching Google acknowledgement and keeps credentials private', async () => {
  configured();
  global.fetch=async(url,options)=>{
    const body=JSON.parse(options.body);
    assert.equal(body.secret,process.env.GOOGLE_SHEETS_SECRET);
    assert.equal(body.phone,lead.phone);
    return {ok:true,json:async()=>({success:true,submissionId:body.submissionId})};
  };
  const response=await call();
  assert.equal(response.code,200);
  assert.deepEqual(response.data,{success:true,submissionId:lead.submissionId});
});
test('HTML responses, Google failures and network errors preserve failure state', async () => {
  configured();
  for (const fake of [
    async()=>({ok:true,json:async()=>{throw new Error('HTML');}}),
    async()=>({ok:true,json:async()=>({success:false})}),
    async()=>({ok:true,json:async()=>({success:true,submissionId:'wrong'})}),
    async()=>{throw new Error('timeout');}
  ]) {global.fetch=fake; assert.equal((await call()).code,502);}
});
test('Apps Script verifies secret, escapes formulas, writes once, and releases lock', () => {
  const headers=['Received At (IST)','Student Name','Mobile','Email','Course','Message','Status','Source','Submission ID'];
  const rows=[headers]; let held=false;
  const sheet={getLastRow:()=>rows.length,getRange(row,col,count,width){return {
    getValues:()=>rows.slice(row-1,row-1+count).map(r=>r.slice(col-1,col-1+width)),
    setNumberFormat(){return this;},setValues(values){rows[row-1]=values[0];},
    createTextFinder(id){return {matchEntireCell(){return this;},useRegularExpression(){return this;},findNext(){return rows.find(r=>r[8]===id)||null;}};}
  };}};
  const context=vm.createContext({console,SpreadsheetApp:{openById:()=>({getSheetByName:()=>sheet}),flush(){}},
    PropertiesService:{getScriptProperties:()=>({getProperty:()=> 'private-test-secret'})},
    LockService:{getScriptLock:()=>({waitLock(){held=true;},hasLock:()=>held,releaseLock(){held=false;}})},
    ContentService:{MimeType:{JSON:'json'},createTextOutput:value=>({setMimeType:()=>JSON.parse(value)})}});
  vm.runInContext(fs.readFileSync(require.resolve('../integrations/google-sheets/Code.gs'),'utf8'),context);
  const post=body=>context.doPost({postData:{contents:JSON.stringify(body)}});
  assert.equal(post({...lead,secret:'wrong'}).success,false);
  assert.equal(rows.length,1);
  assert.equal(post({...lead,secret:'private-test-secret'}).success,true);
  assert.equal(rows.length,2);
  assert.ok(rows[1][5].startsWith("'="));
  assert.equal(post({...lead,secret:'private-test-secret'}).success,true);
  assert.equal(rows.length,2);
  assert.equal(held,false);
});
