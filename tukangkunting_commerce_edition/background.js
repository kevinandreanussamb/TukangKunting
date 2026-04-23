(function(){
  // ── Anti-debug ────────────────────────────────────────
  const _0x0=setInterval(function(){const _d=new Date();debugger;if(new Date()-_d>100){clearInterval(_0x0);}},3000);

  // ── String table ──────────────────────────────────────
  const _$=atob;
  const S={
    a:_$('R0FOVElfREVOR0FOX1NFQ1JFVF9BTUFOX01JTklNQUxfMzJfQ0hBUiEh'),
    b:_$('U0hBLTI1Ng=='),
    c:_$('QUVTLUdDTQ=='),
    d:_$('ZGVjcnlwdA=='),
    e:_$('cmF3'),
    f:_$('bGljZW5zZV90b2tlbg=='),
    g:_$('aW5zdGFsbF9pZA=='),
    h:_$('bWFjaGluZUNvZGU='),
    i:_$('ZXhwaXJ5'),
    j:_$('dG9rZW4gdGVybGFsdSBwZW5kZWs='),
    k:_$('bWFjaGluZSBjb2RlIHRpZGFrIGNvY29r'),
    l:_$('bGlzZW5zaSBzdWRhaCBleHBpcmVk'),
    m:_$('dG9rZW4gdGlkYWsgdmFsaWQ='),
    n:_$('aWQtSUQ='),
    o:_$('bnVtZXJpYw=='),
    p:_$('bG9uZw=='),
    q:_$('Y2hlY2tMaWNlbnNl'),
    r:_$('cGFzc3BocmFzZQ=='),
    s:_$('bm9fbGljZW5zZQ=='),
    v:_$('bGlicy9qcXVlcnktMy43LjAubWluLmpz'),
  };

  // ── Crypto helpers ────────────────────────────────────
  async function _h(s){
    const b=await crypto.subtle.digest(S.b,new TextEncoder().encode(s));
    return[...new Uint8Array(b)].map(x=>(x>>>0).toString(16).padStart(2,'0')).join('');
  }

  function _hb(h){
    const a=new Uint8Array(h.length/2);
    for(let i=0;i<a.length;i++)a[i]=parseInt(h.substr(i*2,2),16);
    return a;
  }

  async function _dk(){
    const r=await _h(S.a);
    return crypto.subtle.importKey(S.e,_hb(r.substring(0,64)),{name:S.c},false,[S.d]);
  }

  function _b64(b){
    const s=b.replace(/-/g,'+').replace(/_/g,'/');
    return Uint8Array.from(atob(s),c=>c.charCodeAt(0));
  }

  async function _gmc(){
    let r=await chrome.storage.local.get(S.g);
    if(!r[S.g]){
      r[S.g]=crypto.randomUUID();
      await chrome.storage.local.set({[S.g]:r[S.g]});
    }
    const d=[chrome.runtime.id,r[S.g]].join('|');
    return(await _h(d)).substring(0,32).toUpperCase();
  }

  async function _vt(t,mc){
    try{
      const p=_b64(t);
      if(p.length<28)return{ok:false,reason:S.j};
      const iv=p.slice(0,12),tg=p.slice(12,28),ct=p.slice(28);
      const ctt=new Uint8Array(ct.length+tg.length);
      ctt.set(ct);ctt.set(tg,ct.length);
      const k=await _dk();
      const dc=await crypto.subtle.decrypt({name:S.c,iv:iv,tagLength:128},k,ctt);
      const pl=JSON.parse(new TextDecoder().decode(dc));
      if(pl[S.h]!==mc)return{ok:false,reason:S.k};
      if(Date.now()>pl[S.i])return{ok:false,reason:S.l};
      return{ok:true,expiry:pl[S.i]};
    }catch(e){return{ok:false,reason:S.m};}
  }

  async function _csl(mc){
    const r=await chrome.storage.local.get(S.f);
    if(!r[S.f])return{ok:false};
    return _vt(r[S.f],mc);
  }

  function _fe(ts){
    return new Date(ts).toLocaleDateString(S.n,{day:S.o,month:S.p,year:S.o});
  }

  function _dl(ts){
    return Math.max(0,Math.ceil((ts-Date.now())/86400000));
  }

  // ── CSS ───────────────────────────────────────────────
  const _CSS_ACT='#tukang-act-overlay{position:fixed;inset:0;background:rgba(8,10,18,.75);backdrop-filter:blur(6px);z-index:10050;animation:tka-fadein .2s ease}#tukang-activation-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:420px;background:#0f1117;border:1px solid rgba(255,255,255,.08);border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,.6);z-index:10051;font-family:\'DM Sans\',sans-serif;color:#e2e8f0;overflow:hidden;animation:tka-slideup .25s cubic-bezier(.16,1,.3,1)}.tka-header{display:flex;align-items:center;justify-content:space-between;padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,.06)}.tka-title{font-size:14px;font-weight:600;color:#f0f2f8}.tka-close{width:30px;height:30px;border:none;background:transparent;cursor:pointer;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#4e5668;font-size:14px}.tka-close:hover{background:rgba(239,68,68,.12);color:#f87171}.tka-body{padding:18px 20px 20px}.tka-desc{font-size:12px;line-height:1.6;color:#94a3b8;margin-bottom:14px}.tka-label{font-size:11px;font-weight:500;color:#4e5668;letter-spacing:.07em;text-transform:uppercase;margin-bottom:6px;display:block}.tka-codebox{width:100%;padding:11px 13px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:8px;color:#7dd3fc;font-family:\'DM Mono\',monospace;font-size:13px;box-sizing:border-box;word-break:break-all;margin-bottom:14px;user-select:all}.tka-input{width:100%;padding:10px 13px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:8px;color:#e2e8f0;font-family:\'DM Mono\',monospace;font-size:13px;outline:none;box-sizing:border-box}.tka-input:focus{border-color:rgba(56,130,246,.5);box-shadow:0 0 0 3px rgba(56,130,246,.1)}.tka-expiry-info{font-size:11px;color:#4e5668;margin-top:8px;font-style:italic}.tka-actions{margin-top:16px;display:flex;gap:8px;justify-content:flex-end}.tka-btn-sec{padding:9px 18px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09);border-radius:8px;color:#a0aec0;font-family:\'DM Sans\',sans-serif;font-size:13px;font-weight:500;cursor:pointer}.tka-btn-sec:hover{background:rgba(255,255,255,.1);color:#e2e8f0}.tka-btn-pri{padding:9px 18px;background:linear-gradient(135deg,#3882f6,#2563eb);border:none;border-radius:8px;color:#fff;font-family:\'DM Sans\',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:opacity .15s,transform .12s}.tka-btn-pri:hover{opacity:.9;transform:translateY(-1px)}.tka-btn-pri:disabled{opacity:.5;cursor:not-allowed;transform:none}.tka-error{margin-top:10px;font-size:12px;color:#f87171;display:none}.tka-success{margin-top:14px;padding:14px 16px;background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);border-radius:10px;display:none}.tka-success-title{font-size:14px;font-weight:600;color:#22c55e;margin-bottom:8px;display:flex;align-items:center;gap:6px}.tka-success-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:12px}.tka-success-label{color:#64748b}.tka-success-value{color:#e2e8f0;font-weight:500;font-family:\'DM Mono\',monospace}.tka-success-value.green{color:#22c55e}.tka-success-value.orange{color:#f59e0b}.tka-success-value.red{color:#ef4444}.tka-success-bar-track{height:6px;background:rgba(255,255,255,.06);border-radius:3px;margin-top:10px;overflow:hidden}.tka-success-bar-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,#22c55e,#16a34a);transition:width .8s cubic-bezier(.4,0,.2,1)}.tka-success-actions{margin-top:14px;display:flex;justify-content:flex-end}.tka-spinner{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:tka-spin .6s linear infinite;margin-right:6px;vertical-align:middle}@keyframes tka-spin{to{transform:rotate(360deg)}}@keyframes tka-fadein{from{opacity:0}to{opacity:1}}@keyframes tka-slideup{from{opacity:0;transform:translate(-50%,calc(-50% + 12px)) scale(.97)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}';

  const _CSS_MAIN='@import url(\'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap\');#tukang-overlay{position:fixed;inset:0;background:rgba(8,10,18,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:9998;animation:tukang-fadeIn .2s ease}#doc-select-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(1);width:380px;background:#0f1117;border:1px solid rgba(255,255,255,.08);border-radius:16px;box-shadow:0 0 0 1px rgba(255,255,255,.04),0 24px 64px rgba(0,0,0,.6),0 0 80px rgba(56,130,246,.06);z-index:9999;font-family:\'DM Sans\',sans-serif;overflow:hidden;animation:tukang-slideUp .25s cubic-bezier(.16,1,.3,1)}.tukang-header{display:flex;align-items:center;justify-content:space-between;padding:20px 22px 16px;border-bottom:1px solid rgba(255,255,255,.06)}.tukang-brand{display:flex;align-items:center;gap:10px}.tukang-icon{width:32px;height:32px;background:linear-gradient(135deg,#3882f6,#2563eb);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 4px 12px rgba(56,130,246,.35)}.tukang-title{font-size:14px;font-weight:600;color:#f0f2f8;letter-spacing:-.01em}.tukang-subtitle{font-size:11px;color:#4e5668;font-weight:400;letter-spacing:.02em;margin-top:1px}.tukang-header-actions{display:flex;align-items:center;gap:4px}.tukang-icon-btn{width:30px;height:30px;border:none;background:transparent;cursor:pointer;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#4e5668;transition:background .15s,color .15s;font-size:15px}.tukang-icon-btn:hover{background:rgba(255,255,255,.07);color:#a0aec0}.tukang-icon-btn.close-btn:hover{background:rgba(239,68,68,.12);color:#f87171}.tukang-body{padding:20px 22px 22px}.tukang-label{font-size:11px;font-weight:500;color:#4e5668;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px}.tukang-select{width:100%;padding:10px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:9px;color:#e2e8f0;font-family:\'DM Sans\',sans-serif;font-size:13.5px;font-weight:400;outline:none;cursor:pointer;appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%234e5668\' stroke-width=\'2.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 13px center;background-size:13px;padding-right:36px;transition:border-color .15s,background .15s}.tukang-select:hover{border-color:rgba(255,255,255,.16);background-color:rgba(255,255,255,.06)}.tukang-select:focus{border-color:rgba(56,130,246,.5);box-shadow:0 0 0 3px rgba(56,130,246,.12)}.tukang-select option{background:#1a1d27;color:#e2e8f0}.tukang-divider{height:1px;background:rgba(255,255,255,.05);margin:18px 0}.tukang-submit{width:100%;padding:11px 18px;background:linear-gradient(135deg,#3882f6,#2563eb);border:none;border-radius:9px;color:#fff;font-family:\'DM Sans\',sans-serif;font-size:13.5px;font-weight:600;cursor:pointer;letter-spacing:-.01em;box-shadow:0 4px 14px rgba(56,130,246,.3);transition:opacity .15s,transform .12s,box-shadow .15s;position:relative;overflow:hidden}.tukang-submit:hover{opacity:.92;transform:translateY(-1px);box-shadow:0 6px 20px rgba(56,130,246,.4)}.tukang-submit:active{transform:translateY(0);opacity:1}.tukang-footer{padding:14px 22px;border-top:1px solid rgba(255,255,255,.05)}.tukang-license-info{display:flex;align-items:center;justify-content:space-between;gap:8px}.tukang-license-left{display:flex;align-items:center;gap:8px}.tukang-license-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;animation:tukang-pulse 2s infinite}.tukang-license-dot.green{background:#22c55e;box-shadow:0 0 6px rgba(34,197,94,.6)}.tukang-license-dot.orange{background:#f59e0b;box-shadow:0 0 6px rgba(245,158,11,.6)}.tukang-license-dot.red{background:#ef4444;box-shadow:0 0 6px rgba(239,68,68,.6)}.tukang-license-text{font-size:11px;color:#4e5668;font-family:\'DM Mono\',monospace}.tukang-license-badge{font-size:10px;padding:3px 8px;border-radius:6px;font-weight:600;font-family:\'DM Mono\',monospace}.tukang-license-badge.green{background:rgba(34,197,94,.1);color:#22c55e;border:1px solid rgba(34,197,94,.2)}.tukang-license-badge.orange{background:rgba(245,158,11,.1);color:#f59e0b;border:1px solid rgba(245,158,11,.2)}.tukang-license-badge.red{background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.2)}#tukang-settings-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);z-index:10000;animation:tukang-fadeIn .15s ease}#settings-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#0f1117;border:1px solid rgba(255,255,255,.08);border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,.6);z-index:10001;width:360px;font-family:\'DM Sans\',sans-serif;overflow:hidden;animation:tukang-slideUp .2s cubic-bezier(.16,1,.3,1)}.settings-header{display:flex;align-items:center;justify-content:space-between;padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,.06)}.settings-title{font-size:14px;font-weight:600;color:#f0f2f8;letter-spacing:-.01em;display:flex;align-items:center;gap:8px}.settings-title-icon{font-size:14px;opacity:.7}.settings-body{padding:18px 20px;max-height:400px;overflow-y:auto}.settings-body::-webkit-scrollbar{width:4px}.settings-body::-webkit-scrollbar-track{background:transparent}.settings-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:4px}.settings-info-box{background:rgba(56,130,246,.08);border:1px solid rgba(56,130,246,.18);border-radius:8px;padding:10px 13px;font-size:12px;color:#7aa8f5;line-height:1.5;margin-bottom:18px;display:flex;gap:8px}.settings-info-icon{flex-shrink:0;margin-top:1px;opacity:.8}.settings-field{margin-bottom:14px}.settings-field-label{font-size:11px;font-weight:500;color:#4e5668;letter-spacing:.07em;text-transform:uppercase;margin-bottom:6px;display:block}.settings-input{width:100%;padding:9px 13px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:8px;color:#e2e8f0;font-family:\'DM Mono\',monospace;font-size:13px;outline:none;transition:border-color .15s,box-shadow .15s;box-sizing:border-box}.settings-input:hover{border-color:rgba(255,255,255,.15)}.settings-input:focus{border-color:rgba(56,130,246,.5);box-shadow:0 0 0 3px rgba(56,130,246,.1)}.settings-footer{padding:14px 20px;border-top:1px solid rgba(255,255,255,.06);display:flex;gap:8px;justify-content:flex-end}.btn-secondary{padding:9px 18px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09);border-radius:8px;color:#a0aec0;font-family:\'DM Sans\',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:background .15s,color .15s}.btn-secondary:hover{background:rgba(255,255,255,.1);color:#e2e8f0}.btn-primary{padding:9px 18px;background:linear-gradient(135deg,#3882f6,#2563eb);border:none;border-radius:8px;color:#fff;font-family:\'DM Sans\',sans-serif;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 3px 10px rgba(56,130,246,.25);transition:opacity .15s,transform .12s}.btn-primary:hover{opacity:.9;transform:translateY(-1px)}@keyframes tukang-fadeIn{from{opacity:0}to{opacity:1}}@keyframes tukang-slideUp{from{opacity:0;transform:translate(-50%,calc(-50% + 12px)) scale(.97)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}@keyframes tukang-pulse{0%,100%{opacity:1}50%{opacity:.4}}';

  const _CSS_CSV='#tukang-faktur-overlay,#tukang-batal-overlay{position:fixed;inset:0;background:rgba(8,10,18,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:10060;animation:tkcsv-fadein .2s ease}#tukang-faktur-modal,#tukang-batal-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:680px;max-height:85vh;background:#0f1117;border:1px solid rgba(255,255,255,.08);border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,.6);z-index:10061;font-family:\'DM Sans\',sans-serif;color:#e2e8f0;overflow:hidden;display:flex;flex-direction:column;animation:tkcsv-slideup .25s cubic-bezier(.16,1,.3,1)}.tkcsv-header{display:flex;align-items:center;justify-content:space-between;padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0}.tkcsv-title{font-size:14px;font-weight:600;color:#f0f2f8;display:flex;align-items:center;gap:8px}.tkcsv-close{width:30px;height:30px;border:none;background:transparent;cursor:pointer;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#4e5668;font-size:14px;transition:background .15s,color .15s}.tkcsv-close:hover{background:rgba(239,68,68,.12);color:#f87171}.tkcsv-body{padding:18px 20px 20px;overflow-y:auto;flex:1}.tkcsv-desc{font-size:12px;line-height:1.6;color:#94a3b8;margin-bottom:16px}.tkcsv-btn-row{display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap}.tkcsv-btn{padding:9px 16px;border-radius:8px;font-family:\'DM Sans\',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.09);flex-shrink:0}.tkcsv-btn-outline{background:rgba(255,255,255,.04);color:#a0aec0}.tkcsv-btn-outline:hover{background:rgba(255,255,255,.08);color:#e2e8f0}.tkcsv-btn-primary{background:linear-gradient(135deg,#3882f6,#2563eb);color:#fff;border:none;font-weight:600;box-shadow:0 3px 10px rgba(56,130,246,.25)}.tkcsv-btn-primary:hover{opacity:.9;transform:translateY(-1px)}.tkcsv-btn-primary:disabled{opacity:.45;cursor:not-allowed;transform:none}.tkcsv-btn-success{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;border:none;font-weight:600;box-shadow:0 3px 10px rgba(34,197,94,.25)}.tkcsv-btn-success:hover{opacity:.9;transform:translateY(-1px)}.tkcsv-btn-success:disabled{opacity:.45;cursor:not-allowed;transform:none}.tkcsv-btn-danger{background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;border:none;font-weight:600;box-shadow:0 3px 10px rgba(239,68,68,.25)}.tkcsv-btn-danger:hover{opacity:.9;transform:translateY(-1px)}.tkcsv-btn-danger:disabled{opacity:.45;cursor:not-allowed;transform:none}.tkcsv-status{padding:12px 16px;border-radius:10px;font-size:12px;line-height:1.6;margin-bottom:16px;display:none}.tkcsv-status-ok{background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);color:#22c55e}.tkcsv-status-warn{background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);color:#f59e0b}.tkcsv-status-err{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);color:#f87171}.tkcsv-table-wrap{max-height:280px;overflow:auto;border:1px solid rgba(255,255,255,.08);border-radius:10px;margin-bottom:16px;display:none}.tkcsv-table-wrap::-webkit-scrollbar{width:5px;height:5px}.tkcsv-table-wrap::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:4px}.tkcsv-table{width:100%;border-collapse:collapse;font-size:12px;font-family:\'DM Mono\',monospace}.tkcsv-table thead{position:sticky;top:0;z-index:1}.tkcsv-table th{background:#1a1d27;color:#4e5668;font-weight:600;text-transform:uppercase;letter-spacing:.06em;font-size:10px;padding:8px 10px;text-align:left;border-bottom:1px solid rgba(255,255,255,.08);white-space:nowrap}.tkcsv-table td{padding:6px 10px;border-bottom:1px solid rgba(255,255,255,.04);color:#e2e8f0;white-space:nowrap}.tkcsv-table tr:last-child td{border-bottom:none}.tkcsv-table tr:hover td{background:rgba(255,255,255,.03)}.tkcsv-table .cell-ok{color:#22c55e}.tkcsv-table .cell-err{color:#f87171;font-weight:600}.tkcsv-footer{padding:14px 20px;border-top:1px solid rgba(255,255,255,.06);display:flex;gap:8px;justify-content:flex-end;flex-shrink:0}.tkcsv-summary{font-size:11px;color:#4e5668;margin-right:auto;display:flex;align-items:center;gap:6px;font-family:\'DM Mono\',monospace}.tkcsv-dot{width:6px;height:6px;border-radius:50%;display:inline-block}.tkcsv-dot-green{background:#22c55e}.tkcsv-dot-red{background:#ef4444}.tkcsv-password-wrap{margin-bottom:16px}.tkcsv-password-label{font-size:11px;font-weight:500;color:#4e5668;letter-spacing:.07em;text-transform:uppercase;margin-bottom:6px;display:block}.tkcsv-password-input{width:100%;padding:10px 13px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:8px;color:#e2e8f0;font-family:\'DM Mono\',monospace;font-size:13px;outline:none;box-sizing:border-box;transition:border-color .15s,box-shadow .15s}.tkcsv-password-input:focus{border-color:rgba(56,130,246,.5);box-shadow:0 0 0 3px rgba(56,130,246,.1)}.tkcsv-password-hint{font-size:11px;color:#4e5668;margin-top:6px;font-style:italic}@keyframes tkcsv-fadein{from{opacity:0}to{opacity:1}}@keyframes tkcsv-slideup{from{opacity:0;transform:translate(-50%,calc(-50% + 12px)) scale(.97)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}';

  // ── SVGs ──────────────────────────────────────────────
  const _SVG_GEAR='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
  const _SVG_CLOSE='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  // ── Options & Files ───────────────────────────────────
  const _OPTS=[
    '\x44\x6f\x6b\x75\x6d\x65\x6e\x20\x53\x61\x79\x61\x20\x28\x42\x6f\x6c\x64\x20\x4f\x6e\x6c\x79\x29',
    '\x44\x6f\x6b\x75\x6d\x65\x6e\x20\x53\x61\x79\x61',
    '\x46\x61\x6b\x74\x75\x72\x20\x50\x61\x6a\x61\x6b\x20\x4b\x65\x6c\x75\x61\x72\x61\x6e',
    '\x46\x61\x6b\x74\x75\x72\x20\x50\x61\x6a\x61\x6b\x20\x4d\x61\x73\x75\x6b\x61\x6e',
    '\x46\x61\x6b\x74\x75\x72\x20\x50\x61\x6a\x61\x6b\x20\x52\x65\x74\x75\x72\x20\x4d\x61\x73\x75\x6b\x61\x6e\x20\x26\x20\x4b\x65\x6c\x75\x61\x72\x61\x6e',
    '\x42\x50\x50\x55\x20\x26\x20\x42\x50\x4e\x52',
    '\x50\x65\x6e\x67\x6b\x72\x65\x64\x69\x74\x61\x6e\x20\x46\x61\x6b\x74\x75\x72',
    '\x50\x65\x6d\x62\x61\x74\x61\x6c\x61\x6e\x20\x46\x61\x6b\x74\x75\x72'
  ];
  const _FILES={};
  _FILES[_OPTS[0]]='\x6d\x30\x64\x5f\x61\x33\x66\x38\x63\x31\x2e\x6a\x73';
  _FILES[_OPTS[1]]='\x6d\x30\x64\x5f\x62\x37\x64\x32\x65\x34\x2e\x6a\x73';
  _FILES[_OPTS[2]]='\x6d\x30\x64\x5f\x63\x38\x61\x64\x38\x73\x2e\x6a\x73';
  _FILES[_OPTS[3]]='\x6d\x30\x64\x5f\x63\x39\x61\x31\x66\x36\x2e\x6a\x73';
  _FILES[_OPTS[4]]='\x6d\x30\x64\x5f\x64\x34\x62\x35\x65\x38\x2e\x6a\x73';
  _FILES[_OPTS[5]]='\x6d\x30\x64\x5f\x65\x32\x63\x37\x61\x30\x2e\x6a\x73';

  const _MODS=[
    {k:'\x64\x65\x6c\x61\x79\x5f\x64\x6f\x6b\x75\x6d\x65\x6e\x5f\x62\x6f\x6c\x64',l:'\x44\x65\x6c\x61\x79\x20\x44\x6f\x6b\x75\x6d\x65\x6e\x20\x42\x6f\x6c\x64\x20\x28\x6d\x73\x29'},
    {k:'\x64\x65\x6c\x61\x79\x5f\x64\x6f\x6b\x75\x6d\x65\x6e\x5f\x61\x6c\x6c',l:'\x44\x65\x6c\x61\x79\x20\x44\x6f\x6b\x75\x6d\x65\x6e\x20\x53\x61\x79\x61\x20\x28\x6d\x73\x29'},
    {k:'\x64\x65\x6c\x61\x79\x5f\x70\x70\x6e',l:'\x44\x65\x6c\x61\x79\x20\x65\x2d\x46\x61\x6b\x74\x75\x72\x20\x4e\x6f\x6e\x20\x52\x65\x74\x75\x72\x20\x28\x6d\x73\x29'},
    {k:'\x64\x65\x6c\x61\x79\x5f\x70\x70\x6e\x5f\x72\x65\x74\x75\x72',l:'\x44\x65\x6c\x61\x79\x20\x65\x2d\x46\x61\x6b\x74\x75\x72\x20\x52\x65\x74\x75\x72\x20\x28\x6d\x73\x29'},
    {k:'\x64\x65\x6c\x61\x79\x5f\x62\x70\x70\x75',l:'\x44\x65\x6c\x61\x79\x20\x42\x50\x50\x55\x20\x26\x20\x42\x50\x4e\x52\x20\x28\x6d\x73\x29'},
    {k:'\x64\x65\x6c\x61\x79\x5f\x70\x65\x6e\x67\x6b\x72\x65\x64\x69\x74\x61\x6e',l:'\x44\x65\x6c\x61\x79\x20\x50\x65\x6e\x67\x6b\x72\x65\x64\x69\x74\x61\x6e\x20\x46\x61\x6b\x74\x75\x72\x20\x28\x6d\x73\x29'},
    {k:'\x64\x65\x6c\x61\x79\x5f\x70\x65\x6d\x62\x61\x74\x61\x6c\x61\x6e',l:'\x44\x65\x6c\x61\x79\x20\x50\x65\x6d\x62\x61\x74\x61\x6c\x61\x6e\x20\x46\x61\x6b\x74\x75\x72\x20\x28\x6d\x73\x29'}
  ];

  // ═════════════════════════════════════════════════════
  // Activation with RETRY LOOP via message passing
  // ═════════════════════════════════════════════════════
  async function _ea(tab){
    const mc=await _gmc();
    const lc=await _csl(mc);
    if(lc.ok)return{activated:true,expiry:lc.expiry};

    return new Promise(function(resolve){
      chrome.scripting.executeScript({
        target:{tabId:tab.id},
        args:[mc,_CSS_ACT],
        func:function(machineCode,cssText){
          if(document.getElementById('tukang-activation-modal'))return'ALREADY_OPEN';
          if(!document.getElementById('tukang-activation-style')){
            var s=document.createElement('style');
            s.id='tukang-activation-style';
            s.textContent=cssText;
            document.head.appendChild(s);
          }
          var ov=document.createElement('div');ov.id='tukang-act-overlay';
          var md=document.createElement('div');md.id='tukang-activation-modal';
          var hd=document.createElement('div');hd.className='tka-header';
          var ti=document.createElement('div');ti.className='tka-title';ti.textContent='\u{1f511} Aktivasi Lisensi';
          var clb=document.createElement('button');clb.className='tka-close';clb.textContent='\u2715';
          clb.onclick=function(){ov.remove();md.remove();
            chrome.runtime.sendMessage({action:'tukang_activation_cancel'});
          };
          hd.append(ti,clb);
          var bd=document.createElement('div');bd.className='tka-body';
          var ds=document.createElement('div');ds.className='tka-desc';
          ds.textContent='Salin Machine Code di bawah lalu kirim ke pemilik extension. Masukkan License Token yang diterima pada kolom aktivasi.';
          var ml=document.createElement('label');ml.className='tka-label';ml.textContent='Machine Code';
          var mb=document.createElement('div');mb.className='tka-codebox';mb.textContent=machineCode;
          var fw=document.createElement('div');fw.id='tka-form-wrap';
          var il=document.createElement('label');il.className='tka-label';il.textContent='License Token';
          var inp=document.createElement('input');inp.className='tka-input';inp.placeholder='Paste token dari owner di sini...';
          var ei=document.createElement('div');ei.className='tka-expiry-info';ei.textContent='Token berisi informasi masa berlaku lisensi.';
          var er=document.createElement('div');er.className='tka-error';
          var ac=document.createElement('div');ac.className='tka-actions';
          var cpb=document.createElement('button');cpb.className='tka-btn-sec';cpb.textContent='Copy Machine Code';
          cpb.onclick=async function(){
            try{await navigator.clipboard.writeText(machineCode);cpb.textContent='\u2713 Copied!';setTimeout(function(){cpb.textContent='Copy Machine Code';},1500);}catch(e){}
          };
          var sb=document.createElement('button');sb.className='tka-btn-pri';sb.textContent='Aktivasi';
          sb.onclick=function(){
            var t=inp.value.trim();
            if(!t){er.textContent='Masukkan license token terlebih dahulu.';er.style.display='block';return;}
            sb.disabled=true;
            sb.innerHTML='<span class="tka-spinner"></span>Memverifikasi...';
            er.style.display='none';
            chrome.runtime.sendMessage({
              action:'tukang_activation_submit',
              machineCode:machineCode,
              token:t
            });
          };
          ac.append(cpb,sb);
          fw.append(il,inp,ei,er,ac);
          var sp=document.createElement('div');sp.className='tka-success';sp.id='tka-success-panel';
          bd.append(ds,ml,mb,fw,sp);
          md.append(hd,bd);
          document.body.append(ov,md);
          chrome.runtime.onMessage.addListener(function _actListener(msg){
            if(msg.action==='tukang_activation_error'){
              er.textContent='\u274c '+msg.reason;
              er.style.display='block';
              sb.disabled=false;
              sb.textContent='Aktivasi';
              inp.focus();
              inp.select();
            }
            else if(msg.action==='tukang_activation_success'){
              fw.style.display='none';ds.style.display='none';
              ml.style.display='none';mb.style.display='none';
              ti.textContent='\u2705 Aktivasi Berhasil!';
              var dR=msg.daysRemaining;
              var cc='green',bc='linear-gradient(90deg,#22c55e,#16a34a)';
              if(dR<=3){cc='red';bc='linear-gradient(90deg,#ef4444,#dc2626)';}
              else if(dR<=7){cc='orange';bc='linear-gradient(90deg,#f59e0b,#d97706)';}
              var ed=new Date(msg.expiry).toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
              sp.innerHTML='';sp.style.display='block';
              var st2=document.createElement('div');st2.className='tka-success-title';st2.textContent='\u{1f389} Lisensi Aktif';sp.appendChild(st2);
              [{label:'Berlaku hingga',value:ed,cls:''},{label:'Sisa waktu',value:dR+' hari',cls:cc}].forEach(function(r){
                var rw=document.createElement('div');rw.className='tka-success-row';
                var lb=document.createElement('span');lb.className='tka-success-label';lb.textContent=r.label;
                var vl=document.createElement('span');vl.className='tka-success-value'+(r.cls?' '+r.cls:'');vl.textContent=r.value;
                rw.append(lb,vl);sp.appendChild(rw);
              });
              var btr=document.createElement('div');btr.className='tka-success-bar-track';
              var bfl=document.createElement('div');bfl.className='tka-success-bar-fill';bfl.style.width='0%';bfl.style.background=bc;
              btr.appendChild(bfl);sp.appendChild(btr);
              requestAnimationFrame(function(){setTimeout(function(){bfl.style.width=Math.min(100,Math.max(5,(dR/365)*100))+'%';},100);});
              var sa=document.createElement('div');sa.className='tka-success-actions';
              var cn=document.createElement('button');cn.className='tka-btn-pri';cn.textContent='Lanjutkan \u2192';
              cn.onclick=function(){ov.remove();md.remove();chrome.runtime.onMessage.removeListener(_actListener);};
              sa.appendChild(cn);sp.appendChild(sa);
              chrome.runtime.onMessage.removeListener(_actListener);
            }
          });
          return'MODAL_INJECTED';
        }
      },function(injResults){
        if(!injResults?.[0]?.result||injResults[0].result==='ALREADY_OPEN'){
          resolve({activated:false});return;
        }
        function _bgListener(msg,sender,sendResponse){
          if(msg.action==='tukang_activation_cancel'){
            chrome.runtime.onMessage.removeListener(_bgListener);
            resolve({activated:false});
            return;
          }
          if(msg.action==='tukang_activation_submit'){
            (async function(){
              var vr=await _vt(msg.token,msg.machineCode);
              if(!vr.ok){
                chrome.tabs.sendMessage(tab.id,{
                  action:'tukang_activation_error',
                  reason:vr.reason
                });
                return;
              }
              await chrome.storage.local.set({[S.f]:msg.token});
              var rem=_dl(vr.expiry);
              chrome.tabs.sendMessage(tab.id,{
                action:'tukang_activation_success',
                expiry:vr.expiry,
                daysRemaining:rem
              });
              chrome.runtime.onMessage.removeListener(_bgListener);
              resolve({activated:true,expiry:vr.expiry});
            })();
            return true;
          }
        }
        chrome.runtime.onMessage.addListener(_bgListener);
      });
    });
  }

  // ── CheckLicense message handler ──────────────────────
  chrome.runtime.onMessage.addListener(function(msg,sender,sendResponse){
    if(msg.action===S.q){
      (async function(){
        try{
          var mc=await _gmc();
          var r=await chrome.storage.local.get(S.f);
          if(!r[S.f]){sendResponse({ok:false,reason:S.s});return;}
          var vr=await _vt(r[S.f],mc);
          sendResponse(vr);
        }catch(e){sendResponse({ok:false,reason:'error: '+e.message});}
      })();
      return true;
    }
  });

  // ── CSV modal: Pengkreditan Faktur ────────────────────
  function _mpk(tab){
    return new Promise(function(resolve){
      chrome.scripting.executeScript({
        target:{tabId:tab.id},
        args:[_CSS_CSV],
        func:function(cssText){
          if(document.getElementById('tukang-faktur-modal'))return null;
          return new Promise(function(resolvePrompt){
            if(!document.getElementById('tukang-csv-style')){
              var s=document.createElement('style');s.id='tukang-csv-style';s.textContent=cssText;document.head.appendChild(s);
            }
            var BULAN_NAMES=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
            var BULAN_MAP={};
            BULAN_NAMES.forEach(function(n,i){BULAN_MAP[n.toLowerCase()]=i+1;});
            for(var i=1;i<=12;i++)BULAN_MAP[String(i)]=i;
            for(var i=1;i<=12;i++)BULAN_MAP[String(i).padStart(2,'0')]=i;
            var HEADERS=['nomor_faktur','masa_pajak_faktur','tahun_pajak_faktur','masa_pajak_pengkreditan','tahun_pajak_pengkreditan'];
            var HEADER_LABELS=['Nomor Faktur','Masa Pajak Faktur','Tahun Pajak Faktur','Masa Pajak Pengkreditan','Tahun Pajak Pengkreditan'];
            var parsedRows=[],validCount=0,errorCount=0;
            function normaliseBulan(val){
              if(!val)return null;
              var v=val.toString().trim().toLowerCase();
              if(BULAN_MAP[v]!==undefined)return BULAN_MAP[v];
              for(var j=0;j<BULAN_NAMES.length;j++){if(BULAN_NAMES[j].toLowerCase().startsWith(v)&&v.length>=3)return BULAN_MAP[BULAN_NAMES[j].toLowerCase()];}
              return null;
            }
            function validateRow(row){
              var errors=[];
              var nf=(row.nomor_faktur||'').trim();
              var nfDigits=nf.replace(/[.\-\s]/g,'');
              if(!nfDigits||!/^\d+$/.test(nfDigits)){errors.push('Nomor faktur harus berisi angka');}
              else if(nfDigits.length<15||nfDigits.length>20){errors.push('Nomor faktur harus 15-20 digit (tanpa titik/strip)');}
              if(!normaliseBulan(row.masa_pajak_faktur))errors.push('Masa pajak faktur tidak valid');
              var tpf=(row.tahun_pajak_faktur||'').toString().trim();
              if(!/^\d{4}$/.test(tpf))errors.push('Tahun pajak faktur harus 4 digit');
              if(!normaliseBulan(row.masa_pajak_pengkreditan))errors.push('Masa pajak pengkreditan tidak valid');
              var tpp=(row.tahun_pajak_pengkreditan||'').toString().trim();
              if(!/^\d{4}$/.test(tpp))errors.push('Tahun pajak pengkreditan harus 4 digit');
              return errors;
            }
            function parseCSV(text){
              var lines=text.split(/\r?\n/).filter(function(l){return l.trim();});
              if(lines.length<2)return{rows:[],error:'CSV harus memiliki header dan minimal 1 baris data.'};
              var headerLine=lines[0];
              var sep=headerLine.includes(';')?';':',';
              var headers=headerLine.split(sep).map(function(h){return h.trim().toLowerCase().replace(/\s+/g,'_').replace(/['"]/g,'');});
              var missing=HEADERS.filter(function(h){return!headers.includes(h);});
              if(missing.length>0)return{rows:[],error:'Kolom berikut tidak ditemukan: '+missing.join(', ')+'. Pastikan header CSV sesuai template.'};
              var rows=[];
              for(var i=1;i<lines.length;i++){
                var vals=lines[i].split(sep).map(function(v){return v.trim().replace(/^["']|["']$/g,'');});
                if(vals.every(function(v){return!v;}))continue;
                var obj={};
                headers.forEach(function(h,idx){obj[h]=vals[idx]||'';});
                rows.push(obj);
              }
              return{rows:rows,error:null};
            }
            function generateTemplateCSV(){
              var header=HEADER_LABELS.join(',');
              return header+"\n'040123456789,Januari,2025,Maret,2025\n'040123456789,Februari,2025,Februari,2025\n";
            }
            function downloadCSV(content,filename){
              var blob=new Blob(['\uFEFF'+content],{type:'text/csv;charset=utf-8;'});
              var url=URL.createObjectURL(blob);
              var a=document.createElement('a');a.href=url;a.download=filename;a.style.display='none';
              document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
            }
            var overlay=document.createElement('div');overlay.id='tukang-faktur-overlay';
            var modal=document.createElement('div');modal.id='tukang-faktur-modal';
            var header=document.createElement('div');header.className='tkcsv-header';
            var title=document.createElement('div');title.className='tkcsv-title';title.textContent='\ud83e\uddfe Pengkreditan Faktur';
            var closeBtn=document.createElement('button');closeBtn.className='tkcsv-close';closeBtn.textContent='\u2715';
            closeBtn.onclick=function(){rm();resolvePrompt(null);};
            header.append(title,closeBtn);
            var body=document.createElement('div');body.className='tkcsv-body';
            var desc=document.createElement('div');desc.className='tkcsv-desc';
            desc.innerHTML='Upload file CSV berisi daftar nomor faktur untuk diproses. Download template terlebih dahulu jika belum memiliki format yang sesuai.<br><br><strong style="color:#e2e8f0;">Kolom yang dibutuhkan:</strong> Nomor Faktur, Masa Pajak Faktur, Tahun Pajak Faktur, Masa Pajak Pengkreditan, Tahun Pajak Pengkreditan<br><span style="color:#64748b;">\u2022 Nomor faktur: format 010.006-25.12345678 (15-20 digit angka)</span><br><span style="color:#64748b;">\u2022 Masa pajak: nama bulan (Januari-Desember) atau angka (1-12)</span><br><span style="color:#64748b;">\u2022 Tahun: 4 digit angka (contoh: 2025)</span>';
            var btnRow=document.createElement('div');btnRow.className='tkcsv-btn-row';
            var dlBtn=document.createElement('button');dlBtn.className='tkcsv-btn tkcsv-btn-outline';dlBtn.innerHTML='\ud83d\udce5 Download Template';
            dlBtn.onclick=function(){downloadCSV(generateTemplateCSV(),'template_pengkreditan_faktur.csv');};
            var uploadBtn=document.createElement('button');uploadBtn.className='tkcsv-btn tkcsv-btn-outline';uploadBtn.innerHTML='\ud83d\udcce Upload CSV';
            uploadBtn.onclick=function(){
              var fi=document.createElement('input');fi.type='file';fi.accept='.csv,.txt';
              fi.onchange=function(e){
                var file=e.target.files[0];if(!file)return;
                uploadBtn.innerHTML='\u23f3 Membaca...';
                var reader=new FileReader();
                reader.onload=function(ev){uploadBtn.innerHTML='\ud83d\udcce Upload CSV';processCSVText(ev.target.result,file.name);};
                reader.onerror=function(){uploadBtn.innerHTML='\ud83d\udcce Upload CSV';showStatus('Gagal membaca file.','err');};
                reader.readAsText(file);
              };
              fi.click();
            };
            btnRow.append(dlBtn,uploadBtn);
            var statusBox=document.createElement('div');statusBox.className='tkcsv-status';
            var tableWrap=document.createElement('div');tableWrap.className='tkcsv-table-wrap';
            body.append(desc,btnRow,statusBox,tableWrap);
            var footer=document.createElement('div');footer.className='tkcsv-footer';
            var summary=document.createElement('div');summary.className='tkcsv-summary';summary.style.display='none';
            var cancelBtn=document.createElement('button');cancelBtn.className='tkcsv-btn tkcsv-btn-outline';cancelBtn.textContent='Batal';
            cancelBtn.onclick=function(){rm();resolvePrompt(null);};
            var processBtn=document.createElement('button');processBtn.className='tkcsv-btn tkcsv-btn-success';processBtn.textContent='\ud83d\ude80 Proses Semua';processBtn.disabled=true;
            processBtn.onclick=function(){
              if(validCount===0)return;
              rm();
              var output=parsedRows.filter(function(r){return r._errors.length===0;}).map(function(r){
                return{
                  nomorFaktur:r.nomor_faktur.trim(),
                  masaPajakFaktur:normaliseBulan(r.masa_pajak_faktur),
                  tahunPajakFaktur:r.tahun_pajak_faktur.toString().trim(),
                  masaPajakPengkreditan:normaliseBulan(r.masa_pajak_pengkreditan),
                  tahunPajakPengkreditan:r.tahun_pajak_pengkreditan.toString().trim(),
                };
              });
              resolvePrompt(output);
            };
            footer.append(summary,cancelBtn,processBtn);
            modal.append(header,body,footer);
            document.body.append(overlay,modal);
            function showStatus(msg,type){
              statusBox.style.display='block';
              statusBox.className='tkcsv-status tkcsv-status-'+type;
              statusBox.innerHTML=msg;
            }
            function processCSVText(text,filename){
              var res=parseCSV(text);
              if(res.error){showStatus('\u274c '+res.error,'err');tableWrap.style.display='none';summary.style.display='none';processBtn.disabled=true;return;}
              if(res.rows.length===0){showStatus('\u274c File CSV tidak berisi data.','err');tableWrap.style.display='none';summary.style.display='none';processBtn.disabled=true;return;}
              validCount=0;errorCount=0;
              parsedRows=res.rows.map(function(r){
                var errs=validateRow(r);
                if(errs.length===0)validCount++;else errorCount++;
                return Object.assign({},r,{_errors:errs});
              });
              tableWrap.style.display='block';tableWrap.innerHTML='';
              var table=document.createElement('table');table.className='tkcsv-table';
              var thead=document.createElement('thead');
              var headTr=document.createElement('tr');
              ['#'].concat(HEADER_LABELS).concat(['Status']).forEach(function(h){var th=document.createElement('th');th.textContent=h;headTr.appendChild(th);});
              thead.appendChild(headTr);table.appendChild(thead);
              var tbody=document.createElement('tbody');
              parsedRows.forEach(function(r,idx){
                var tr=document.createElement('tr');
                var tdNum=document.createElement('td');tdNum.textContent=idx+1;tdNum.style.color='#4e5668';tr.appendChild(tdNum);
                HEADERS.forEach(function(h){
                  var td=document.createElement('td');td.textContent=r[h]||'\u2014';
                  var cellErrors=[];
                  if(h==='nomor_faktur'){var digits=(r[h]||'').replace(/[.\-\s]/g,'');if(!/^\d+$/.test(digits)||digits.length<15||digits.length>20)cellErrors.push(1);}
                  if(h==='masa_pajak_faktur'&&!normaliseBulan(r[h]))cellErrors.push(1);
                  if(h==='tahun_pajak_faktur'&&!/^\d{4}$/.test((r[h]||'').trim()))cellErrors.push(1);
                  if(h==='masa_pajak_pengkreditan'&&!normaliseBulan(r[h]))cellErrors.push(1);
                  if(h==='tahun_pajak_pengkreditan'&&!/^\d{4}$/.test((r[h]||'').trim()))cellErrors.push(1);
                  td.className=cellErrors.length>0?'cell-err':'cell-ok';tr.appendChild(td);
                });
                var tdStatus=document.createElement('td');
                if(r._errors.length===0){tdStatus.textContent='\u2713 Valid';tdStatus.className='cell-ok';}
                else{tdStatus.textContent='\u2717 '+r._errors[0];tdStatus.className='cell-err';tdStatus.title=r._errors.join('\n');}
                tr.appendChild(tdStatus);tbody.appendChild(tr);
              });
              table.appendChild(tbody);tableWrap.appendChild(table);
              summary.style.display='flex';
              summary.innerHTML='<span class="tkcsv-dot tkcsv-dot-green"></span> '+validCount+' valid'+(errorCount>0?' &nbsp; <span class="tkcsv-dot tkcsv-dot-red"></span> '+errorCount+' error':'');
              if(errorCount===0){showStatus('\u2705 <strong>'+filename+'</strong> \u2014 '+validCount+' baris terdeteksi, semua valid. Siap diproses!','ok');processBtn.disabled=false;}
              else if(validCount>0){showStatus('\u26a0\ufe0f <strong>'+filename+'</strong> \u2014 '+validCount+' baris valid, <strong>'+errorCount+' baris bermasalah</strong> (akan dilewati).','warn');processBtn.disabled=false;}
              else{showStatus('\u274c <strong>'+filename+'</strong> \u2014 Semua '+errorCount+' baris bermasalah. Perbaiki CSV dan upload ulang.','err');processBtn.disabled=true;}
            }
            function rm(){overlay.remove();modal.remove();}
          });
        }
      },function(results){
        if(!results?.[0]?.result){resolve(null);return;}
        resolve(results[0].result);
      });
    });
  }

  // ── CSV modal: Pembatalan Faktur ──────────────────────
  function _mpb(tab){
    return new Promise(function(resolve){
      chrome.scripting.executeScript({
        target:{tabId:tab.id},
        args:[_CSS_CSV],
        func:function(cssText){
          if(document.getElementById('tukang-batal-modal'))return null;
          return new Promise(function(resolvePrompt){
            if(!document.getElementById('tukang-csv-style')){
              var s=document.createElement('style');s.id='tukang-csv-style';s.textContent=cssText;document.head.appendChild(s);
            }
            var HEADERS=['nomor_faktur'];
            var HEADER_LABELS=['Nomor Faktur'];
            var parsedRows=[],validCount=0,errorCount=0;
            function validateRow(row){
              var errors=[];
              var nf=(row.nomor_faktur||'').trim();
              var nfDigits=nf.replace(/[.\-\s]/g,'');
              if(!nfDigits||!/^\d+$/.test(nfDigits)){errors.push('Nomor faktur harus berisi angka');}
              else if(nfDigits.length<15||nfDigits.length>20){errors.push('Nomor faktur harus 15-20 digit (tanpa titik/strip)');}
              return errors;
            }
            function parseCSV(text){
              var lines=text.split(/\r?\n/).filter(function(l){return l.trim();});
              if(lines.length<2)return{rows:[],error:'CSV harus memiliki header dan minimal 1 baris data.'};
              var headerLine=lines[0];
              var sep=headerLine.includes(';')?';':',';
              var headers=headerLine.split(sep).map(function(h){return h.trim().toLowerCase().replace(/\s+/g,'_').replace(/['"]/g,'');});
              var missing=HEADERS.filter(function(h){return!headers.includes(h);});
              if(missing.length>0)return{rows:[],error:'Kolom berikut tidak ditemukan: '+missing.join(', ')+'. Pastikan header CSV sesuai template.'};
              var rows=[];
              for(var i=1;i<lines.length;i++){
                var vals=lines[i].split(sep).map(function(v){return v.trim().replace(/^["']|["']$/g,'');});
                if(vals.every(function(v){return!v;}))continue;
                var obj={};
                headers.forEach(function(h,idx){obj[h]=vals[idx]||'';});
                rows.push(obj);
              }
              return{rows:rows,error:null};
            }
            function generateTemplateCSV(){
              return 'Nomor Faktur\n\'04009012689713953\n\'04009012689713954\n\'04009012689713404\n';
            }
            function downloadCSV(content,filename){
              var blob=new Blob(['\uFEFF'+content],{type:'text/csv;charset=utf-8;'});
              var url=URL.createObjectURL(blob);
              var a=document.createElement('a');a.href=url;a.download=filename;a.style.display='none';
              document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
            }
            var overlay=document.createElement('div');overlay.id='tukang-batal-overlay';
            var modal=document.createElement('div');modal.id='tukang-batal-modal';
            var header=document.createElement('div');header.className='tkcsv-header';
            var title=document.createElement('div');title.className='tkcsv-title';title.textContent='\ud83d\udeab Pembatalan Faktur';
            var closeBtn=document.createElement('button');closeBtn.className='tkcsv-close';closeBtn.textContent='\u2715';
            closeBtn.onclick=function(){rm();resolvePrompt(null);};
            header.append(title,closeBtn);
            var body=document.createElement('div');body.className='tkcsv-body';
            var desc=document.createElement('div');desc.className='tkcsv-desc';
            desc.innerHTML='Upload file CSV berisi daftar nomor faktur yang akan <strong style="color:#f87171;">dibatalkan</strong>. Download template terlebih dahulu jika belum memiliki format yang sesuai.<br><br><strong style="color:#e2e8f0;">Kolom yang dibutuhkan:</strong> Nomor Faktur<br><span style="color:#64748b;">\u2022 Nomor faktur: 15-20 digit angka (contoh: 04009012689713953)</span><br><span style="color:#64748b;">\u2022 Passphrase akan digunakan untuk menandatangani pembatalan</span>';
            var passWrap=document.createElement('div');passWrap.className='tkcsv-password-wrap';
            var passLabel=document.createElement('label');passLabel.className='tkcsv-password-label';passLabel.textContent='Passphrase';
            var passInput=document.createElement('input');passInput.type='password';passInput.className='tkcsv-password-input';passInput.placeholder='Masukkan passphrase sertifikat...';
            var passHint=document.createElement('div');passHint.className='tkcsv-password-hint';passHint.textContent='Passphrase digunakan untuk proses penandatanganan pembatalan faktur. (Passphrase tidak disimpan atau dikirim ke mana pun, hanya digunakan secara lokal di browser Anda saat memproses faktur yang valid)';
            passWrap.append(passLabel,passInput,passHint);
            var btnRow=document.createElement('div');btnRow.className='tkcsv-btn-row';
            var dlBtn=document.createElement('button');dlBtn.className='tkcsv-btn tkcsv-btn-outline';dlBtn.innerHTML='\ud83d\udce5 Download Template';
            dlBtn.onclick=function(){downloadCSV(generateTemplateCSV(),'template_pembatalan_faktur.csv');};
            var uploadBtn=document.createElement('button');uploadBtn.className='tkcsv-btn tkcsv-btn-outline';uploadBtn.innerHTML='\ud83d\udcce Upload CSV';
            uploadBtn.onclick=function(){
              var fi=document.createElement('input');fi.type='file';fi.accept='.csv,.txt';
              fi.onchange=function(e){
                var file=e.target.files[0];if(!file)return;
                uploadBtn.innerHTML='\u23f3 Membaca...';
                var reader=new FileReader();
                reader.onload=function(ev){uploadBtn.innerHTML='\ud83d\udcce Upload CSV';processCSVText(ev.target.result,file.name);};
                reader.onerror=function(){uploadBtn.innerHTML='\ud83d\udcce Upload CSV';showStatus('Gagal membaca file.','err');};
                reader.readAsText(file);
              };
              fi.click();
            };
            btnRow.append(dlBtn,uploadBtn);
            var statusBox=document.createElement('div');statusBox.className='tkcsv-status';
            var tableWrap=document.createElement('div');tableWrap.className='tkcsv-table-wrap';
            body.append(desc,passWrap,btnRow,statusBox,tableWrap);
            var footer=document.createElement('div');footer.className='tkcsv-footer';
            var summary=document.createElement('div');summary.className='tkcsv-summary';summary.style.display='none';
            var cancelBtn=document.createElement('button');cancelBtn.className='tkcsv-btn tkcsv-btn-outline';cancelBtn.textContent='Batal';
            cancelBtn.onclick=function(){rm();resolvePrompt(null);};
            var processBtn=document.createElement('button');processBtn.className='tkcsv-btn tkcsv-btn-danger';processBtn.textContent='\ud83d\udeab Batalkan Semua Faktur';processBtn.disabled=true;
            processBtn.onclick=function(){
              if(validCount===0)return;
              var passphrase=passInput.value.trim();
              if(!passphrase){showStatus('\u274c Passphrase harus diisi sebelum memproses pembatalan.','err');passInput.focus();return;}
              rm();
              var output=parsedRows.filter(function(r){return r._errors.length===0;}).map(function(r){
                return{nomorFaktur:r.nomor_faktur.replace(/[.\-\s]/g,'').trim()};
              });
              resolvePrompt({rows:output,passphrase:passphrase});
            };
            footer.append(summary,cancelBtn,processBtn);
            modal.append(header,body,footer);
            document.body.append(overlay,modal);
            function showStatus(msg,type){
              statusBox.style.display='block';
              statusBox.className='tkcsv-status tkcsv-status-'+type;
              statusBox.innerHTML=msg;
            }
            function processCSVText(text,filename){
              var res=parseCSV(text);
              if(res.error){showStatus('\u274c '+res.error,'err');tableWrap.style.display='none';summary.style.display='none';processBtn.disabled=true;return;}
              if(res.rows.length===0){showStatus('\u274c File CSV tidak berisi data.','err');tableWrap.style.display='none';summary.style.display='none';processBtn.disabled=true;return;}
              validCount=0;errorCount=0;
              parsedRows=res.rows.map(function(r){
                var errs=validateRow(r);
                if(errs.length===0)validCount++;else errorCount++;
                return Object.assign({},r,{_errors:errs});
              });
              tableWrap.style.display='block';tableWrap.innerHTML='';
              var table=document.createElement('table');table.className='tkcsv-table';
              var thead=document.createElement('thead');
              var headTr=document.createElement('tr');
              ['#'].concat(HEADER_LABELS).concat(['Status']).forEach(function(h){var th=document.createElement('th');th.textContent=h;headTr.appendChild(th);});
              thead.appendChild(headTr);table.appendChild(thead);
              var tbody=document.createElement('tbody');
              parsedRows.forEach(function(r,idx){
                var tr=document.createElement('tr');
                var tdNum=document.createElement('td');tdNum.textContent=idx+1;tdNum.style.color='#4e5668';tr.appendChild(tdNum);
                HEADERS.forEach(function(h){
                  var td=document.createElement('td');td.textContent=r[h]||'\u2014';
                  var cellErrors=[];
                  if(h==='nomor_faktur'){var digits=(r[h]||'').replace(/[.\-\s]/g,'');if(!/^\d+$/.test(digits)||digits.length<15||digits.length>20)cellErrors.push(1);}
                  td.className=cellErrors.length>0?'cell-err':'cell-ok';tr.appendChild(td);
                });
                var tdStatus=document.createElement('td');
                if(r._errors.length===0){tdStatus.textContent='\u2713 Valid';tdStatus.className='cell-ok';}
                else{tdStatus.textContent='\u2717 '+r._errors[0];tdStatus.className='cell-err';tdStatus.title=r._errors.join('\n');}
                tr.appendChild(tdStatus);tbody.appendChild(tr);
              });
              table.appendChild(tbody);tableWrap.appendChild(table);
              summary.style.display='flex';
              summary.innerHTML='<span class="tkcsv-dot tkcsv-dot-green"></span> '+validCount+' valid'+(errorCount>0?' &nbsp; <span class="tkcsv-dot tkcsv-dot-red"></span> '+errorCount+' error':'');
              if(errorCount===0){showStatus('\u2705 <strong>'+filename+'</strong> \u2014 '+validCount+' faktur terdeteksi, semua valid. Siap dibatalkan!','ok');processBtn.disabled=false;}
              else if(validCount>0){showStatus('\u26a0\ufe0f <strong>'+filename+'</strong> \u2014 '+validCount+' faktur valid, <strong>'+errorCount+' bermasalah</strong> (akan dilewati).','warn');processBtn.disabled=false;}
              else{showStatus('\u274c <strong>'+filename+'</strong> \u2014 Semua '+errorCount+' baris bermasalah. Perbaiki CSV dan upload ulang.','err');processBtn.disabled=true;}
            }
            function rm(){overlay.remove();modal.remove();}
          });
        }
      },function(results){
        if(!results?.[0]?.result){resolve(null);return;}
        resolve(results[0].result);
      });
    });
  }

  // ── Main click handler ────────────────────────────────
  chrome.action.onClicked.addListener(async function(tab){
    var res=await _ea(tab);
    if(!res.activated)return;
    var le=res.expiry,rem=_dl(le);

    chrome.scripting.executeScript({
      target:{tabId:tab.id},
      args:[_fe(le),rem,_CSS_MAIN,_SVG_GEAR,_SVG_CLOSE,_OPTS,_MODS],
      func:function(expiryStr,daysRemaining,cssMain,svgGear,svgClose,opts,mods){
        if(document.getElementById('doc-select-modal'))return null;
        return new Promise(function(resolve){
          var se=document.createElement('style');se.textContent=cssMain;document.head.appendChild(se);
          var ov=document.createElement('div');ov.id='tukang-overlay';
          var ct=document.createElement('div');ct.id='doc-select-modal';
          var hd=document.createElement('div');hd.className='tukang-header';
          var br=document.createElement('div');br.className='tukang-brand';
          var ib=document.createElement('div');ib.className='tukang-icon';ib.textContent='\ud83d\udcc4';
          var bt=document.createElement('div');
          var tl=document.createElement('div');tl.className='tukang-title';tl.textContent='Tukang Dokumen';
          var st=document.createElement('div');st.className='tukang-subtitle';st.textContent='Document Automation Tool';
          bt.appendChild(tl);bt.appendChild(st);br.appendChild(ib);br.appendChild(bt);
          var ha=document.createElement('div');ha.className='tukang-header-actions';
          var sbn=document.createElement('button');sbn.className='tukang-icon-btn';sbn.title='Settings';sbn.innerHTML=svgGear;
          var cbn=document.createElement('button');cbn.className='tukang-icon-btn close-btn';cbn.title='Close';cbn.innerHTML=svgClose;
          cbn.onclick=function(){ct.remove();ov.remove();resolve(null);};
          ha.appendChild(sbn);ha.appendChild(cbn);hd.appendChild(br);hd.appendChild(ha);
          var bd=document.createElement('div');bd.className='tukang-body';
          var sl=document.createElement('div');sl.className='tukang-label';sl.textContent='Jenis Dokumen';
          var se2=document.createElement('select');se2.className='tukang-select';
          opts.forEach(function(o){var op=document.createElement('option');op.value=o;op.textContent=o;se2.appendChild(op);});
          var dv=document.createElement('div');dv.className='tukang-divider';
          var sm=document.createElement('button');sm.className='tukang-submit';sm.textContent='Jalankan Proses';
          sm.onclick=function(){var v=se2.value;ct.remove();ov.remove();resolve(v);};
          bd.appendChild(sl);bd.appendChild(se2);bd.appendChild(dv);bd.appendChild(sm);
          var ft=document.createElement('div');ft.className='tukang-footer';
          var li=document.createElement('div');li.className='tukang-license-info';
          var ll=document.createElement('div');ll.className='tukang-license-left';
          var dc=daysRemaining<=3?'red':daysRemaining<=7?'orange':'green';
          var dt=document.createElement('div');dt.className='tukang-license-dot '+dc;
          var lt=document.createElement('div');lt.className='tukang-license-text';lt.textContent='s/d '+expiryStr;
          ll.appendChild(dt);ll.appendChild(lt);
          var bg=document.createElement('span');bg.className='tukang-license-badge '+dc;bg.textContent=daysRemaining+' hari';
          li.appendChild(ll);li.appendChild(bg);ft.appendChild(li);
          ct.appendChild(hd);ct.appendChild(bd);ct.appendChild(ft);
          document.body.appendChild(ov);document.body.appendChild(ct);
          sbn.onclick=function(){
            if(document.getElementById('settings-modal'))return;
            var so=document.createElement('div');so.id='tukang-settings-overlay';
            var sx=document.createElement('div');sx.id='settings-modal';
            var sh=document.createElement('div');sh.className='settings-header';
            var stl=document.createElement('div');stl.className='settings-title';
            stl.innerHTML='<span class="settings-title-icon">\u2699\ufe0f</span> Pengaturan';
            var scb=document.createElement('button');scb.className='tukang-icon-btn close-btn';scb.title='Close';scb.innerHTML=svgClose;
            scb.onclick=function(){sx.remove();so.remove();};
            sh.appendChild(stl);sh.appendChild(scb);
            var sby=document.createElement('div');sby.className='settings-body';
            var ibx=document.createElement('div');ibx.className='settings-info-box';
            ibx.innerHTML='<span class="settings-info-icon">\u2139\ufe0f</span><span>Semakin tinggi delay, semakin tinggi kemungkinan success, namun proses akan semakin lambat.</span>';
            sby.appendChild(ibx);
            var di={};
            mods.forEach(function(m){
              var f=document.createElement('div');f.className='settings-field';
              var lb=document.createElement('label');lb.className='settings-field-label';lb.textContent=m.l;f.appendChild(lb);
              var ip=document.createElement('input');ip.type='number';ip.className='settings-input';ip.placeholder='0';f.appendChild(ip);
              sby.appendChild(f);di[m.k]=ip;
            });
            var allKeys=mods.map(function(m){return m.k;});
            chrome.storage.local.get(allKeys,function(res2){
              mods.forEach(function(m){di[m.k].value=res2[m.k]||0;});
            });
            var sf=document.createElement('div');sf.className='settings-footer';
            var cnb=document.createElement('button');cnb.className='btn-secondary';cnb.textContent='Batal';
            cnb.onclick=function(){sx.remove();so.remove();};
            var svb=document.createElement('button');svb.className='btn-primary';svb.textContent='Simpan';
            svb.onclick=function(){
              var obj={};mods.forEach(function(m){obj[m.k]=parseInt(di[m.k].value)||0;});
              chrome.storage.local.set(obj,function(){alert('Saved!');sx.remove();so.remove();});
            };
            sf.appendChild(cnb);sf.appendChild(svb);sx.appendChild(sh);sx.appendChild(sby);sx.appendChild(sf);
            document.body.appendChild(so);document.body.appendChild(sx);
          };
        });
      }
    },async function(results){
      if(!results||!results[0].result)return;
      var sel=results[0].result;

      if(sel===_OPTS[6]){
        var csvData=await _mpk(tab);
        if(!csvData||csvData.length===0)return;
        chrome.scripting.executeScript({
          target:{tabId:tab.id},
          args:[csvData],
          func:function(list){window.__pengkreditanFakturList=list;}
        },function(){
          chrome.scripting.executeScript({target:{tabId:tab.id},files:['\x6d\x30\x64\x5f\x66\x35\x65\x33\x62\x32\x2e\x6a\x73']});
        });
        return;
      }

      if(sel===_OPTS[7]){
        var csvResult=await _mpb(tab);
        if(!csvResult||!csvResult.rows||csvResult.rows.length===0)return;
        chrome.scripting.executeScript({
          target:{tabId:tab.id},
          args:[csvResult.rows,csvResult.passphrase],
          func:function(list,passphrase){window.__pembatalanFakturList=list;window.__pembatalanPassphrase=passphrase;}
        },function(){
          chrome.scripting.executeScript({target:{tabId:tab.id},files:['\x6d\x30\x64\x5f\x67\x38\x64\x34\x63\x37\x2e\x6a\x73']});
        });
        return;
      }

      var f=_FILES[sel];
      if(f){chrome.scripting.executeScript({target:{tabId:tab.id},files:[S.v,f]});}
    });
  });
})();