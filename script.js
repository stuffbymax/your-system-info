    // Utilities
    function q(id){return document.getElementById(id)}

    function detectBrowser(ua){
      ua = ua || navigator.userAgent;
      let name = 'Unknown', ver = '';
      if(/Edg\//.test(ua)){name='Microsoft Edge'; ver=(ua.match(/Edg\/(\S+)/)||[])[1]}
      else if(/OPR\//.test(ua) || /Opera/.test(ua)){name='Opera'; ver=(ua.match(/OPR\/(\S+)/)||[])[1]}
      else if(/Chrome\//.test(ua) && !/Chromium/.test(ua) && !/Edg\//.test(ua)){name='Chrome'; ver=(ua.match(/Chrome\/(\S+)/)||[])[1]}
      else if(/Safari\//.test(ua) && /Version\//.test(ua)){name='Safari'; ver=(ua.match(/Version\/(\S+)/)||[])[1]}
      else if(/Firefox\//.test(ua)){name='Firefox'; ver=(ua.match(/Firefox\/(\S+)/)||[])[1]}
      else if(/Chromium\//.test(ua)){name='Chromium'; ver=(ua.match(/Chromium\/(\S+)/)||[])[1]}
      return {name, version: ver||'unknown'};
    }

    function detectEngine(ua){
      if(/Gecko\//.test(ua) && !/like Gecko/.test(ua)) return 'Gecko';
      if(/AppleWebKit\//.test(ua)) return 'WebKit';
      if(/Trident\//.test(ua) || /MSIE /.test(ua)) return 'Trident';
      if(/KHTML\//.test(ua)) return 'KHTML';
      return 'Unknown';
    }

    async function gather(){
      const data = {};

      // General
      data.userAgent = navigator.userAgent;
      const b = detectBrowser(navigator.userAgent);
      data.browser = b;
      data.engine = detectEngine(navigator.userAgent);
      data.platform = navigator.platform || 'unknown';
      data.languages = navigator.languages || [navigator.language];
      try{data.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone}catch(e){data.timezone='unknown'}
      data.cookiesEnabled = navigator.cookieEnabled;
      data.doNotTrack = navigator.doNotTrack || navigator.msDoNotTrack || (navigator.doNotTrack === "1") || 'unspecified';

      // Screen
      data.screen = {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        colorDepth: screen.colorDepth,
        pixelRatio: window.devicePixelRatio || 1,
        orientation: (screen.orientation && screen.orientation.type) ? screen.orientation.type : 'unknown'
      };
      data.touchSupport = ('maxTouchPoints' in navigator && navigator.maxTouchPoints>0) || ('ontouchstart' in window);

      // Hardware
      data.hardware = {
        logicalProcessors: navigator.hardwareConcurrency || null,
        deviceMemoryGB: navigator.deviceMemory || null
      };

      // Battery
      if(navigator.getBattery){
        try{const batt = await navigator.getBattery(); data.battery = {charging:batt.charging,level:batt.level,chargingTime:batt.chargingTime,dischargingTime:batt.dischargingTime}}catch(e){data.battery='unavailable'}
      }else{data.battery='unsupported'}

      // Storage estimate
      if(navigator.storage && navigator.storage.estimate){
        try{const est = await navigator.storage.estimate(); data.storage = {quota:est.quota,usage:est.usage,usagePercentage: est.quota ? Math.round(est.usage/est.quota*10000)/100 : null}}catch(e){data.storage='error'}
      }else data.storage='unsupported';

      // Network
      data.online = navigator.onLine;
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if(conn){data.connection={effectiveType: conn.effectiveType,downlink: conn.downlink, rtt: conn.rtt, saveData: conn.saveData||false,type: conn.type||'unknown'}} else data.connection='unsupported';

      // Plugins
      try{data.plugins = Array.from(navigator.plugins || []).map(p=>p.name)}catch(e){data.plugins='unavailable'}

      // WebGL
      try{
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if(gl){
          const dbg = gl.getExtension('WEBGL_debug_renderer_info');
          data.webgl = {supported:true,renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : null, vendor: dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : null};
        } else data.webgl={supported:false};
      }catch(e){data.webgl='error'}

      // Service worker
      data.serviceWorker = ('serviceWorker' in navigator);

      // Cookie Store API
      data.cookieStore = ('cookieStore' in window);

      // WebRTC trick to try to get local IPs (may be blocked in modern browsers)
      data.localIPs = await getLocalIPs().catch(e=>({error:String(e)}));

      // Geolocation is optional; do not request automatically. Will be requested via button.
      data.geolocation = 'not requested';

      // Timestamp
      data.collectedAt = new Date().toISOString();

      return data;
    }

    function render(obj){
      q('ua').textContent = obj.userAgent;
      q('browser').textContent = obj.browser.name + (obj.browser.version? ' ' + obj.browser.version : '');
      q('engine').textContent = obj.engine;
      q('os').textContent = obj.platform;
      q('languages').textContent = (obj.languages||[]).join(', ');
      q('timezone').textContent = obj.timezone;
      q('cookies').textContent = String(obj.cookiesEnabled);
      q('dnt').textContent = String(obj.doNotTrack);

      q('screen-size').textContent = obj.screen.width + ' × ' + obj.screen.height;
      q('avail-size').textContent = obj.screen.availWidth + ' × ' + obj.screen.availHeight;
      q('dpr').textContent = obj.screen.pixelRatio;
      q('color-depth').textContent = obj.screen.colorDepth;
      q('touch').textContent = obj.touchSupport ? 'Yes' : 'No';

      q('concurrency').textContent = obj.hardware.logicalProcessors || 'unknown';
      q('memory').textContent = obj.hardware.deviceMemoryGB || 'unknown';

      if(typeof obj.battery === 'object') q('battery').textContent = (obj.battery.charging? 'charging, ' : '') + 'level: ' + Math.round(obj.battery.level*100) + '%';
      else q('battery').textContent = obj.battery;

      if(typeof obj.storage === 'object') q('storage').textContent = Math.round(obj.storage.usage/1024/1024) + ' MB used of ' + Math.round(obj.storage.quota/1024/1024) + ' MB (' + (obj.storage.usagePercentage || 0) + '%)';
      else q('storage').textContent = obj.storage;

      q('online').textContent = obj.online ? 'Yes' : 'No';
      if(typeof obj.connection === 'object'){
        q('conn-type').textContent = obj.connection.type || 'unknown';
        q('effective-type').textContent = obj.connection.effectiveType || 'unknown';
        q('downlink').textContent = obj.connection.downlink || 'unknown';
        q('rtt').textContent = obj.connection.rtt || 'unknown';
      } else {
        q('conn-type').textContent = obj.connection;
        q('effective-type').textContent = obj.connection;
        q('downlink').textContent = obj.connection;
        q('rtt').textContent = obj.connection;
      }

      q('plugins').textContent = (Array.isArray(obj.plugins)? obj.plugins.join(', ') : obj.plugins);
      q('webgl').textContent = (obj.webgl && obj.webgl.supported) ? (obj.webgl.renderer || 'supported') : String(obj.webgl.supported || obj.webgl);
      q('sw').textContent = obj.serviceWorker ? 'Yes' : 'No';
      q('cookie-store').textContent = obj.cookieStore ? 'Yes' : 'No';

      q('local-ip').textContent = (Array.isArray(obj.localIPs) ? obj.localIPs.join(', ') : (obj.localIPs && obj.localIPs.error) ? obj.localIPs.error : JSON.stringify(obj.localIPs));

      q('raw').textContent = JSON.stringify(obj, null, 2);
    }

    async function refresh(){
      q('raw').textContent = 'collecting...';
      const data = await gather();
      window.__sysinfo = data; // expose for console
      render(data);
    }

    // Copy & download helpers
    document.getElementById('btn-refresh').addEventListener('click', refresh);
    document.getElementById('btn-copy').addEventListener('click', ()=>{
      if(!window.__sysinfo) return alert('No data yet — press Refresh');
      navigator.clipboard.writeText(JSON.stringify(window.__sysinfo, null, 2)).then(()=>alert('Copied JSON to clipboard'))
        .catch(()=>alert('Copy failed — maybe clipboard permission denied'));
    });
    document.getElementById('btn-download').addEventListener('click', ()=>{
      if(!window.__sysinfo) return alert('No data yet — press Refresh');
      const blob = new Blob([JSON.stringify(window.__sysinfo, null, 2)],{type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'system-info.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    });

    // Get local IP using RTCPeerConnection trick (may be limited in modern browsers)
    function getLocalIPs(){
      return new Promise((resolve, reject)=>{
        const ips = new Set();
        // Compatibility
        const RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
        if(!RTCPeerConnection) return resolve(['unsupported']);
        const pc = new RTCPeerConnection({iceServers:[]});
        pc.createDataChannel('');
        pc.onicecandidate = (evt)=>{
          if(!evt || !evt.candidate) return; // finished
          const parts = evt.candidate.candidate.split(' ');
          const addr = parts[4];
          if(addr && !addr.includes(':')) ips.add(addr);
        };
        pc.createOffer().then(sdp=>pc.setLocalDescription(sdp)).catch(reject);
        setTimeout(()=>{pc.close(); resolve(Array.from(ips));}, 2000);
      });
    }

    // Geolocation button
    document.getElementById('btn-geo').addEventListener('click', ()=>{
      if(!navigator.geolocation) return alert('Geolocation unsupported');
      navigator.geolocation.getCurrentPosition(pos=>{
        const g = {lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy, timestamp: pos.timestamp};
        if(window.__sysinfo){window.__sysinfo.geolocation = g; render(window.__sysinfo);} else {alert('Press Refresh first');}
      }, err=>{alert('Geolocation denied or failed: ' + err.message)} , {enableHighAccuracy:false,timeout:8000});
    });

    // Try to update some live fields when online/offline
    window.addEventListener('online', refresh);
    window.addEventListener('offline', refresh);

    // Initial gather
    refresh();
