/**
 * Wired-by-default injection builders.
 *
 * A published static site ships with two capabilities out of the box, driven by
 * the org-scoped project's fields (GET /v1/projects/:slug):
 *
 *   1. Analytics beacon — a minimal, cookieless pageview reporter that speaks the
 *      SAME wire protocol as the canonical Hanzo analytics client (@hanzo/capture):
 *      a `{ batch: [event] }` POST to the same-origin `/v1/analytics` endpoint.
 *      Wired ON by default; emitted only when the project's `analytics` is true.
 *
 *   2. Base submissions — the project's Base data space exposed as a well-known
 *      `window.__HANZO_BASE__` config plus a tiny helper that auto-wires any
 *      `<form data-hanzo>` to POST `{ form, data }` to the canonical public Base
 *      records path `/v1/base/collections/submissions/records`. Gated on the
 *      project carrying a `space` ("<org>/<slug>").
 *
 * CSP: both blocks are INLINE scripts that talk ONLY to same-origin relative
 * paths — no external script host, no cross-origin connect. They are therefore
 * clean under the published-site CSP (`script-src 'self' 'unsafe-inline'`,
 * `connect-src 'self'`). The org is resolved from the deployed host server-side
 * (Base's host-as-project-ref), so the endpoint needs no org in its path.
 *
 * Every builder is pure (input → string) so the emitted markup is unit-testable.
 */

/** Same-origin canonical Hanzo analytics endpoint (@hanzo/capture ANALYTICS_PATH). */
export const ANALYTICS_ENDPOINT = '/v1/analytics';

/**
 * Same-origin canonical public Base records path for the `submissions` collection.
 * Anyone may CREATE (the collection's create rule is public); the deployed host
 * resolves the org. Proven route: cloud clients/base (apiPrefix "/v1/base") +
 * @hanzo/base collection path `/v1/collections/{name}/records`.
 */
export const BASE_SUBMISSIONS_ENDPOINT = '/v1/base/collections/submissions/records';

export const SUBMISSIONS_COLLECTION = 'submissions';

/** Version tag mirrored onto the analytics event (matches @hanzo/capture). */
const CAPTURE_LIBRARY = '@hanzo/capture';

export interface WiredInjectionOptions {
  /** Emit the analytics beacon (wired ON by default; false = opted out). */
  analytics: boolean;
  /** The project's Base data space "<org>/<slug>"; gates the Base config. */
  space?: string;
}

/**
 * The analytics pageview beacon. Cookieless: a stable anonymous id is kept in
 * localStorage and a session id in sessionStorage (no fingerprinting). Reports a
 * `$pageview` on load and on SPA navigation, tagged with the project space.
 */
export function buildAnalyticsBeacon(space?: string): string {
  const SPACE = JSON.stringify(space ?? '');
  const ENDPOINT = JSON.stringify(ANALYTICS_ENDPOINT);
  const LIB = JSON.stringify(CAPTURE_LIBRARY);
  return `<!-- Hanzo Analytics (wired by default) -->
<script>
(function(){
  try{
    var SPACE=${SPACE};
    function rid(){try{if(window.crypto&&crypto.randomUUID)return crypto.randomUUID();}catch(e){}return 'm-'+Date.now().toString(36)+Math.random().toString(36).slice(2,10);}
    function keep(store,key){try{var v=store.getItem(key);if(!v){v=rid();store.setItem(key,v);}return v;}catch(e){return rid();}}
    function send(){
      var id=keep(window.localStorage,'hz_anon'),sid=keep(window.sessionStorage,'hz_sid');
      var ev={messageId:rid(),type:'pageview',event:'$pageview',timestamp:new Date().toISOString(),distinctId:id,anonymousId:id,sessionId:sid,url:location.href,path:location.pathname,referrer:document.referrer||undefined,properties:{space:SPACE||undefined,title:document.title},library:${LIB},libraryVersion:'0.1.1'};
      var body=JSON.stringify({batch:[ev]});
      try{if(navigator.sendBeacon&&navigator.sendBeacon(${ENDPOINT},new Blob([body],{type:'application/json'})))return;}catch(e){}
      try{fetch(${ENDPOINT},{method:'POST',headers:{'Content-Type':'application/json'},body:body,keepalive:true}).catch(function(){});}catch(e){}
    }
    if(document.readyState==='complete'||document.readyState==='interactive')send();else window.addEventListener('DOMContentLoaded',send,{once:true});
    try{var ps=history.pushState;history.pushState=function(){ps.apply(history,arguments);send();};}catch(e){}
    window.addEventListener('popstate',send);
  }catch(e){}
})();
</script>`;
}

/**
 * The Base config + form auto-wire. Exposes `window.__HANZO_BASE__` and submits
 * any `<form data-hanzo>` as `{ form, data }` to the public submissions endpoint.
 * The `form` tag is the form's `data-hanzo` value, else its `name`, else the space.
 */
export function buildBaseConfig(space: string): string {
  const CONFIG = JSON.stringify({
    endpoint: BASE_SUBMISSIONS_ENDPOINT,
    space,
    collection: SUBMISSIONS_COLLECTION,
  });
  return `<!-- Hanzo Base (wired by default) -->
<script>
window.__HANZO_BASE__=${CONFIG};
(function(){
  try{
    var C=window.__HANZO_BASE__;
    document.addEventListener('submit',function(ev){
      var f=ev.target;
      if(!(f instanceof HTMLFormElement)||!f.hasAttribute('data-hanzo'))return;
      ev.preventDefault();
      var fd=new FormData(f),data={};fd.forEach(function(v,k){data[k]=v;});
      var form=f.getAttribute('data-hanzo')||f.getAttribute('name')||C.space||'default';
      fetch(C.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({form:String(form).slice(0,128),data:data})})
        .then(function(r){var t=r.ok?'hanzo-base-success':'hanzo-base-error';var e=new CustomEvent(t,{detail:{status:r.status}});f.dispatchEvent(e);document.dispatchEvent(e);if(r.ok&&f.reset)f.reset();})
        .catch(function(err){var e=new CustomEvent('hanzo-base-error',{detail:{error:String(err)}});f.dispatchEvent(e);document.dispatchEvent(e);});
    },true);
  }catch(e){}
})();
</script>`;
}

/**
 * The combined `<head>` markup for the wired-by-default capabilities. Returns ''
 * when nothing is enabled (analytics opted out AND no space), so the caller can
 * skip injection entirely.
 */
export function buildWiredHead(opts: WiredInjectionOptions): string {
  const parts: string[] = [];
  if (opts.analytics) parts.push(buildAnalyticsBeacon(opts.space));
  if (opts.space && opts.space.trim()) parts.push(buildBaseConfig(opts.space.trim()));
  return parts.join('\n');
}
