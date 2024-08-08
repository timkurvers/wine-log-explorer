(function(){"use strict";async function*H(t,e){var u,r;let c=0;const f=new TextDecoder("utf8"),m=t.getReader();let s=await m.read();s.value&&(c+=s.value.length,(u=e==null?void 0:e.onReadProgress)==null||u.call(e,c));let l=s.value?f.decode(s.value,{stream:!0}):"";const v=/\r?\n/gm;let a=0;for(;;){const E=v.exec(l);if(!E){if(s.done)break;const x=l.slice(a);s=await m.read(),s.value&&(c+=s.value.length,(r=e==null?void 0:e.onReadProgress)==null||r.call(e,c));const A=s.value?f.decode(s.value,{stream:!0}):"";l=x+A,a=v.lastIndex=0;continue}yield l.substring(a,E.index),a=v.lastIndex}a<l.length&&(yield l.slice(a))}var h=(t=>(t.CALL="Call",t.RETURN="Ret",t.MESSAGE="Message",t))(h||{});const T=/(?<pid>[a-f0-9]{4}):(?<tid>[a-f0-9]{4}):(?<type>[a-zA-Z_:]+) +(?<message>.+)/,S=/(?:(?:(?<module>[\w]+)\.(?<func>[\w]+))|(?<unknown>.+))\((?<args>.+)?\)(?: retval=(?<retval>[a-f0-9]+))?(?: ret=(?<callsite>[a-f0-9]+))?/,I=/L"(?<string>.+)"/,B=/[^\\]+$/;async function C(t,e){if(typeof t=="string")return C(new Blob([t]),e);if(t instanceof Blob)return C(t.stream(),e);const c=t,f=[],m={},s={},l={},v=H(c,{onReadProgress:e==null?void 0:e.onReadProgress});let a=0;const u=[];let r="",E=0,x;for(;;){if(a===2&&(u.length?r=u.shift():a=0),a!==2){const L=await v.next();if(L.done)break;r=L.value}const A=T.exec(r.slice(1));if(A){a=1,u.push(r.slice(0,A.index+1),r.slice(A.index+1));continue}const N=r.match(T);if(N){if(a===1){u.push(r);continue}}else{a===1&&(u[0]+=r,a=2);continue}const{pid:n,tid:g,type:M,message:y}=N.groups;let o=m[n];o||(o={id:n,name:null,threads:[]},m[n]=o,s[n]={},l[n]={});let R=s[n][g];R||(R={id:g,name:null},s[n][g]=R,m[n].threads.push(R));const i=l[n][g];let d;const b={id:E,process:o,thread:R};switch(M){case h.CALL:case h.RETURN:const L=y.match(S);if(!L)throw new Error(`could not parse Call/Ret line: '${r}'`);const{groups:{unknown:D,module:U,func:$,args:_,retval:G,callsite:W}}=L;if(D)continue;const k={module:U,func:$,callsite:W};M===h.CALL?(d={type:h.CALL,...b,...k,args:_==null?void 0:_.split(",")},l[n][g]=d):(d={type:h.RETURN,...b,...k,retval:G},i&&d.callsite===i.callsite&&(i.return=d,x===i&&(i.inlinable=!0)),l[n][g]=i==null?void 0:i.parent);break;default:const[j,p="",P=""]=M.split(":");if(d={...b,channel:p,class:j,logger:P,message:y},p==="threadname"){const w=y.match(I);w&&(R.name=w.groups.string)}else if(p==="module"&&P==="get_load_order"){const w=y.match(I);if(w&&!o.path&&(o.path=w.groups.string.replaceAll("\\\\","\\"),o.name=o.path.match(B)[0]),!w)throw new Error(`could not extract wide string from message: ${y}`)}}i&&(d.parent=i),f.push(d),x=d,++E}return{processes:Object.values(m),entries:f}}self.addEventListener("message",async t=>{const e=t.data;try{const c=await C(e,{onReadProgress(f){self.postMessage({type:"progress",bytesRead:f})}});self.postMessage({type:"complete",result:c})}catch(c){self.postMessage({type:"error",error:c})}})})();