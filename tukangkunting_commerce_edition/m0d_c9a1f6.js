(async function(){
  const _0x0=setInterval(function(){const _d=new Date();debugger;if(new Date()-_d>100){clearInterval(_0x0);}},3000);

  const _$=atob;
  const S={
    a:_$('Y2hlY2tMaWNlbnNl'),    
    b:_$('bm9fcnVudGltZQ=='),     
    c:_$('bm9fcmVzcG9uc2U='),     
    d:_$('bGlzZW5zaSBzdWRhaCBleHBpcmVk'), 
    e:_$('bWFjaGluZSBjb2RlIHRpZGFrIGNvY29r'), 
    f:_$('bm9fbGljZW5zZQ=='),     
    g:_$('aWQtSUQ='),             
    h:_$('bnVtZXJpYw=='),         
    i:_$('bG9uZw=='),             
    j:_$('aWNvbi5wbmc='),         
    k:_$('ZGVsYXlfcHBu'),         
    l:_$('dGFibGUgdGJvZHkgdHI='), 
    m:_$('LnAtcGFnaW5hdG9yLWJvdHRvbSAucC1wYWdpbmF0b3ItcGFnZS5wLWhpZ2hsaWdodA=='), 
    n:_$('LnAtcGFnaW5hdG9yLWJvdHRvbSAucC1wYWdpbmF0b3ItbmV4dA=='), 
    o:_$('LnAtZGF0YXRhYmxlLWxvYWRpbmctb3ZlcmxheQ=='), 
    p:_$('dWktcHJvZ3Jlc3Mtc3Bpbm5lciAucC1wcm9ncmVzcy1zcGlubmVy'), 
    q:_$('cC1wcm9ncmVzc3NwaW5uZXIgLnAtcHJvZ3Jlc3Mtc3Bpbm5lcg=='), 
    r:_$('LnAtcGFnaW5hdG9yLWJvdHRvbQ=='), 
    s:_$('cC1kaXNhYmxlZA=='),     
    t:_$('dGV4dC9jc3Y7Y2hhcnNldD11dGYtODs='), 
    u:_$('YnV0dG9uI0Rvd25sb2FkQnV0dG9u'), 
    v:_$('YnV0dG9uIC5waS1maWxlLXBkZg=='), 
    w:_$('YnV0dG9uW2lkPSdEb3dubG9hZEJ1dHRvbidd'), 
  };

  async function _cl(){
    return new Promise(function(r){
      if(!chrome?.runtime?.sendMessage){r({ok:false,reason:S.b});return;}
      chrome.runtime.sendMessage({action:S.a},function(res){
        if(chrome.runtime.lastError){r({ok:false,reason:chrome.runtime.lastError.message});return;}
        r(res||{ok:false,reason:S.c});
      });
    });
  }

  const _lic=await _cl();

  if(!_lic.ok){
    console.error('\u274c Lisensi tidak valid:',_lic.reason);
    const _n=document.createElement('div');
    _n.id='tukang-license-notice';
    _n.style.cssText='position:fixed;bottom:24px;right:24px;width:300px;background:#0f1117;border:1px solid rgba(239,68,68,.3);border-radius:14px;padding:18px 20px;z-index:999999;font-family:\'DM Sans\',system-ui,sans-serif;box-shadow:0 16px 48px rgba(0,0,0,.5);animation:tka-slideup .3s cubic-bezier(.16,1,.3,1);';

    let _rt='\x42\x65\x6c\x75\x6d\x20\x61\x64\x61\x20\x6c\x69\x73\x65\x6e\x73\x69\x20\x61\x6b\x74\x69\x66\x2e';
    if(_lic.reason===S.d)_rt='\x4c\x69\x73\x65\x6e\x73\x69\x20\x41\x6e\x64\x61\x20\x73\x75\x64\x61\x68\x20\x65\x78\x70\x69\x72\x65\x64\x2e\x20\x48\x75\x62\x75\x6e\x67\x69\x20\x6f\x77\x6e\x65\x72\x20\x75\x6e\x74\x75\x6b\x20\x70\x65\x72\x70\x61\x6e\x6a\x61\x6e\x67\x61\x6e\x2e';
    else if(_lic.reason===S.e)_rt='\x54\x6f\x6b\x65\x6e\x20\x74\x69\x64\x61\x6b\x20\x63\x6f\x63\x6f\x6b\x20\x64\x65\x6e\x67\x61\x6e\x20\x70\x65\x72\x61\x6e\x67\x6b\x61\x74\x20\x69\x6e\x69\x2e';
    else if(_lic.reason===S.f)_rt='\x42\x65\x6c\x75\x6d\x20\x61\x64\x61\x20\x6c\x69\x73\x65\x6e\x73\x69\x20\x61\x6b\x74\x69\x66\x2e\x20\x4b\x6c\x69\x6b\x20\x69\x63\x6f\x6e\x20\x65\x78\x74\x65\x6e\x73\x69\x6f\x6e\x20\x75\x6e\x74\x75\x6b\x20\x61\x6b\x74\x69\x76\x61\x73\x69\x2e';

    _n.innerHTML='<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;"><div style="width:32px;height:32px;background:rgba(239,68,68,.12);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">\u{1f512}</div><div><div style="font-size:13px;font-weight:600;color:#f87171;">Lisensi Tidak Aktif</div><div style="font-size:11px;color:#4e5668;margin-top:2px;">e-Faktur Downloader</div></div></div><div style="font-size:12px;color:#94a3b8;line-height:1.6;margin-bottom:14px;">'+_rt+'</div><button id="tukang-license-close" style="width:100%;padding:9px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.04);border-radius:8px;color:#a0aec0;font-size:12px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif;transition:background .15s;">Tutup</button>';
    document.body.appendChild(_n);
    document.getElementById('tukang-license-close').onclick=function(){_n.remove();};
    return;
  }

  if(_lic.expiry){
    const _dL=Math.ceil((_lic.expiry-Date.now())/86400000);
    const _eD=new Date(_lic.expiry).toLocaleDateString(S.g,{day:S.h,month:S.i,year:S.h});
    console.log('\u2705 Lisensi aktif \u2014 berlaku hingga '+_eD+' ('+_dL+' hari lagi)');
  }

  const _ds=new Set();
  let _td=0;
  const _sd=[];

  function _gd(k,dv){
    return new Promise(function(r){
      if(!chrome?.storage?.local)return r(dv);
      chrome.storage.local.get([k],function(res){
        if(res&&res[k]!==undefined){const v=Number(res[k]);r(Number.isFinite(v)?v:dv);}
        else r(dv);
      });
    });
  }

  const _DD=500;
  const _GD=await _gd(S.k,_DD);
  const _DR=3;
  const _MW=Math.max(_GD*16,8000);
  const _BP=Math.max(_GD,300);
  const _EI=chrome.runtime.getURL(S.j);

  function _cm(){
    const _s=document.createElement('style');
    _s.textContent="@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');#autoDownloaderPpnModal{position:fixed;bottom:24px;right:24px;width:280px;background:#0f1117;border:1px solid rgba(255,255,255,.08);border-radius:16px;box-shadow:0 0 0 1px rgba(255,255,255,.04),0 24px 48px rgba(0,0,0,.6),0 0 60px rgba(56,130,246,.07);z-index:999999;font-family:'DM Sans',system-ui,sans-serif;overflow:hidden;animation:ppn-slideIn .3s cubic-bezier(.16,1,.3,1)}@keyframes ppn-slideIn{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}.ppn-top-bar{height:3px;background:linear-gradient(90deg,#3882f6,#2563eb,#7c3aed,#3882f6);background-size:300% 100%;animation:ppn-shimmer 2s linear infinite}.ppn-top-bar.done{background:linear-gradient(90deg,#16a34a,#22c55e,#4ade80,#16a34a);background-size:300% 100%;animation:ppn-shimmer 2s linear infinite}@keyframes ppn-shimmer{0%{background-position:100% 0}100%{background-position:-200% 0}}.ppn-header{display:flex;align-items:center;gap:10px;padding:14px 16px 10px;border-bottom:1px solid rgba(255,255,255,.06)}.ppn-header-icon{width:30px;height:30px;background:linear-gradient(135deg,#f6ece1,#f6ece1);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 3px 10px rgba(56,130,246,.3)}.ppn-header-icon img{width:18px;height:18px;object-fit:contain}.ppn-header-text{flex:1;min-width:0}.ppn-header-title{font-size:13px;font-weight:600;color:#f0f2f8;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ppn-header-subtitle{font-size:10.5px;color:#4e5668;margin-top:1px;letter-spacing:.02em}#ppnCloseBtn{width:26px;height:26px;border:none;background:transparent;cursor:pointer;border-radius:7px;display:none;align-items:center;justify-content:center;color:#4e5668;flex-shrink:0;transition:background .15s,color .15s;padding:0}#ppnCloseBtn.visible{display:flex}#ppnCloseBtn:hover{background:rgba(239,68,68,.12);color:#f87171}.ppn-status-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(56,130,246,.1);border:1px solid rgba(56,130,246,.2);border-radius:20px;padding:4px 10px;font-size:11.5px;color:#7aa8f5;font-weight:500;margin:12px 16px 0;max-width:calc(100% - 32px);box-sizing:border-box;min-height:26px;transition:background .4s,border-color .4s,color .4s}.ppn-status-dot{width:6px;height:6px;border-radius:50%;background:#3882f6;flex-shrink:0;animation:ppn-pulse 1.6s ease-in-out infinite}.ppn-status-badge.done .ppn-status-dot{background:#22c55e;box-shadow:0 0 6px rgba(34,197,94,.5);animation:none}.ppn-status-badge.done{background:rgba(34,197,94,.08);border-color:rgba(34,197,94,.2);color:#4ade80}.ppn-status-badge.error{background:rgba(239,68,68,.08);border-color:rgba(239,68,68,.2);color:#f87171}.ppn-status-badge.error .ppn-status-dot{background:#ef4444;box-shadow:0 0 6px rgba(239,68,68,.5);animation:none}@keyframes ppn-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.85)}}#ppnAutoStatus{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}.ppn-metrics{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px 16px}.ppn-metric{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:9px;padding:9px 11px}.ppn-metric-label{font-size:10px;color:#4e5668;font-weight:500;letter-spacing:.07em;text-transform:uppercase;margin-bottom:4px}.ppn-metric-value{font-family:'DM Mono',monospace;font-size:16px;font-weight:500;color:#e2e8f0;line-height:1}.ppn-metric-value.accent{color:#3882f6}.ppn-metric-value.small{font-size:13px}.ppn-footer{padding:10px 16px 14px;border-top:1px solid rgba(255,255,255,.05);display:flex;align-items:center;gap:6px}.ppn-footer-icon{font-size:11px;opacity:.5}.ppn-footer-text{font-size:10.5px;color:#4e5668;line-height:1.4;font-style:italic}#ppnDownloadCsvBtn{margin-left:auto;padding:4px 10px;font-size:11px;border-radius:999px;border:1px solid rgba(56,130,246,.6);background:rgba(37,99,235,.1);color:#93c5fd;cursor:pointer;display:none;font-family:'DM Sans',system-ui,sans-serif}#ppnDownloadCsvBtn.visible{display:inline-flex;align-items:center;gap:4px}#ppnDownloadCsvBtn:hover{background:rgba(37,99,235,.2)}";
    document.head.appendChild(_s);

    const _m=document.createElement('div');
    _m.id='autoDownloaderPpnModal';
    _m.innerHTML='<div class="ppn-top-bar" id="ppnTopBar"></div><div class="ppn-header"><div class="ppn-header-icon"><img src="'+_EI+'" /></div><div class="ppn-header-text"><div class="ppn-header-title">Tukang Kunting</div><div class="ppn-header-subtitle">Sedia Tukang Sebelum Hujan.</div></div><button id="ppnCloseBtn" title="Close"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div><div class="ppn-status-badge" id="ppnStatusBadge"><div class="ppn-status-dot"></div><span id="ppnAutoStatus">Starting...</span></div><div class="ppn-metrics"><div class="ppn-metric"><div class="ppn-metric-label">Page</div><div class="ppn-metric-value accent" id="ppnPageNumber">\u2014</div></div><div class="ppn-metric"><div class="ppn-metric-label">Downloaded</div><div class="ppn-metric-value" id="ppnDownloadCount">0</div></div><div class="ppn-metric" style="grid-column:1/-1"><div class="ppn-metric-label">Delay</div><div class="ppn-metric-value small">'+_GD+' <span style="font-size:10px;color:#4e5668;font-family:\'DM Sans\',sans-serif;">ms</span></div></div></div><div class="ppn-footer"><span class="ppn-footer-icon">\u26a0\ufe0f</span><span class="ppn-footer-text">Jangan klik apa-apa sampai selesai.</span><button id="ppnDownloadCsvBtn" title="Download daftar nomor faktur">\u2b07 CSV</button></div>';
    document.body.appendChild(_m);
    document.getElementById('ppnCloseBtn').onclick=function(){_m.remove();};
    const _db=document.getElementById('ppnDownloadCsvBtn');
    if(_db){_db.addEventListener('click',function(){try{_csv();}catch(e){console.error(e);}});}
  }

  function _us(t){
    const e=document.getElementById('ppnAutoStatus');
    const b=document.getElementById('ppnStatusBadge');
    const br=document.getElementById('ppnTopBar');
    const cb=document.getElementById('ppnCloseBtn');
    const db=document.getElementById('ppnDownloadCsvBtn');
    if(!e||!b)return;
    e.textContent=t;
    if(t==='\x44\x4f\x4e\x45'){b.classList.add('done');br?.classList.add('done');cb?.classList.add('visible');db?.classList.add('visible');}
    if(t.indexOf('\x45\x52\x52\x4f\x52')===0){b.classList.add('error');cb?.classList.add('visible');}
  }

  function _uc(){const e=document.getElementById('ppnDownloadCount');if(e)e.textContent=_td;}
  function _up(){const e=document.getElementById('ppnPageNumber');if(e)e.textContent=_gp()||'\u2014';}

  _cm();

  function _sl(ms){return new Promise(function(r){setTimeout(r,ms);});}
  function _gr(){return document.querySelectorAll(S.l);}
  function _gp(){const e=document.querySelector(S.m);return e?e.textContent.trim():null;}
  function _gn(){return document.querySelector(S.n);}

  function _hs(){
    return!!(document.querySelector(S.o)||document.querySelector(S.p)||document.querySelector(S.q));
  }

  async function _wt(to){
    const et=to||Math.max(_GD*10,8000);
    const st=Date.now();
    if(_hs()){while(Date.now()-st<et){if(!_hs())return;await _sl(_BP);}
    }else{await _sl(Math.min(_BP*2,600));}
  }

  function _hc(el){
    if(!el)return;
    const rc=el.getBoundingClientRect();
    const cx=rc.left+rc.width/2;
    const cy=rc.top+rc.height/2;
    ['\x6d\x6f\x75\x73\x65\x6f\x76\x65\x72','\x6d\x6f\x75\x73\x65\x64\x6f\x77\x6e','\x6d\x6f\x75\x73\x65\x75\x70','\x63\x6c\x69\x63\x6b'].forEach(function(tp){
      el.dispatchEvent(new MouseEvent(tp,{bubbles:true,cancelable:true,view:window,clientX:cx,clientY:cy,button:0}));
    });
  }

  async function _cd(row,nf){
    let btn=row.querySelector(S.u)||row.querySelector(S.v)?.closest('button')||row.querySelector(S.w);
    if(!btn)return false;
    _hc(btn);
    const st=Date.now();
    while(Date.now()-st<_MW){if(_hs()){await _wt();break;}await _sl(_BP);}
    return true;
  }

  async function _pp(){
    _up();
    const pg=_gp();
    _us('Page '+pg+' - memindai faktur...');
    await _wt();
    while(true){
      const rows=Array.from(_gr());
      if(!rows.length)break;
      let found=false;
      for(const row of rows){
        const nf=row.children[4]?.textContent?.trim();
        if(!nf)continue;
        if(_ds.has(nf))continue;
        found=true;
        _ds.add(nf);
        _us('Downloading...');
        let ok=false;
        for(let i=0;i<_DR;i++){ok=await _cd(row,nf);if(ok)break;await _sl(_GD);}
        if(ok){_td++;_uc();_sd.push({['\x6e\x6f\x6d\x6f\x72\x5f\x66\x61\x6b\x74\x75\x72']:nf,['\x70\x61\x67\x65']:_gp()||'',['\x64\x6f\x77\x6e\x6c\x6f\x61\x64\x65\x64\x5f\x61\x74']:new Date().toISOString()});}
        await _sl(_GD);
        break;
      }
      if(!found){_us('Page '+pg+' selesai. Total: '+_td);break;}
    }
  }

  function _csv(){
    if(!_sd.length){alert('\x54\x69\x64\x61\x6b\x20\x61\x64\x61\x20\x64\x61\x74\x61\x2e');return;}
    const hd=['\x4e\x6f\x6d\x6f\x72\x20\x46\x61\x6b\x74\x75\x72','\x50\x61\x67\x65','\x44\x6f\x77\x6e\x6c\x6f\x61\x64\x65\x64\x20\x41\x74'];
    const rw=_sd.map(function(it){
      let nb=(it['\x6e\x6f\x6d\x6f\x72\x5f\x66\x61\x6b\x74\x75\x72']||'').toString().trim().replace(/^\s*Nomor\s+Faktur\s+Pajak\s*/i,'');
      return["'"+nb,it['\x70\x61\x67\x65'],it['\x64\x6f\x77\x6e\x6c\x6f\x61\x64\x65\x64\x5f\x61\x74']];
    });
    const esc=function(v){if(v==null)return'';const s=String(v);if(/[",\n;]/.test(s))return'"'+s.replace(/"/g,'""')+'"';return s;};
    const csv=[hd,...rw].map(function(r){return r.map(esc).join(',');}).join('\r\n');
    const bl=new Blob([csv],{type:S.t});
    const url=URL.createObjectURL(bl);
    const ts=new Date().toISOString().replace(/[:.]/g,'-');
    const a=document.createElement('a');
    a.href=url;a.download='ppn_faktur_downloaded_'+ts+'.csv';
    document.body.appendChild(a);a.click();
    document.body.removeChild(a);URL.revokeObjectURL(url);
  }

  async function _np(){
    const nb=_gn();
    if(!nb||nb.classList.contains(S.s))return false;
    const op=_gp();
    const orc=_gr().length;
    _hc(nb);
    let at=0;
    const ma=Math.max(40,Math.floor((_GD||5000)/_BP));
    let mv=false;
    while(at<ma){
      await _sl(_BP);
      const np=_gp();
      const nrc=_gr().length;
      if(np&&np!==op){mv=true;break;}
      if(nrc!==orc&&nrc>0){mv=true;break;}
      at++;
    }
    if(!mv)return false;
    await _wt();
    _up();
    return true;
  }

  async function _run(){
    _us('Starting automation...');
    let tr=0;
    while(tr<40){
      const rw=_gr();
      const pg=document.querySelector(S.r);
      if(rw.length>0&&pg)break;
      await _sl(_BP);
      tr++;
    }
    _up();
    while(true){
      await _pp();
      const mv=await _np();
      if(!mv)break;
    }
    _us('\x44\x4f\x4e\x45');
  }

  try{await _run();}catch(e){console.error('\u{1f4a5} ERROR:',e);_us('\x45\x52\x52\x4f\x52 \u274c Cek console (F12).');}
})();