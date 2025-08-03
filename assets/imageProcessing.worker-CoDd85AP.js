(function(){"use strict";function l(s){const t=`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
    <rect width="800" height="600" fill="#1f1f1f"/>
    <text x="400" y="300" fill="#777" font-family="sans-serif" font-size="20" text-anchor="middle">
      RAW preview${s?" - "+s:""}
    </text>
  </svg>`;return`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(t)))}`}function a(s){if(!s||s.byteLength<4)return null;const t=new Uint8Array(s);let r=-1;for(let e=0;e<t.length-1;e++)if(t[e]===255&&t[e+1]===216){r=e;break}if(r===-1)return null;let n=-1;for(let e=t.length-2;e>r;e--)if(t[e]===255&&t[e+1]===217){n=e+2;break}if(n===-1||n<=r)return null;try{const e=t.slice(r,n);return e.buffer.slice(e.byteOffset,e.byteOffset+e.byteLength)}catch{return null}}self.onmessage=async s=>{try{const{buffer:t,file:r,name:n}=s.data||{};let e=t;if(!e&&r&&typeof r.arrayBuffer=="function")try{e=await r.arrayBuffer()}catch{}let f=null;if(e&&(f=a(e)),f){self.postMessage({jpegBytes:f},[f]);return}const i=l(n||r&&r.name);self.postMessage({preview:i})}catch(t){self.postMessage({error:t?.message||"Worker failure"})}}})();
//# sourceMappingURL=imageProcessing.worker-CoDd85AP.js.map
