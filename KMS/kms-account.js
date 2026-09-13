
/* Tangooos Systems - KMS Account Gate, Trial Control & Cloud Sync */
(function () {
'use strict';

var FB = {
  apiKey: 'AIzaSyAhi_-AJ1HWDP4Ug1-7gAAbxQE1oWu9g9c',
  authDomain: 'tangooos-kms.firebaseapp.com',
  projectId: 'tangooos-kms',
  storageBucket: 'tangooos-kms.firebasestorage.app',
  messagingSenderId: '91810883856',
  appId: '1:91810883856:web:604647d3869dfd4f035d95'
};

var TRIAL_DAYS = 30;
var CHUNK = 700000;
var SUPPORT = 'systems@tangooos.com';
var SESSION_KEY = 'kms_cloud_session';

var auth = null, db = null, uid = null, mode = 'login', syncOn = false, acct = null;

function isAr(){ try { return localStorage.getItem('kms_lang') === 'ar'; } catch (e) { return false; } }
function T(en, arv){ return isAr() ? arv : en; }
function $(id){ return document.getElementById(id); }

function dataKeys(){
  var out = [];
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('kms_') === 0 && k !== SESSION_KEY) out.push(k);
    }
  } catch (e) {}
  return out;
}

function clearLocalData(){
  var ks = dataKeys();
  for (var i = 0; i < ks.length; i++) { try { localStorage.removeItem(ks[i]); } catch (e) {} }
}

/* ---------------- styles ---------------- */
var CSS = ''
+ '#kms-auth-gate{position:fixed;inset:0;z-index:2147483000;background:linear-gradient(160deg,#0B2545 0%,#09182B 100%);display:flex;align-items:center;justify-content:center;padding:24px;overflow:auto;text-align:start;font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}'
+ 'body:not(.kms-locked) #kms-auth-gate{display:none!important}'
+ 'body.kms-locked > *:not(#kms-auth-gate){display:none!important}'
+ '.kag-card{position:relative;background:#fff;border-radius:18px;padding:30px 32px 26px;width:390px;max-width:94vw;box-shadow:0 18px 70px rgba(0,0,0,.45);box-sizing:border-box}'
+ '.kag-logo{display:block;margin:6px auto 16px;width:142px;height:auto}'
+ '.kag-lang{position:absolute;top:12px;inset-inline-end:12px;padding:5px 12px;border:1px solid #D3DEED;background:#F7FAFD;border-radius:20px;font-size:11px;font-weight:700;color:#5A7090;cursor:pointer;font-family:inherit;transition:.15s}'
+ '.kag-lang:hover{background:#EDF1F7;color:#1A5FA8;border-color:#B9CBE2}'
+ '.kag-title{font-size:20px;font-weight:700;color:#1A2B40;text-align:center;margin:8px 0 4px}'
+ '.kag-sub{font-size:12.5px;color:#5A7090;text-align:center;margin-bottom:22px;line-height:1.5}'
+ '.kag-tabs{display:flex;background:#EDF1F7;border-radius:10px;padding:4px;margin-bottom:20px}'
+ '.kag-tab{flex:1;padding:9px 6px;border:none;background:transparent;border-radius:7px;font-size:13px;font-weight:600;color:#5A7090;cursor:pointer;font-family:inherit;transition:.15s}'
+ '.kag-tab.kag-on{background:#fff;color:#0B2545;box-shadow:0 1px 4px rgba(11,37,69,.12)}'
+ '.kag-field{margin-bottom:13px}'
+ '.kag-field label{display:block;text-align:start;font-size:11.5px;font-weight:600;color:#5A7090;margin-bottom:5px}'
+ '.kag-field input{width:100%;text-align:start;padding:11px 13px;border-radius:9px;border:1.5px solid #D3DEED;background:#F7FAFD;color:#1A2B40;font-size:14px;font-family:inherit;box-sizing:border-box;outline:none;transition:.15s}'
+ '.kag-field input:focus{border-color:#1A5FA8;background:#fff;box-shadow:0 0 0 3px rgba(26,95,168,.12)}'
+ '.kag-btn{width:100%;margin-top:8px;padding:13px;border:none;border-radius:9px;background:#1A5FA8;color:#fff;font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;transition:.15s}'
+ '.kag-btn:hover:not(:disabled){background:#145090}'
+ '.kag-btn:disabled{opacity:.6;cursor:default}'
+ '.kag-btn.kag-ghost{background:#EDF1F7;color:#1A2B40;margin-top:9px}'
+ '.kag-btn.kag-ghost:hover:not(:disabled){background:#DFE7F2}'
+ '.kag-msg{margin-top:12px;font-size:12.5px;font-weight:600;color:#15A86A;text-align:center;min-height:16px;line-height:1.45}'
+ '.kag-msg.kag-err{color:#D93535}'
+ '.kag-links{margin-top:14px;text-align:center}'
+ '.kag-links a{font-size:12px;color:#5A7090;text-decoration:none;cursor:pointer}'
+ '.kag-links a:hover{color:#1A5FA8;text-decoration:underline}'
+ '.kag-foot{margin-top:16px;padding-top:14px;border-top:1px solid #EDF1F7;font-size:11.5px;color:#8FA3BC;text-align:center;line-height:1.6}'
+ '.kag-spin{width:34px;height:34px;margin:6px auto 16px;border:3px solid #E3EBF5;border-top-color:#1A5FA8;border-radius:50%;animation:kagspin .8s linear infinite}'
+ '@keyframes kagspin{to{transform:rotate(360deg)}}'
+ '.kag-big{font-size:40px;text-align:center;margin-bottom:10px}'
+ '#kms-trial-badge{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:20px;font-size:11px;font-weight:700;background:rgba(245,166,35,.16);color:#F5A623;border:1px solid rgba(245,166,35,.4);white-space:nowrap}'
+ '#kms-trial-badge.kms-paid{background:rgba(21,168,106,.16);color:#15A86A;border-color:rgba(21,168,106,.4)}'
+ '#kms-trial-badge.kms-low{background:rgba(217,53,53,.16);color:#E85050;border-color:rgba(217,53,53,.4)}';

/* ---------------- gate markup ---------------- */
var HTML = ''
+ '<div class="kag-card">'
+ '  <button class="kag-lang" id="kag-lang"></button>'
+ '  <img class="kag-logo" id="kag-logo" src="tangooos-logo.png" alt="Tangooos Systems">'
+ '  <div id="kag-pane-auth">'
+ '    <div class="kag-title" id="kag-h1"></div>'
+ '    <div class="kag-sub" id="kag-h2"></div>'
+ '    <div class="kag-tabs">'
+ '      <button class="kag-tab kag-on" id="kag-tab-login"></button>'
+ '      <button class="kag-tab" id="kag-tab-signup"></button>'
+ '    </div>'
+ '    <div class="kag-field" id="kag-wrap-company" style="display:none"><label id="kag-lb-company"></label><input type="text" id="kag-company" autocomplete="organization"></div>'
+ '    <div class="kag-field"><label id="kag-lb-email"></label><input type="email" id="kag-email" autocomplete="username"></div>'
+ '    <div class="kag-field"><label id="kag-lb-pass"></label><input type="password" id="kag-pass" autocomplete="current-password"></div>'
+ '    <button class="kag-btn" id="kag-submit"></button>'
+ '    <div class="kag-msg" id="kag-msg"></div>'
+ '    <div class="kag-links"><a id="kag-forgot"></a></div>'
+ '    <div class="kag-foot" id="kag-foot"></div>'
+ '  </div>'
+ '  <div id="kag-pane-busy" style="display:none">'
+ '    <div class="kag-spin"></div>'
+ '    <div class="kag-title" id="kag-busy-t"></div>'
+ '    <div class="kag-sub" id="kag-busy-s"></div>'
+ '  </div>'
+ '  <div id="kag-pane-expired" style="display:none">'
+ '    <div class="kag-big">\u23F3</div>'
+ '    <div class="kag-title" id="kag-exp-t"></div>'
+ '    <div class="kag-sub" id="kag-exp-s"></div>'
+ '    <button class="kag-btn kag-ghost" id="kag-exp-out"></button>'
+ '  </div>'
+ '  <div id="kag-pane-verify" style="display:none">'
+ '    <div class="kag-big">\u2709</div>'
+ '    <div class="kag-title" id="kag-ver-t"></div>'
+ '    <div class="kag-sub" id="kag-ver-s"></div>'
+ '    <button class="kag-btn" id="kag-ver-go"></button>'
+ '    <button class="kag-btn kag-ghost" id="kag-ver-re"></button>'
+ '    <div class="kag-msg" id="kag-ver-msg"></div>'
+ '    <div class="kag-links"><a id="kag-ver-out"></a></div>'
+ '  </div>'
+ '  <div id="kag-pane-import" style="display:none">'
+ '    <div class="kag-big">\uD83D\uDCE6</div>'
+ '    <div class="kag-title" id="kag-imp-t"></div>'
+ '    <div class="kag-sub" id="kag-imp-s"></div>'
+ '    <button class="kag-btn" id="kag-imp-yes"></button>'
+ '    <button class="kag-btn kag-ghost" id="kag-imp-no"></button>'
+ '  </div>'
+ '</div>';

function mount(){
  var st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);
  var g = document.createElement('div');
  g.id = 'kms-auth-gate';
  g.innerHTML = HTML;
  document.body.appendChild(g);
  document.body.classList.add('kms-locked');
}

function pane(name){
  var all = ['auth','busy','expired','import','verify'];
  for (var i = 0; i < all.length; i++) {
    var e = $('kag-pane-' + all[i]);
    if (e) e.style.display = (all[i] === name) ? '' : 'none';
  }
}

function busy(title, sub){
  pane('busy');
  $('kag-busy-t').textContent = title;
  $('kag-busy-s').textContent = sub || '';
}

function msg(text, isErr){
  var m = $('kag-msg');
  if (!m) return;
  m.textContent = text || '';
  m.className = 'kag-msg' + (isErr ? ' kag-err' : '');
}

/* ---------------- text ---------------- */
function paint(){
  $('kag-lang').textContent = isAr() ? 'English' : 'العربية';
  $('kag-h1').textContent = T('Keys Management System', 'نظام إدارة المفاتيح');
  $('kag-h2').textContent = mode === 'signup'
    ? T('Create your account and start a ' + TRIAL_DAYS + '-day free trial.', 'أنشئ حسابك وابدأ فترة تجريبية مجانية لمدة ' + TRIAL_DAYS + ' يوماً.')
    : T('Sign in to your account to continue.', 'سجّل الدخول إلى حسابك للمتابعة.');
  $('kag-tab-login').textContent = T('Log In', 'تسجيل الدخول');
  $('kag-tab-signup').textContent = T('Create Account', 'حساب جديد');
  $('kag-lb-company').textContent = T('Company name', 'اسم الشركة');
  $('kag-lb-email').textContent = T('Email address', 'البريد الإلكتروني');
  $('kag-lb-pass').textContent = T('Password', 'كلمة المرور');
  $('kag-submit').textContent = mode === 'signup' ? T('Create Account', 'إنشاء الحساب') : T('Log In', 'تسجيل الدخول');
  $('kag-forgot').textContent = T('Forgot your password?', 'نسيت كلمة المرور؟');
  $('kag-foot').innerHTML = T(
    TRIAL_DAYS + '-day free trial. No card required.<br>Need help? ' + SUPPORT,
    'تجربة مجانية ' + TRIAL_DAYS + ' يوماً بدون بطاقة ائتمان.<br>للمساعدة: ' + SUPPORT);
  $('kag-wrap-company').style.display = mode === 'signup' ? '' : 'none';
  $('kag-pass').setAttribute('autocomplete', mode === 'signup' ? 'new-password' : 'current-password');
  $('kag-tab-login').className = 'kag-tab' + (mode === 'login' ? ' kag-on' : '');
  $('kag-tab-signup').className = 'kag-tab' + (mode === 'signup' ? ' kag-on' : '');
  try { document.getElementById('kms-auth-gate').dir = isAr() ? 'rtl' : 'ltr'; } catch (e) {}
}

/* ---------------- cloud sync ---------------- */
function dataCol(){ return db.collection('users').doc(uid).collection('data'); }

function pushKey(key){
  var val = null;
  try { val = localStorage.getItem(key); } catch (e) {}
  if (val === null) return dataCol().doc(key).delete().catch(function(){});
  var parts = [];
  for (var i = 0; i < val.length; i += CHUNK) parts.push(val.substr(i, CHUNK));
  if (!parts.length) parts = [''];
  var batch = db.batch();
  batch.set(dataCol().doc(key), { k: key, parts: parts.length, v: parts[0], t: Date.now() });
  for (var j = 1; j < parts.length; j++) batch.set(dataCol().doc(key + '__' + j), { v: parts[j] });
  return batch.commit();
}

function pullAll(){
  return dataCol().get().then(function (snap) {
    var main = {}, extra = {};
    snap.forEach(function (d) {
      if (d.id.indexOf('__') > -1) extra[d.id] = (d.data() || {}).v || '';
      else main[d.id] = d.data() || {};
    });
    var out = {};
    Object.keys(main).forEach(function (k) {
      var m = main[k], s = m.v || '';
      var n = m.parts || 1;
      for (var j = 1; j < n; j++) s += (extra[k + '__' + j] || '');
      out[k] = s;
    });
    return out;
  });
}

function pushAllLocal(){
  var ks = dataKeys(), chain = Promise.resolve();
  ks.forEach(function (k) { chain = chain.then(function () { return pushKey(k); }); });
  return chain;
}

var dirty = {}, timer = null;
function queue(key){
  if (!syncOn || !uid) return;
  dirty[key] = 1;
  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, 1200);
}
function flush(){
  timer = null;
  var ks = Object.keys(dirty);
  dirty = {};
  var chain = Promise.resolve();
  ks.forEach(function (k) { chain = chain.then(function () { return pushKey(k); }); });
  return chain.catch(function (e) { try { console.warn('KMS cloud sync failed', e); } catch (e2) {} });
}

function hookStorage(){
  var proto = window.Storage && window.Storage.prototype;
  if (!proto || proto.__kmsHooked) return;
  var oSet = proto.setItem, oRem = proto.removeItem;
  proto.setItem = function (k, v) {
    oSet.call(this, k, v);
    try { if (this === window.localStorage && k && k.indexOf('kms_') === 0 && k !== SESSION_KEY) queue(k); } catch (e) {}
  };
  proto.removeItem = function (k) {
    oRem.call(this, k);
    try { if (this === window.localStorage && k && k.indexOf('kms_') === 0 && k !== SESSION_KEY) queue(k); } catch (e) {}
  };
  proto.__kmsHooked = 1;
}

/* ---------------- account / trial ---------------- */
function daysLeft(a){
  if (!a) return 0;
  var start = a.trialStartedAt && a.trialStartedAt.toMillis ? a.trialStartedAt.toMillis() : Date.now();
  var days = a.trialDays || TRIAL_DAYS;
  var d = Math.ceil((start + days * 86400000 - Date.now()) / 86400000);
  if (d > days) d = days;
  if (d < 0) d = 0;
  return d;
}
function isActive(a){ return !!a && (a.status === 'active' || daysLeft(a) > 0); }

function loadAccount(user){
  var ref = db.collection('users').doc(user.uid);
  return ref.get().then(function (snap) {
    if (snap.exists) return snap.data();
    var seed = {
      email: user.email || '',
      companyName: (window.__kagPendingCompany || ''),
      status: 'trial',
      trialDays: TRIAL_DAYS,
      trialStartedAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    return ref.set(seed).then(function () { return ref.get(); }).then(function (s) { return s.data(); });
  });
}

/* ---------------- unlock / badge ---------------- */
function markSynced(){
  try {
    sessionStorage.setItem(SESSION_KEY, uid);
    return sessionStorage.getItem(SESSION_KEY) === uid;
  } catch (e) { return false; }
}

function neutralBrandingIfFresh(tries){
  try {
    if (localStorage.getItem('kms_branding')) return;
    if (typeof I18N === 'undefined' || !I18N.en || !I18N.ar) {
      var t = tries || 0;
      if (t < 60) setTimeout(function(){ neutralBrandingIfFresh(t + 1); }, 250);
      return;
    }
    I18N.en.app_company = 'Your Company Name'; I18N.ar.app_company = 'اسم شركتك';
    I18N.en.app_subtitle = 'Site / Location'; I18N.ar.app_subtitle = 'الموقع';
    I18N.en.app_contractor_role = ''; I18N.ar.app_contractor_role = '';
    I18N.en.app_contractor_name = ''; I18N.ar.app_contractor_name = '';
    I18N.en.app_title = 'Keys Management System'; I18N.ar.app_title = 'نظام إدارة المفاتيح';
    if (typeof applyStaticI18n === 'function') applyStaticI18n();
    var a = document.getElementById('eac-logo'), b2 = document.getElementById('ora-logo');
    if (a) a.style.display = 'none';
    if (b2) b2.style.display = 'none';
  } catch (e) {}
}

function reconcile(){
  if (!uid || !syncOn) return;
  dataCol().get().then(function (snap) {
    var have = {};
    snap.forEach(function (d) { have[d.id] = 1; });
    var ks = dataKeys();
    for (var i = 0; i < ks.length; i++) if (!have[ks[i]]) queue(ks[i]);
  }).catch(function () {});
}

function unlock(){
  syncOn = true;
  document.body.classList.remove('kms-locked');
  var g = $('kms-auth-gate');
  if (g) g.style.display = 'none';
  neutralBrandingIfFresh();
  setTimeout(function(){ neutralBrandingIfFresh(); }, 1500);
  injectHeader();
  setTimeout(reconcile, 3000);
}

function reloadNow(){
  var ok = markSynced();
  if (ok) { location.reload(); }
  else { unlock(); }
}

function injectHeader(){
  if ($('kms-trial-badge')) { paintBadge(); return; }
  var anchor = document.getElementById('kmsSetupBtn') || document.getElementById('themeBtn');
  if (!anchor || !anchor.parentNode) { setTimeout(injectHeader, 400); return; }
  var badge = document.createElement('span');
  badge.id = 'kms-trial-badge';
  var out = document.createElement('button');
  out.id = 'kms-logout-btn';
  out.className = anchor.className;
  out.title = T('Sign out', 'تسجيل الخروج');
  out.textContent = '\u23FB';
  out.onclick = signOut;
  anchor.parentNode.insertBefore(badge, anchor);
  anchor.parentNode.insertBefore(out, anchor);
  paintBadge();
}

function paintBadge(){
  var b = $('kms-trial-badge');
  if (!b) return;
  if (!acct) { b.style.display = 'none'; return; }
  b.style.display = '';
  if (acct.status === 'active') {
    b.className = 'kms-paid';
    b.textContent = T('Licensed', 'مُرخَّص');
    return;
  }
  var d = daysLeft(acct);
  b.className = d <= 5 ? 'kms-low' : '';
  b.textContent = T('Trial: ' + d + (d === 1 ? ' day left' : ' days left'), 'المتبقي من التجربة: ' + d + ' يوم');
}

function signOut(){
  try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
  syncOn = false;
  flush();
  setTimeout(function () {
    clearLocalData();
    auth.signOut().then(function () { location.reload(); }).catch(function () { location.reload(); });
  }, 250);
}

function showExpired(){
  pane('expired');
  $('kag-exp-t').textContent = T('Trial period ended', 'انتهت الفترة التجريبية');
  $('kag-exp-s').innerHTML = T(
    'Your ' + TRIAL_DAYS + '-day trial for this account has finished. Your data is safe and will be restored as soon as your licence is activated.<br><br>To continue, contact <b>' + SUPPORT + '</b>',
    'انتهت فترتك التجريبية (' + TRIAL_DAYS + ' يوماً). بياناتك محفوظة وسيتم استعادتها فور تفعيل الترخيص.<br><br>للمتابعة يرجى التواصل: <b>' + SUPPORT + '</b>');
  $('kag-exp-out').textContent = T('Sign out', 'تسجيل الخروج');
  $('kag-exp-out').onclick = signOut;
}

function vmsg(text, isErr){
  var m = $('kag-ver-msg');
  if (!m) return;
  m.textContent = text || '';
  m.className = 'kag-msg' + (isErr ? ' kag-err' : '');
}

function sendVerify(user){
  if (!user) return;
  user.sendEmailVerification().then(function () {
    vmsg(T('Confirmation email sent to ' + user.email + '.',
           'تم إرسال رسالة التأكيد إلى ' + user.email + '.'), false);
  }).catch(function (e) {
    var c = (e && e.code) || '';
    if (c === 'auth/too-many-requests')
      vmsg(T('An email was just sent. Please wait a minute before asking for another.',
             'تم إرسال رسالة للتو. برجاء الانتظار دقيقة قبل طلب رسالة أخرى.'), true);
    else vmsg(errText(e), true);
  });
}

function showVerify(user){
  pane('verify');
  document.body.classList.add('kms-locked');
  var g = $('kms-auth-gate'); if (g) g.style.display = '';
  $('kag-ver-t').textContent = T('Confirm your email address', 'أكّد بريدك الإلكتروني');
  $('kag-ver-s').textContent = T(
    'We sent a confirmation link to ' + (user.email || '') + '. Open that link, then come back here and press Continue. If it has not arrived, check your spam folder.',
    'أرسلنا رابط تأكيد إلى ' + (user.email || '') + '. افتح الرابط ثم عُد إلى هنا واضغط متابعة. وإن لم تصلك الرسالة، تفقّد مجلد الرسائل غير المرغوب فيها.');
  $('kag-ver-go').textContent = T('I have confirmed — continue', 'لقد أكّدت — متابعة');
  $('kag-ver-re').textContent = T('Send the email again', 'إعادة إرسال الرسالة');
  $('kag-ver-out').textContent = T('Use a different email', 'استخدام بريد آخر');
  if (!window.__kagSent) { window.__kagSent = true; vmsg(''); sendVerify(user); }
  $('kag-ver-go').onclick = function () {
    vmsg(T('Checking...', 'جاري التحقق...'), false);
    user.reload().then(function () {
      var u = auth.currentUser;
      if (u && u.emailVerified) { window.__kagSent = false; onUser(u); }
      else vmsg(T('Not confirmed yet. Open the link in the email, then press Continue.',
                  'لم يتم التأكيد بعد. افتح الرابط الموجود في الرسالة ثم اضغط متابعة.'), true);
    }).catch(function (e) { vmsg(errText(e), true); });
  };
  $('kag-ver-re').onclick = function () { sendVerify(auth.currentUser || user); };
  $('kag-ver-out').onclick = function () {
    window.__kagSent = false;
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
    auth.signOut();
  };
}

function hasLocalKeys(){
  try { return (localStorage.getItem('kms_keys') || '').length > 5; } catch (e) { return false; }
}

function showImport(){
  pane('import');
  var box = $('kag-pane-import');
  var local = hasLocalKeys();

  $('kag-imp-t').textContent = T('Set up your system', 'إعداد نظامك');
  $('kag-imp-s').textContent = local
    ? T('Choose how to start: restore a backup file exported from a Tangooos KMS system, carry over the key data already saved in this browser, or begin with an empty system.',
        'اختر كيف تبدأ: استعادة ملف نسخة احتياطية تم تصديره من نظام Tangooos KMS، أو نقل بيانات المفاتيح المحفوظة في هذا المتصفح، أو البدء بنظام فارغ.')
    : T('Choose how to start: restore a backup file (.json) exported from a Tangooos KMS system, or begin with an empty system and add your keys later.',
        'اختر كيف تبدأ: استعادة ملف نسخة احتياطية (.json) تم تصديره من نظام Tangooos KMS، أو البدء بنظام فارغ وإضافة المفاتيح لاحقاً.');

  var fi = $('kag-imp-file');
  if (!fi) {
    fi = document.createElement('input');
    fi.type = 'file';
    fi.id = 'kag-imp-file';
    fi.accept = '.json,application/json';
    fi.style.display = 'none';
    box.appendChild(fi);
    fi.onchange = function () { handleBackupFile(fi); };
  }
  var note = $('kag-imp-note');
  if (!note) {
    note = document.createElement('div');
    note.id = 'kag-imp-note';
    note.className = 'kag-msg';
    box.appendChild(note);
  }
  note.textContent = '';
  note.className = 'kag-msg';

  $('kag-imp-yes').textContent = T('Restore from a backup file', 'استعادة من ملف نسخة احتياطية');
  $('kag-imp-yes').onclick = function () {
    note.textContent = '';
    note.className = 'kag-msg';
    fi.value = '';
    fi.click();
  };

  var dev = $('kag-imp-dev');
  if (local) {
    if (!dev) {
      dev = document.createElement('button');
      dev.className = 'kag-btn kag-ghost';
      dev.id = 'kag-imp-dev';
      box.insertBefore(dev, $('kag-imp-no'));
    }
    dev.style.display = '';
    dev.textContent = T('Use the data already in this browser', 'استخدام البيانات الموجودة في هذا المتصفح');
    dev.onclick = function () {
      busy(T('Uploading your data...', 'جاري رفع البيانات...'), T('This may take a moment.', 'قد يستغرق ذلك لحظات.'));
      pushAllLocal().then(reloadNow).catch(function (e) { pane('auth'); msg(errText(e), true); });
    };
  } else if (dev) {
    dev.style.display = 'none';
  }

  $('kag-imp-no').textContent = T('Start with an empty system', 'البدء بنظام فارغ');
  $('kag-imp-no').onclick = function () {
    clearLocalData();
    try { localStorage.setItem('kms_started', '1'); } catch (e) {}
    busy(T('Preparing your system...', 'جاري تجهيز نظامك...'), T('One moment please.', 'لحظة من فضلك.'));
    pushAllLocal().then(reloadNow).catch(function () { reloadNow(); });
  };
}

function handleBackupFile(input){
  var file = input.files && input.files[0];
  if (!file) return;
  var note = $('kag-imp-note');
  function nmsg(t, isErr){ if (!note) return; note.textContent = t; note.className = 'kag-msg' + (isErr ? ' kag-err' : ''); }
  var bad = T('That file is not a Tangooos KMS backup. Export one from System Setup → Export Full Backup.',
              'هذا الملف ليس نسخة احتياطية من Tangooos KMS. يمكنك تصدير نسخة من إعداد النظام ← تصدير نسخة احتياطية كاملة.');
  nmsg(T('Reading file...', 'جاري قراءة الملف...'), false);
  var reader = new FileReader();
  reader.onload = function (e) {
    var data = null;
    try { data = JSON.parse(e.target.result); } catch (err) { data = null; }
    if (!data || typeof data !== 'object') { nmsg(bad, true); return; }
    var names = [];
    for (var k in data) { if (Object.prototype.hasOwnProperty.call(data, k) && k.indexOf('kms_') === 0) names.push(k); }
    if (!names.length) { nmsg(bad, true); return; }
    clearLocalData();
    for (var i = 0; i < names.length; i++) {
      var v = data[names[i]];
      try { localStorage.setItem(names[i], (typeof v === 'string') ? v : JSON.stringify(v)); } catch (er) {}
    }
    busy(T('Restoring your data...', 'جاري استعادة بياناتك...'), T('This may take a moment.', 'قد يستغرق ذلك لحظات.'));
    pushAllLocal().then(reloadNow).catch(function (er) { pane('auth'); msg(errText(er), true); });
  };
  reader.onerror = function () { nmsg(T('Could not read that file.', 'تعذّر قراءة الملف.'), true); };
  reader.readAsText(file);
}

/* ---------------- errors ---------------- */
function errText(e){
  var c = (e && e.code) || '';
  if (c === 'auth/invalid-email') return T('That email address is not valid.', 'البريد الإلكتروني غير صحيح.');
  if (c === 'auth/missing-password') return T('Please enter your password.', 'من فضلك أدخل كلمة المرور.');
  if (c === 'auth/weak-password') return T('Password must be at least 6 characters.', 'كلمة المرور يجب ألا تقل عن 6 أحرف.');
  if (c === 'auth/email-already-in-use') return T('An account already exists with this email. Try logging in.', 'يوجد حساب بهذا البريد بالفعل. جرّب تسجيل الدخول.');
  if (c === 'auth/invalid-credential' || c === 'auth/wrong-password' || c === 'auth/user-not-found')
    return T('Incorrect email or password.', 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
  if (c === 'auth/too-many-requests') return T('Too many attempts. Please wait a minute and try again.', 'محاولات كثيرة. انتظر دقيقة ثم حاول مجدداً.');
  if (c === 'auth/network-request-failed') return T('Network problem. Check your connection.', 'مشكلة في الاتصال بالإنترنت.');
  if (c === 'permission-denied') return T('Access denied by server rules.', 'تم رفض الوصول من قواعد الخادم.');
  return (e && e.message) ? e.message : T('Something went wrong. Please try again.', 'حدث خطأ. حاول مرة أخرى.');
}

/* ---------------- actions ---------------- */
function repaint(){
  paint();
  var ex = $('kag-pane-expired'), im = $('kag-pane-import'), vf = $('kag-pane-verify');
  if (ex && ex.style.display !== 'none') showExpired();
  else if (vf && vf.style.display !== 'none' && auth.currentUser) showVerify(auth.currentUser);
  else if (im && im.style.display !== 'none') showImport();
}

function submit(){
  var email = ($('kag-email').value || '').trim();
  var pass = $('kag-pass').value || '';
  var company = ($('kag-company').value || '').trim();
  if (!email) { msg(T('Please enter your email address.', 'من فضلك أدخل البريد الإلكتروني.'), true); return; }
  if (!pass) { msg(T('Please enter your password.', 'من فضلك أدخل كلمة المرور.'), true); return; }
  if (mode === 'signup' && !company) { msg(T('Please enter your company name.', 'من فضلك أدخل اسم الشركة.'), true); return; }
  msg('');
  $('kag-submit').disabled = true;
  $('kag-submit').textContent = T('Please wait...', 'برجاء الانتظار...');
  window.__kagPendingCompany = company;
  var p = (mode === 'signup')
    ? auth.createUserWithEmailAndPassword(email, pass)
    : auth.signInWithEmailAndPassword(email, pass);
  p.catch(function (e) {
    $('kag-submit').disabled = false;
    paint();
    msg(errText(e), true);
  });
}

function forgot(){
  var email = ($('kag-email').value || '').trim();
  if (!email) { msg(T('Enter your email above first, then click again.', 'أدخل بريدك الإلكتروني أولاً ثم اضغط مرة أخرى.'), true); return; }
  auth.sendPasswordResetEmail(email).then(function () {
    msg(T('Reset link sent. Check your inbox.', 'تم إرسال رابط إعادة التعيين. تفقّد بريدك.'), false);
  }).catch(function (e) { msg(errText(e), true); });
}

function onUser(user){
  if (!user) {
    uid = null; acct = null; syncOn = false;
    pane('auth');
    $('kag-submit').disabled = false;
    paint();
    try { $('kag-email').focus(); } catch (e) {}
    return;
  }
  uid = user.uid;
  if (!user.emailVerified) { showVerify(user); return; }
  var already = false;
  try { already = sessionStorage.getItem(SESSION_KEY) === uid; } catch (e) {}
  if (already) {
    unlock();
    loadAccount(user).then(function (a) {
      acct = a;
      if (!isActive(a)) { document.body.classList.add('kms-locked'); var g = $('kms-auth-gate'); if (g) g.style.display = ''; showExpired(); return; }
      paintBadge();
    }).catch(function () {});
    return;
  }
  busy(T('Opening your account...', 'جاري فتح حسابك...'), T('One moment please.', 'لحظة من فضلك.'));
  loadAccount(user).then(function (a) {
    acct = a;
    if (!isActive(a)) { showExpired(); return null; }
    busy(T('Syncing your data...', 'جاري مزامنة بياناتك...'), T('Fetching the latest from the cloud.', 'جلب أحدث نسخة من السحابة.'));
    return pullAll().then(function (cloud) {
      var cloudKeys = Object.keys(cloud);
      var localKeys = '';
      try { localKeys = localStorage.getItem('kms_keys') || ''; } catch (e) {}
      var hasLocal = localKeys.length > 5;
      if (!cloudKeys.length) { showImport(); return null; }
      clearLocalData();
      for (var i = 0; i < cloudKeys.length; i++) {
        try { localStorage.setItem(cloudKeys[i], cloud[cloudKeys[i]]); } catch (e) {}
      }
      reloadNow();
      return null;
    });
  }).catch(function (e) {
    pane('auth');
    $('kag-submit').disabled = false;
    paint();
    msg(errText(e), true);
  });
}

/* ---------------- boot ---------------- */
function boot(){
  mount();
  hookStorage();
  if (!window.firebase || !firebase.initializeApp) {
    pane('auth');
    msg(T('Could not reach the login service. Check your internet connection and refresh.', 'تعذّر الوصول لخدمة الدخول. تحقق من الإنترنت وأعد التحميل.'), true);
    return;
  }
  firebase.initializeApp(FB);
  auth = firebase.auth();
  db = firebase.firestore();
  try {
    var qp = new URLSearchParams(location.search).get('mode');
    if (qp === 'signup' || qp === 'login') mode = qp;
  } catch (eQp) {}
  paint();
  $('kag-lang').onclick = function () {
    var next = isAr() ? 'en' : 'ar';
    try { localStorage.setItem('kms_lang', next); } catch (e) {}
    repaint();
  };
  $('kag-tab-login').onclick = function () { mode = 'login'; msg(''); paint(); };
  $('kag-tab-signup').onclick = function () { mode = 'signup'; msg(''); paint(); };
  $('kag-submit').onclick = submit;
  $('kag-forgot').onclick = forgot;
  ['kag-email', 'kag-pass', 'kag-company'].forEach(function (id) {
    var e = $(id);
    if (e) e.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') submit(); });
  });
  window.addEventListener('beforeunload', function () { if (timer) { clearTimeout(timer); flush(); } });
  auth.onAuthStateChanged(onUser);
}

if (document.body) boot();
else document.addEventListener('DOMContentLoaded', boot);

window.kmsSignOut = signOut;
})();
