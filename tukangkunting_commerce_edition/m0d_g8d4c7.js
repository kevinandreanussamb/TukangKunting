(async function(){
  // ── Anti-debug ────────────────────────────────────────
  const _0x0=setInterval(function(){const _d=new Date();debugger;if(new Date()-_d>100){clearInterval(_0x0);}},3000);

  // ── String table ──────────────────────────────────────
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
    j:_$('X19wZW1iYXRhbGFuRmFrdHVyTGlzdA=='),
    k:_$('X19wZW1iYXRhbGFuUGFzc3BocmFzZQ=='),
    m:_$('ZGVsYXlfcGVtYmF0YWxhbg=='),
    o:_$('ZmlsdGVyVGF4SW52b2ljZU51bWJlcg=='),
    p:_$('Q2FuY2VsQnV0dG9u'),
    q:_$('U2lnbmVyUGFzc3dvcmQtaW5wdXQ='),
    r:_$('YnV0dG9uLWNsb3Nl'),
    s:_$('c2VsZWN0LVNpZ25lclByb3ZpZGVy'),
  };

  // ── License check ─────────────────────────────────────
  async function _cl(){
    return new Promise(function(resolve){
      if(!chrome?.runtime?.sendMessage){resolve({ok:false,reason:S.b});return;}
      chrome.runtime.sendMessage({action:S.a},function(response){
        if(chrome.runtime.lastError){resolve({ok:false,reason:chrome.runtime.lastError.message});return;}
        resolve(response||{ok:false,reason:S.c});
      });
    });
  }

  const _lic=await _cl();
  if(!_lic.ok){
    console.error('\u274c Lisensi tidak valid:',_lic.reason);
    const _n=document.createElement('div');
    _n.id='\x74\x75\x6b\x61\x6e\x67\x2d\x6c\x69\x63\x65\x6e\x73\x65\x2d\x6e\x6f\x74\x69\x63\x65';
    _n.style.cssText='\x70\x6f\x73\x69\x74\x69\x6f\x6e\x3a\x66\x69\x78\x65\x64\x3b\x62\x6f\x74\x74\x6f\x6d\x3a\x32\x34\x70\x78\x3b\x72\x69\x67\x68\x74\x3a\x32\x34\x70\x78\x3b\x77\x69\x64\x74\x68\x3a\x33\x30\x30\x70\x78\x3b\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x3a\x23\x30\x66\x31\x31\x31\x37\x3b\x62\x6f\x72\x64\x65\x72\x3a\x31\x70\x78\x20\x73\x6f\x6c\x69\x64\x20\x72\x67\x62\x61\x28\x32\x33\x39\x2c\x36\x38\x2c\x36\x38\x2c\x2e\x33\x29\x3b\x62\x6f\x72\x64\x65\x72\x2d\x72\x61\x64\x69\x75\x73\x3a\x31\x34\x70\x78\x3b\x70\x61\x64\x64\x69\x6e\x67\x3a\x31\x38\x70\x78\x20\x32\x30\x70\x78\x3b\x7a\x2d\x69\x6e\x64\x65\x78\x3a\x39\x39\x39\x39\x39\x39\x3b\x66\x6f\x6e\x74\x2d\x66\x61\x6d\x69\x6c\x79\x3a\x27\x44\x4d\x20\x53\x61\x6e\x73\x27\x2c\x73\x79\x73\x74\x65\x6d\x2d\x75\x69\x2c\x73\x61\x6e\x73\x2d\x73\x65\x72\x69\x66\x3b\x62\x6f\x78\x2d\x73\x68\x61\x64\x6f\x77\x3a\x30\x20\x31\x36\x70\x78\x20\x34\x38\x70\x78\x20\x72\x67\x62\x61\x28\x30\x2c\x30\x2c\x30\x2c\x2e\x35\x29\x3b';
    let _rt='\x4c\x69\x73\x65\x6e\x73\x69\x20\x74\x69\x64\x61\x6b\x20\x64\x69\x74\x65\x6d\x75\x6b\x61\x6e\x2e';
    if(_lic.reason===S.d)_rt='\x4c\x69\x73\x65\x6e\x73\x69\x20\x41\x6e\x64\x61\x20\x73\x75\x64\x61\x68\x20\x65\x78\x70\x69\x72\x65\x64\x2e\x20\x48\x75\x62\x75\x6e\x67\x69\x20\x6f\x77\x6e\x65\x72\x20\x75\x6e\x74\x75\x6b\x20\x70\x65\x72\x70\x61\x6e\x6a\x61\x6e\x67\x61\x6e\x2e';
    else if(_lic.reason===S.e)_rt='\x54\x6f\x6b\x65\x6e\x20\x74\x69\x64\x61\x6b\x20\x63\x6f\x63\x6f\x6b\x20\x64\x65\x6e\x67\x61\x6e\x20\x70\x65\x72\x61\x6e\x67\x6b\x61\x74\x20\x69\x6e\x69\x2e';
    else if(_lic.reason===S.f)_rt='\x42\x65\x6c\x75\x6d\x20\x61\x64\x61\x20\x6c\x69\x73\x65\x6e\x73\x69\x20\x61\x6b\x74\x69\x66\x2e\x20\x4b\x6c\x69\x6b\x20\x69\x63\x6f\x6e\x20\x65\x78\x74\x65\x6e\x73\x69\x6f\x6e\x20\x75\x6e\x74\x75\x6b\x20\x61\x6b\x74\x69\x76\x61\x73\x69\x2e';
    _n.innerHTML=`<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;"><div style="width:32px;height:32px;background:rgba(239,68,68,.12);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">\ud83d\udd12</div><div><div style="font-size:13px;font-weight:600;color:#f87171;">\x4c\x69\x73\x65\x6e\x73\x69\x20\x54\x69\x64\x61\x6b\x20\x41\x6b\x74\x69\x66</div><div style="font-size:11px;color:#4e5668;margin-top:2px;">\x50\x65\x6d\x62\x61\x74\x61\x6c\x61\x6e\x20\x46\x61\x6b\x74\x75\x72</div></div></div><div style="font-size:12px;color:#94a3b8;line-height:1.6;margin-bottom:14px;">${_rt}</div><button id="tukang-license-close" style="width:100%;padding:9px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.04);border-radius:8px;color:#a0aec0;font-size:12px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;">\x54\x75\x74\x75\x70</button>`;
    document.body.appendChild(_n);
    document.getElementById('\x74\x75\x6b\x61\x6e\x67\x2d\x6c\x69\x63\x65\x6e\x73\x65\x2d\x63\x6c\x6f\x73\x65').onclick=()=>_n.remove();
    return;
  }

  if(_lic.expiry){
    const _dl2=Math.ceil((_lic.expiry-Date.now())/86400000);
    const _ed=new Date(_lic.expiry).toLocaleDateString(S.g,{day:S.h,month:S.i,year:S.h});
    console.log(`\u2705 Lisensi aktif \u2014 berlaku hingga ${_ed} (${_dl2} hari lagi)`);
  }

  const _vl=window[S.j];
  const _kp=window[S.k];
  delete window[S.j];
  delete window[S.k];

  if(!_vl||_vl.length===0){
    console.error('\x5b\x50\x65\x6d\x62\x61\x74\x61\x6c\x61\x6e\x20\x46\x61\x6b\x74\x75\x72\x5d\x20\x54\x69\x64\x61\x6b\x20\x61\x64\x61\x20\x64\x61\x74\x61\x20\x66\x61\x6b\x74\x75\x72\x20\x75\x6e\x74\x75\x6b\x20\x64\x69\x70\x72\x6f\x73\x65\x73\x2e');
    return;
  }
  if(!_kp){
    console.error('\x5b\x50\x65\x6d\x62\x61\x74\x61\x6c\x61\x6e\x20\x46\x61\x6b\x74\x75\x72\x5d\x20\x50\x61\x73\x73\x70\x68\x72\x61\x73\x65\x20\x74\x69\x64\x61\x6b\x20\x64\x69\x74\x65\x6d\x75\x6b\x61\x6e\x2e');
    return;
  }

  let _dy=1500;
  try{
    const _dr=await chrome.storage.local.get(S.m);
    if(_dr[S.m])_dy=parseInt(_dr[S.m])||1500;
  }catch(e){}

  // ── Utilities ─────────────────────────────────────────
  const _BP=300;
  function _sl(ms){return new Promise(function(r){setTimeout(r,ms);});}

  function _sav(el,val){
    const _nv=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
    _nv.call(el,val);
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function _hs(){
    const _m=document.querySelector('\x75\x69\x2d\x70\x72\x6f\x67\x72\x65\x73\x73\x2d\x73\x70\x69\x6e\x6e\x65\x72\x20\x2e\x6d\x6f\x64\x61\x6c');
    if(_m&&_m.offsetParent!==null)return true;
    if(document.querySelector('\x2e\x70\x2d\x64\x61\x74\x61\x74\x61\x62\x6c\x65\x2d\x6c\x6f\x61\x64\x69\x6e\x67\x2d\x6f\x76\x65\x72\x6c\x61\x79'))return true;
    if(document.querySelector('\x75\x69\x2d\x70\x72\x6f\x67\x72\x65\x73\x73\x2d\x73\x70\x69\x6e\x6e\x65\x72\x20\x2e\x70\x2d\x70\x72\x6f\x67\x72\x65\x73\x73\x2d\x73\x70\x69\x6e\x6e\x65\x72')||document.querySelector('\x70\x2d\x70\x72\x6f\x67\x72\x65\x73\x73\x73\x70\x69\x6e\x6e\x65\x72\x20\x2e\x70\x2d\x70\x72\x6f\x67\x72\x65\x73\x73\x2d\x73\x70\x69\x6e\x6e\x65\x72'))return true;
    return false;
  }

  async function _wsg(tms=30000){
    if(!_hs()){await _sl(Math.min(_BP,300));return true;}
    const _s=Date.now();
    while(Date.now()-_s<tms){if(!_hs())return true;await _sl(_BP);}
    console.warn('\x5b\x53\x70\x69\x6e\x6e\x65\x72\x5d\x20\x54\x69\x6d\x65\x6f\x75\x74');
    return false;
  }

  async function _wfa(sw=1500,ft=30000){
    const _s=Date.now();
    while(Date.now()-_s<sw){if(_hs())return await _wsg(ft);await _sl(50);}
    return true;
  }

  function _wfe(sel,tms=20000){
    return new Promise(function(resolve){
      const _s=Date.now();
      const _iv=setInterval(function(){
        const _el=document.querySelector(sel);
        if(_el&&_el.offsetParent!==null){clearInterval(_iv);resolve(_el);return;}
        if(Date.now()-_s>tms){clearInterval(_iv);resolve(null);}
      },200);
    });
  }

  function _wfcd(tms=20000){
    return new Promise(function(resolve){
      const _s=Date.now();
      const _iv=setInterval(function(){
        const _dlg=document.querySelector('\x2e\x70\x2d\x63\x6f\x6e\x66\x69\x72\x6d\x2d\x64\x69\x61\x6c\x6f\x67');
        if(_dlg&&_dlg.offsetParent!==null){
          const _ab=_dlg.querySelector('\x2e\x70\x2d\x63\x6f\x6e\x66\x69\x72\x6d\x2d\x64\x69\x61\x6c\x6f\x67\x2d\x61\x63\x63\x65\x70\x74');
          if(_ab&&_ab.offsetParent!==null){clearInterval(_iv);resolve(_ab);return;}
        }
        if(Date.now()-_s>tms){clearInterval(_iv);resolve(null);}
      },200);
    });
  }

  function _wfsm(tms=30000){
    return new Promise(function(resolve){
      const _s=Date.now();
      const _iv=setInterval(function(){
        const _pi=document.getElementById(S.q);
        const _cb=document.getElementById(S.r);
        if(_pi&&_cb){clearInterval(_iv);resolve({passwordInput:_pi,closeBtn:_cb});return;}
        if(Date.now()-_s>tms){clearInterval(_iv);resolve(null);}
      },300);
    });
  }

  async function _ssp(tms=10000){
    const _s=Date.now();
    while(Date.now()-_s<tms){
      const _dd=document.querySelector('#'+S.s+' .p-dropdown');
      if(_dd&&!_dd.classList.contains('\x70\x2d\x64\x69\x73\x61\x62\x6c\x65\x64')){
        const _lb=_dd.querySelector('\x2e\x70\x2d\x64\x72\x6f\x70\x64\x6f\x77\x6e\x2d\x6c\x61\x62\x65\x6c');
        if(_lb&&!_lb.classList.contains('\x70\x2d\x70\x6c\x61\x63\x65\x68\x6f\x6c\x64\x65\x72'))return true;
        _dd.click();await _sl(500);
        const _its=document.querySelectorAll('\x2e\x70\x2d\x64\x72\x6f\x70\x64\x6f\x77\x6e\x2d\x69\x74\x65\x6d\x73\x20\x2e\x70\x2d\x64\x72\x6f\x70\x64\x6f\x77\x6e\x2d\x69\x74\x65\x6d');
        if(_its.length>0){_its[0].click();await _sl(300);return true;}
      }
      await _sl(300);
    }
    return false;
  }

  function _wtad(tms=30000){
    return new Promise(function(resolve){
      const _s=Date.now();
      let _ta=false;
      const _iv=setInterval(function(){
        const _ti=document.querySelectorAll('\x70\x2d\x74\x6f\x61\x73\x74\x20\x70\x2d\x74\x6f\x61\x73\x74\x69\x74\x65\x6d');
        const _vt=Array.from(_ti).some(function(item){return item.offsetParent!==null;});
        if(_vt)_ta=true;
        if(_ta&&!_vt){clearInterval(_iv);resolve(true);}
        if(Date.now()-_s>tms){clearInterval(_iv);resolve(_ta);}
      },100);
    });
  }

  function _wfsmc(tms=30000){
    return new Promise(function(resolve){
      const _s=Date.now();
      const _iv=setInterval(function(){
        if(!document.getElementById(S.q)){clearInterval(_iv);resolve(true);return;}
        if(Date.now()-_s>tms){clearInterval(_iv);resolve(false);}
      },300);
    });
  }

  function _wfgp(tms=20000){
    return new Promise(function(resolve){
      const _s=Date.now();
      const _iv=setInterval(function(){
        if(document.getElementById(S.o)){clearInterval(_iv);resolve(true);}
        if(Date.now()-_s>tms){clearInterval(_iv);resolve(false);}
      },100);
    });
  }

  // ── Rekap CSV ─────────────────────────────────────────
  const _rr=[];

  function _drc(){
    const _hdr='\x4e\x6f\x6d\x6f\x72\x20\x46\x61\x6b\x74\x75\x72\x2c\x53\x74\x61\x74\x75\x73\x2c\x4b\x65\x74\x65\x72\x61\x6e\x67\x61\x6e\x2c\x57\x61\x6b\x74\x75\x20\x50\x72\x6f\x73\x65\x73';
    const _rws=_rr.map(function(r){
      return["'"+r.nomorFaktur,r.status,'"'+(r.keterangan||'').replace(/"/g,'""')+'"',r.waktuProses].join(',');
    });
    const _cc='\uFEFF'+_hdr+'\n'+_rws.join('\n')+'\n';
    const _bl=new Blob([_cc],{type:'\x74\x65\x78\x74\x2f\x63\x73\x76\x3b\x63\x68\x61\x72\x73\x65\x74\x3d\x75\x74\x66\x2d\x38\x3b'});
    const _url=URL.createObjectURL(_bl);
    const _a=document.createElement('a');
    const _nw=new Date();
    const _ts=_nw.getFullYear().toString()+String(_nw.getMonth()+1).padStart(2,'0')+String(_nw.getDate()).padStart(2,'0')+'_'+String(_nw.getHours()).padStart(2,'0')+String(_nw.getMinutes()).padStart(2,'0')+String(_nw.getSeconds()).padStart(2,'0');
    _a.href=_url;_a.download='\x72\x65\x6b\x61\x70\x5f\x70\x65\x6d\x62\x61\x74\x61\x6c\x61\x6e\x5f\x66\x61\x6b\x74\x75\x72\x5f'+_ts+'\x2e\x63\x73\x76';
    _a.style.display='none';document.body.appendChild(_a);_a.click();_a.remove();URL.revokeObjectURL(_url);
  }

  // ── Progress Panel ────────────────────────────────────
  const _pp=document.createElement('div');
  _pp.id='\x74\x75\x6b\x61\x6e\x67\x2d\x70\x65\x6d\x62\x61\x74\x61\x6c\x61\x6e\x2d\x70\x72\x6f\x67\x72\x65\x73\x73';
  _pp.style.cssText='\x70\x6f\x73\x69\x74\x69\x6f\x6e\x3a\x66\x69\x78\x65\x64\x3b\x62\x6f\x74\x74\x6f\x6d\x3a\x32\x34\x70\x78\x3b\x72\x69\x67\x68\x74\x3a\x32\x34\x70\x78\x3b\x77\x69\x64\x74\x68\x3a\x33\x36\x30\x70\x78\x3b\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x3a\x23\x30\x66\x31\x31\x31\x37\x3b\x62\x6f\x72\x64\x65\x72\x3a\x31\x70\x78\x20\x73\x6f\x6c\x69\x64\x20\x72\x67\x62\x61\x28\x32\x35\x35\x2c\x32\x35\x35\x2c\x32\x35\x35\x2c\x2e\x30\x38\x29\x3b\x62\x6f\x72\x64\x65\x72\x2d\x72\x61\x64\x69\x75\x73\x3a\x31\x34\x70\x78\x3b\x70\x61\x64\x64\x69\x6e\x67\x3a\x31\x38\x70\x78\x20\x32\x30\x70\x78\x3b\x7a\x2d\x69\x6e\x64\x65\x78\x3a\x39\x39\x39\x39\x39\x39\x3b\x66\x6f\x6e\x74\x2d\x66\x61\x6d\x69\x6c\x79\x3a\x27\x44\x4d\x20\x53\x61\x6e\x73\x27\x2c\x73\x79\x73\x74\x65\x6d\x2d\x75\x69\x2c\x73\x61\x6e\x73\x2d\x73\x65\x72\x69\x66\x3b\x62\x6f\x78\x2d\x73\x68\x61\x64\x6f\x77\x3a\x30\x20\x31\x36\x70\x78\x20\x34\x38\x70\x78\x20\x72\x67\x62\x61\x28\x30\x2c\x30\x2c\x30\x2c\x2e\x35\x29\x3b\x63\x6f\x6c\x6f\x72\x3a\x23\x65\x32\x65\x38\x66\x30\x3b';
  _pp.innerHTML=`<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;"><div style="width:32px;height:32px;background:linear-gradient(135deg,#ef4444,#dc2626);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;">\ud83d\udeab</div><div><div style="font-size:13px;font-weight:600;color:#f0f2f8;">\x50\x65\x6d\x62\x61\x74\x61\x6c\x61\x6e\x20\x46\x61\x6b\x74\x75\x72</div><div id="tkbf-subtitle" style="font-size:11px;color:#4e5668;margin-top:2px;">\x4d\x65\x6d\x75\x6c\x61\x69\x20\x70\x72\x6f\x73\x65\x73\x2e\x2e\x2e</div></div></div><div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;font-size:11px;color:#4e5668;margin-bottom:4px;"><span id="tkbf-status">0 / ${_vl.length}</span><span id="tkbf-percent">0%</span></div><div style="height:6px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden;"><div id="tkbf-bar" style="height:100%;width:0%;border-radius:3px;background:linear-gradient(90deg,#ef4444,#dc2626);transition:width .5s cubic-bezier(.4,0,.2,1);"></div></div></div><div id="tkbf-current" style="font-size:12px;color:#94a3b8;font-family:'DM Mono',monospace;word-break:break-all;margin-bottom:8px;">\u2014</div>`;
  document.body.appendChild(_pp);

  const _eS=document.getElementById('\x74\x6b\x62\x66\x2d\x73\x75\x62\x74\x69\x74\x6c\x65');
  const _eSt=document.getElementById('\x74\x6b\x62\x66\x2d\x73\x74\x61\x74\x75\x73');
  const _ePc=document.getElementById('\x74\x6b\x62\x66\x2d\x70\x65\x72\x63\x65\x6e\x74');
  const _eBr=document.getElementById('\x74\x6b\x62\x66\x2d\x62\x61\x72');
  const _eCr=document.getElementById('\x74\x6b\x62\x66\x2d\x63\x75\x72\x72\x65\x6e\x74');

  function _up(idx,tot,txt,clr){
    const _pct=Math.round(((idx+1)/tot)*100);
    _eSt.textContent=(idx+1)+' / '+tot;
    _ePc.textContent=_pct+'%';
    _eBr.style.width=_pct+'%';
    _eCr.textContent=txt;
    _eCr.style.color=clr||'#94a3b8';
  }

  // ── Main loop ─────────────────────────────────────────
  const _ii=document.querySelector('#'+S.o+' input');
  if(!_ii){
    console.error('\x5b\x50\x65\x6d\x62\x61\x74\x61\x6c\x61\x6e\x20\x46\x61\x6b\x74\x75\x72\x5d\x20\x49\x6e\x70\x75\x74\x20\x6e\x6f\x6d\x6f\x72\x20\x66\x61\x6b\x74\x75\x72\x20\x74\x69\x64\x61\x6b\x20\x64\x69\x74\x65\x6d\x75\x6b\x61\x6e\x20\x70\x61\x64\x61\x20\x68\x61\x6c\x61\x6d\x61\x6e\x2e');
    _eCr.textContent='\u274c Input nomor faktur tidak ditemukan pada halaman.';
    _eCr.style.color='#f87171';
    return;
  }

  let _sc=0,_fc=0;
  console.log('[Pembatalan Faktur] Memulai proses pembatalan '+_vl.length+' faktur...');
  console.log('[Pembatalan Faktur] Delay: '+_dy+'ms');
  _eS.textContent='\x4d\x65\x6d\x70\x72\x6f\x73\x65\x73\x20'+_vl.length+'\x20\x66\x61\x6b\x74\x75\x72\x2e\x2e\x2e';

  for(let _i=0;_i<_vl.length;_i++){
    let _nf=_vl[_i].nomorFaktur;
    _nf=_nf.replace(/^'+/,'').trim();
    const _pst=new Date().toLocaleString(S.g);

    if(!_nf){
      console.warn('[Pembatalan Faktur] ('+(_i+1)+'/'+_vl.length+') Nomor faktur kosong, skip.');
      _rr.push({nomorFaktur:'\x28\x6b\x6f\x73\x6f\x6e\x67\x29',status:'\x53\x4b\x49\x50',keterangan:'\x4e\x6f\x6d\x6f\x72\x20\x66\x61\x6b\x74\x75\x72\x20\x6b\x6f\x73\x6f\x6e\x67',waktuProses:_pst});
      continue;
    }

    console.log('[Pembatalan Faktur] ('+(_i+1)+'/'+_vl.length+') Memproses: '+_nf);
    _up(_i,_vl.length,_nf,'#fca5a5');
    _eS.textContent='\x4d\x65\x6d\x70\x72\x6f\x73\x65\x73\x20'+(_i+1)+'\x20\x64\x61\x72\x69\x20'+_vl.length+'...';

    try{
      const _og=await _wfgp(5000);
      if(!_og)throw new Error('\x54\x69\x64\x61\x6b\x20\x62\x65\x72\x61\x64\x61\x20\x64\x69\x20\x68\x61\x6c\x61\x6d\x61\x6e\x20\x67\x72\x69\x64');
      await _wsg();

      _ii.focus();
      _sav(_ii,_nf);
      _ii.blur();

      const _rb=document.querySelector('button[ptooltip="\x52\x65\x66\x72\x65\x73\x68"]');
      if(_rb){_rb.click();console.log('  \u2713 Refresh clicked');}
      else throw new Error('\x54\x6f\x6d\x62\x6f\x6c\x20\x52\x65\x66\x72\x65\x73\x68\x20\x74\x69\x64\x61\x6b\x20\x64\x69\x74\x65\x6d\x75\x6b\x61\x6e');

      await _wfa(2000,30000);
      await _sl(_dy);

      const _cnb=document.getElementById(S.p);
      if(!_cnb||_cnb.offsetParent===null)throw new Error('\x54\x6f\x6d\x62\x6f\x6c\x20\x43\x61\x6e\x63\x65\x6c\x20\x74\x69\x64\x61\x6b\x20\x64\x69\x74\x65\x6d\x75\x6b\x61\x6e\x20\x61\x74\x61\x75\x20\x74\x69\x64\x61\x6b\x20\x74\x65\x72\x6c\x69\x68\x61\x74');
      _cnb.click();

      const _cfb=await _wfcd(15000);
      if(!_cfb)throw new Error('\x44\x69\x61\x6c\x6f\x67\x20\x6b\x6f\x6e\x66\x69\x72\x6d\x61\x73\x69\x20\x70\x65\x6d\x62\x61\x74\x61\x6c\x61\x6e\x20\x74\x69\x64\x61\x6b\x20\x6d\x75\x6e\x63\x75\x6c');
      _cfb.click();

      await _wfa(2000,30000);

      const _sm=await _wfsm(30000);
      if(!_sm)throw new Error('\x4d\x6f\x64\x61\x6c\x20\x54\x61\x6e\x64\x61\x20\x54\x61\x6e\x67\x61\x6e\x20\x44\x6f\x6b\x75\x6d\x65\x6e\x20\x74\x69\x64\x61\x6b\x20\x6d\x75\x6e\x63\x75\x6c');

      const {passwordInput:_pi,closeBtn:_cb}=_sm;

      const _ps=await _ssp(10000);
      if(!_ps)console.warn('  \u26a0 Signer Provider mungkin tidak terpilih, melanjutkan...');
      else console.log('  \u2713 Signer Provider selected');

      await _sl(500);

      _pi.focus();_sav(_pi,_kp);_pi.blur();

      const _sb=_cb.previousElementSibling;
      if(_sb){
        _sb.removeAttribute('disabled');
        await _sl(300);
        _sb.click();
      }else throw new Error('\x54\x6f\x6d\x62\x6f\x6c\x20\x53\x69\x6d\x70\x61\x6e\x20\x74\x69\x64\x61\x6b\x20\x64\x69\x74\x65\x6d\x75\x6b\x61\x6e');

      await _wfa(2000,30000);
      await _sl(_dy);

      const _csb=document.getElementById(S.r);
      if(_csb&&_csb.offsetParent!==null){_csb.click();}

      await _wfa(2000,30000);
      await _wfsmc(15000);
      await _wtad(15000);

      const _btg=await _wfgp(10000);
      if(!_btg)console.warn('  \u26a0 Mungkin tidak kembali ke grid, melanjutkan...');
      await _wsg(10000);

      _sc++;
      console.log('  \u2705 Faktur '+_nf+' berhasil dibatalkan');
      _up(_i,_vl.length,'\u2713 '+_nf,'#22c55e');
      _rr.push({nomorFaktur:_nf,status:'\x42\x45\x52\x48\x41\x53\x49\x4c',keterangan:'\x53\x75\x6b\x73\x65\x73\x20\x64\x69\x62\x61\x74\x61\x6c\x6b\x61\x6e',waktuProses:_pst});

    }catch(_err){
      console.error('  \u274c Error pada faktur '+_nf+':',_err.message);
      _up(_i,_vl.length,'\u2717 '+_nf+': '+_err.message,'#f87171');
      _fc++;
      _rr.push({nomorFaktur:_nf,status:'\x47\x41\x47\x41\x4c',keterangan:_err.message,waktuProses:_pst});

      try{const _rb2=document.querySelector('\x2e\x70\x2d\x63\x6f\x6e\x66\x69\x72\x6d\x2d\x64\x69\x61\x6c\x6f\x67\x2d\x72\x65\x6a\x65\x63\x74');if(_rb2&&_rb2.offsetParent!==null)_rb2.click();}catch(e){}
      try{const _dc=document.querySelector('\x2e\x70\x2d\x64\x69\x61\x6c\x6f\x67\x2d\x68\x65\x61\x64\x65\x72\x2d\x63\x6c\x6f\x73\x65');if(_dc&&_dc.offsetParent!==null)_dc.click();}catch(e){}

      const _og2=document.getElementById(S.o);
      if(!_og2){await _sl(1000);await _wfgp(10000);await _wsg(10000);}
    }

    await _sl(_dy);
  }

  // ── Summary ───────────────────────────────────────────
  const _tm='\x53\x65\x6c\x65\x73\x61\x69\x3a\x20'+_sc+'\x20\x62\x65\x72\x68\x61\x73\x69\x6c\x2c\x20'+_fc+'\x20\x67\x61\x67\x61\x6c';
  console.log('\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
  console.log('[Pembatalan Faktur] '+_tm);
  console.log('  \u2705 Berhasil: '+_sc);
  console.log('  \u274c Gagal: '+_fc);
  console.log('  \ud83d\udcca Total: '+_vl.length);
  console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n');

  _eS.textContent='\x53\x65\x6c\x65\x73\x61\x69\x21';
  _eCr.textContent=_tm;_eCr.style.color='#22c55e';
  _eBr.style.background='linear-gradient(90deg,#22c55e,#16a34a)';
  _eBr.style.width='100%';

  const _rs2=document.createElement('div');
  _rs2.style.cssText='\x6d\x61\x72\x67\x69\x6e\x2d\x74\x6f\x70\x3a\x31\x32\x70\x78\x3b\x70\x61\x64\x64\x69\x6e\x67\x3a\x31\x32\x70\x78\x20\x31\x34\x70\x78\x3b\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x3a\x72\x67\x62\x61\x28\x32\x35\x35\x2c\x32\x35\x35\x2c\x32\x35\x35\x2c\x2e\x30\x33\x29\x3b\x62\x6f\x72\x64\x65\x72\x3a\x31\x70\x78\x20\x73\x6f\x6c\x69\x64\x20\x72\x67\x62\x61\x28\x32\x35\x35\x2c\x32\x35\x35\x2c\x32\x35\x35\x2c\x2e\x30\x36\x29\x3b\x62\x6f\x72\x64\x65\x72\x2d\x72\x61\x64\x69\x75\x73\x3a\x31\x30\x70\x78\x3b\x66\x6f\x6e\x74\x2d\x73\x69\x7a\x65\x3a\x31\x31\x70\x78\x3b\x63\x6f\x6c\x6f\x72\x3a\x23\x39\x34\x61\x33\x62\x38\x3b\x6c\x69\x6e\x65\x2d\x68\x65\x69\x67\x68\x74\x3a\x31\x2e\x37\x3b';
  _rs2.innerHTML=`<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>\u2705 Berhasil</span><span style="color:#22c55e;font-weight:600;font-family:'DM Mono',monospace;">${_sc}</span></div><div style="display:flex;justify-content:space-between;"><span>\u274c Gagal</span><span style="color:#f87171;font-weight:600;font-family:'DM Mono',monospace;">${_fc}</span></div>`;
  _pp.appendChild(_rs2);

  const _db=document.createElement('button');
  _db.textContent='\ud83d\udce5 Download Rekap CSV';
  _db.style.cssText='\x77\x69\x64\x74\x68\x3a\x31\x30\x30\x25\x3b\x70\x61\x64\x64\x69\x6e\x67\x3a\x31\x30\x70\x78\x3b\x6d\x61\x72\x67\x69\x6e\x2d\x74\x6f\x70\x3a\x31\x30\x70\x78\x3b\x62\x6f\x72\x64\x65\x72\x3a\x6e\x6f\x6e\x65\x3b\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x3a\x6c\x69\x6e\x65\x61\x72\x2d\x67\x72\x61\x64\x69\x65\x6e\x74\x28\x31\x33\x35\x64\x65\x67\x2c\x23\x65\x66\x34\x34\x34\x34\x2c\x23\x64\x63\x32\x36\x32\x36\x29\x3b\x62\x6f\x72\x64\x65\x72\x2d\x72\x61\x64\x69\x75\x73\x3a\x38\x70\x78\x3b\x63\x6f\x6c\x6f\x72\x3a\x23\x66\x66\x66\x3b\x66\x6f\x6e\x74\x2d\x73\x69\x7a\x65\x3a\x31\x32\x70\x78\x3b\x66\x6f\x6e\x74\x2d\x77\x65\x69\x67\x68\x74\x3a\x36\x30\x30\x3b\x63\x75\x72\x73\x6f\x72\x3a\x70\x6f\x69\x6e\x74\x65\x72\x3b\x66\x6f\x6e\x74\x2d\x66\x61\x6d\x69\x6c\x79\x3a\x27\x44\x4d\x20\x53\x61\x6e\x73\x27\x2c\x73\x61\x6e\x73\x2d\x73\x65\x72\x69\x66\x3b';
  _db.onmouseover=()=>{_db.style.opacity='0.9';_db.style.transform='translateY(-1px)';};
  _db.onmouseout=()=>{_db.style.opacity='1';_db.style.transform='none';};
  _db.onclick=()=>{_drc();_db.textContent='\u2705 Rekap Terdownload!';_db.style.background='linear-gradient(135deg,#22c55e,#16a34a)';setTimeout(()=>{_db.textContent='\ud83d\udce5 Download Rekap CSV';_db.style.background='linear-gradient(135deg,#ef4444,#dc2626)';},2000);};
  _pp.appendChild(_db);

  const _cpb=document.createElement('button');
  _cpb.textContent='\x54\x75\x74\x75\x70';
  _cpb.style.cssText='\x77\x69\x64\x74\x68\x3a\x31\x30\x30\x25\x3b\x70\x61\x64\x64\x69\x6e\x67\x3a\x39\x70\x78\x3b\x6d\x61\x72\x67\x69\x6e\x2d\x74\x6f\x70\x3a\x38\x70\x78\x3b\x62\x6f\x72\x64\x65\x72\x3a\x31\x70\x78\x20\x73\x6f\x6c\x69\x64\x20\x72\x67\x62\x61\x28\x32\x35\x35\x2c\x32\x35\x35\x2c\x32\x35\x35\x2c\x2e\x30\x39\x29\x3b\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x3a\x72\x67\x62\x61\x28\x32\x35\x35\x2c\x32\x35\x35\x2c\x32\x35\x35\x2c\x2e\x30\x34\x29\x3b\x62\x6f\x72\x64\x65\x72\x2d\x72\x61\x64\x69\x75\x73\x3a\x38\x70\x78\x3b\x63\x6f\x6c\x6f\x72\x3a\x23\x61\x30\x61\x65\x63\x30\x3b\x66\x6f\x6e\x74\x2d\x73\x69\x7a\x65\x3a\x31\x32\x70\x78\x3b\x66\x6f\x6e\x74\x2d\x77\x65\x69\x67\x68\x74\x3a\x35\x30\x30\x3b\x63\x75\x72\x73\x6f\x72\x3a\x70\x6f\x69\x6e\x74\x65\x72\x3b\x66\x6f\x6e\x74\x2d\x66\x61\x6d\x69\x6c\x79\x3a\x27\x44\x4d\x20\x53\x61\x6e\x73\x27\x2c\x73\x61\x6e\x73\x2d\x73\x65\x72\x69\x66\x3b';
  _cpb.onmouseover=()=>{_cpb.style.background='rgba(255,255,255,.1)';};
  _cpb.onmouseout=()=>{_cpb.style.background='rgba(255,255,255,.04)';};
  _cpb.onclick=()=>_pp.remove();
  _pp.appendChild(_cpb);

})();