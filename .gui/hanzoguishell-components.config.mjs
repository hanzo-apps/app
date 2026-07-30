import { createRequire as __cr } from "module"; const require = __cr(import.meta.url);
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/TenantHeader.js
import { jsx as _jsx6, jsxs as _jsxs5 } from "react/jsx-runtime";
import { useState as useState5, useCallback as useCallback2 } from "react";

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/TenantMark.js
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback } from "react";
function BrandContextMenu({ x, y, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = /* @__PURE__ */ __name((e) => {
      if (ref.current && !ref.current.contains(e.target))
        onClose();
    }, "handler");
    const escape = /* @__PURE__ */ __name((e) => {
      if (e.key === "Escape")
        onClose();
    }, "escape");
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", escape);
    };
  }, [onClose]);
  const items = [
    { label: "Brand Guidelines", href: "https://hanzo.ai/brand" },
    { label: "Press Kit", href: "https://hanzo.ai/press" },
    { label: "Download Logo", href: "https://hanzo.ai/brand#download" },
    { label: "Copy SVG", action: "copy-svg" },
    { label: "hanzo.ai \u2192", href: "https://hanzo.ai" }
  ];
  const LOGO_SVG = `<svg viewBox="0 0 67 67" xmlns="http://www.w3.org/2000/svg"><path d="M22.21 67V44.6369H0V67H22.21Z" fill="#ffffff"/><path d="M0 44.6369L22.21 46.8285V44.6369H0Z" fill="#DDDDDD"/><path d="M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z" fill="#ffffff"/><path d="M22.21 0H0V22.3184H22.21V0Z" fill="#ffffff"/><path d="M66.7198 0H44.5098V22.3184H66.7198V0Z" fill="#ffffff"/><path d="M66.6753 22.3185L44.5098 20.0822V22.3185H66.6753Z" fill="#DDDDDD"/><path d="M66.7198 67V44.6369H44.5098V67H66.7198Z" fill="#ffffff"/></svg>`;
  return _jsxs("div", { ref, role: "menu", className: "fixed z-[9999] min-w-[180px] rounded-xl border border-white/[0.08] bg-[#111113] py-1.5 shadow-2xl shadow-black/60", style: { top: y, left: x }, children: [_jsx("div", { className: "border-b border-white/[0.06] px-3 pb-2 pt-1", children: _jsx("p", { className: "text-[10px] font-semibold uppercase tracking-widest text-white/30", children: "Hanzo Brand" }) }), items.map((item) => item.action === "copy-svg" ? _jsx("button", { type: "button", role: "menuitem", onClick: /* @__PURE__ */ __name(() => {
    navigator.clipboard.writeText(LOGO_SVG).catch(() => {
    });
    onClose();
  }, "onClick"), className: "flex w-full items-center px-3 py-2 text-[13px] text-white/60 hover:bg-white/[0.05] hover:text-white/90 transition-colors text-left", children: "Copy SVG" }, "copy") : _jsx("a", { href: item.href, role: "menuitem", target: item.href?.startsWith("https") ? "_blank" : void 0, rel: "noopener noreferrer", onClick: onClose, className: "flex items-center px-3 py-2 text-[13px] text-white/60 hover:bg-white/[0.05] hover:text-white/90 transition-colors", children: item.label }, item.label))] });
}
__name(BrandContextMenu, "BrandContextMenu");
function TenantMark({ size = 22, className = "", brandMenu = true, animate = true }) {
  const [menu, setMenu] = useState(null);
  const [hovered, setHovered] = useState(false);
  const handleContextMenu = useCallback((e) => {
    if (!brandMenu)
      return;
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY });
  }, [brandMenu]);
  const style = animate ? {
    transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease",
    transform: hovered ? "scale(1.12) perspective(80px) rotateY(-6deg)" : "scale(1) perspective(80px) rotateY(0deg)",
    transformOrigin: "center center"
  } : {};
  return _jsxs(_Fragment, { children: [_jsxs("svg", { width: size, height: size, viewBox: "0 0 67 67", xmlns: "http://www.w3.org/2000/svg", "aria-label": "Hanzo", className, style, onMouseEnter: /* @__PURE__ */ __name(() => setHovered(true), "onMouseEnter"), onMouseLeave: /* @__PURE__ */ __name(() => setHovered(false), "onMouseLeave"), onContextMenu: handleContextMenu, children: [_jsx("path", { d: "M22.21 67V44.6369H0V67H22.21Z", fill: "#ffffff" }), _jsx("path", { d: "M0 44.6369L22.21 46.8285V44.6369H0Z", fill: "#DDDDDD" }), _jsx("path", { d: "M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z", fill: "#ffffff" }), _jsx("path", { d: "M22.21 0H0V22.3184H22.21V0Z", fill: "#ffffff" }), _jsx("path", { d: "M66.7198 0H44.5098V22.3184H66.7198V0Z", fill: "#ffffff" }), _jsx("path", { d: "M66.6753 22.3185L44.5098 20.0822V22.3185H66.6753Z", fill: "#DDDDDD" }), _jsx("path", { d: "M66.7198 67V44.6369H44.5098V67H66.7198Z", fill: "#ffffff" })] }), menu && _jsx(BrandContextMenu, { x: menu.x, y: menu.y, onClose: /* @__PURE__ */ __name(() => setMenu(null), "onClose") })] });
}
__name(TenantMark, "TenantMark");

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/AppSwitcher.js
import { jsx as _jsx2, jsxs as _jsxs2 } from "react/jsx-runtime";
import { useState as useState2, useRef as useRef2, useEffect as useEffect2 } from "react";

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/types.js
var DEFAULT_TENANT_APPS = [
  // ── Core ──
  {
    id: "account",
    label: "Account",
    href: "https://hanzo.id/account",
    description: "Profile, orgs & referrals"
  },
  {
    id: "billing",
    label: "Billing",
    href: "https://billing.hanzo.ai",
    description: "Subscriptions & usage"
  },
  {
    id: "console",
    label: "Console",
    href: "https://console.hanzo.ai",
    description: "API keys & projects"
  },
  // ── AI ──
  {
    id: "chat",
    label: "Chat",
    href: "https://hanzo.chat",
    description: "AI chat & models"
  },
  {
    id: "flow",
    label: "Flow",
    href: "https://flow.hanzo.ai",
    description: "Visual workflow builder"
  },
  {
    id: "bot",
    label: "Bot",
    href: "https://hanzo.bot",
    description: "AI bot platform"
  },
  // ── Observability ──
  {
    id: "o11y",
    label: "O11y",
    href: "https://o11y.hanzo.ai",
    description: "Traces, logs & metrics"
  },
  {
    id: "sentry",
    label: "Sentry",
    href: "https://sentry.hanzo.ai",
    description: "Error & crash tracking"
  },
  {
    id: "insights",
    label: "Insights",
    href: "https://insights.hanzo.ai",
    description: "Product analytics & flags"
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "https://analytics.hanzo.ai",
    description: "Web analytics"
  },
  // ── Infrastructure ──
  {
    id: "platform",
    label: "Platform",
    href: "https://platform.hanzo.ai",
    description: "Deploy & scale services"
  },
  {
    id: "cloud",
    label: "Cloud",
    href: "https://cloud.hanzo.ai",
    description: "Cloud infrastructure"
  },
  {
    id: "storage",
    label: "Storage",
    href: "https://s3.hanzo.ai",
    description: "S3 object storage"
  },
  {
    id: "kms",
    label: "KMS",
    href: "https://kms.hanzo.ai",
    description: "Secrets & key management"
  },
  {
    id: "dns",
    label: "DNS",
    href: "https://dns.hanzo.ai",
    description: "DNS management"
  },
  {
    id: "registry",
    label: "Registry",
    href: "https://registry.hanzo.ai",
    description: "Container registry"
  },
  // ── Apps ──
  {
    id: "commerce",
    label: "Commerce",
    href: "https://commerce.hanzo.ai",
    description: "Payments & storefront"
  },
  {
    id: "base",
    label: "Base",
    href: "https://base.hanzo.ai",
    description: "Backend-as-a-Service"
  },
  {
    id: "search",
    label: "Search",
    href: "https://search.hanzo.ai",
    description: "Full-text search"
  },
  {
    id: "auto",
    label: "Auto",
    href: "https://auto.hanzo.ai",
    description: "Workflow automation"
  },
  // ── Business ──
  {
    id: "team",
    label: "Team",
    href: "https://hanzo.team",
    description: "Team collaboration"
  },
  {
    id: "sign",
    label: "Sign",
    href: "https://sign.hanzo.ai",
    description: "Document signing"
  },
  {
    id: "dataroom",
    label: "Dataroom",
    href: "https://dataroom.hanzo.ai",
    description: "Secure deal rooms"
  },
  {
    id: "captable",
    label: "Cap Table",
    href: "https://captable.hanzo.ai",
    description: "Equity management"
  },
  // ── Content & Support ──
  {
    id: "docs",
    label: "Docs",
    href: "https://docs.hanzo.ai",
    description: "Documentation"
  },
  {
    id: "status",
    label: "Status",
    href: "https://status.hanzo.ai",
    description: "System status"
  }
];
var ORG_DOMAINS = {
  hanzo: {
    id: "hanzo",
    iam: "https://hanzo.id",
    billing: "https://billing.hanzo.ai",
    console: "https://console.hanzo.ai",
    cloud: "https://cloud.hanzo.ai",
    chat: "https://hanzo.chat",
    flow: "https://flow.hanzo.ai",
    bot: "https://hanzo.bot",
    o11y: "https://o11y.hanzo.ai",
    sentry: "https://sentry.hanzo.ai",
    insights: "https://insights.hanzo.ai",
    analytics: "https://analytics.hanzo.ai",
    platform: "https://platform.hanzo.ai",
    storage: "https://s3.hanzo.ai",
    s3: "https://s3.hanzo.ai",
    kms: "https://kms.hanzo.ai",
    dns: "https://dns.hanzo.ai",
    registry: "https://registry.hanzo.ai",
    commerce: "https://commerce.hanzo.ai",
    base: "https://base.hanzo.ai",
    search: "https://search.hanzo.ai",
    auto: "https://auto.hanzo.ai",
    team: "https://hanzo.team",
    sign: "https://sign.hanzo.ai",
    dataroom: "https://dataroom.hanzo.ai",
    captable: "https://captable.hanzo.ai",
    docs: "https://docs.hanzo.ai",
    status: "https://status.hanzo.ai"
  },
  lux: {
    id: "lux",
    iam: "https://lux.id",
    billing: "https://billing.lux.network",
    console: "https://console.lux.network",
    cloud: "https://cloud.lux.network",
    chat: "https://lux.chat",
    flow: "https://flow.lux.network",
    bot: "https://bot.lux.network",
    o11y: "https://o11y.lux.network",
    sentry: "https://sentry.lux.network",
    insights: "https://insights.lux.network",
    analytics: "https://analytics.lux.network",
    platform: "https://platform.lux.network",
    storage: "https://s3.lux.network",
    s3: "https://s3.lux.network",
    kms: "https://kms.lux.network",
    dns: "https://dns.lux.network",
    registry: "https://registry.lux.network",
    commerce: "https://commerce.lux.network",
    base: "https://base.lux.network",
    search: "https://search.lux.network",
    auto: "https://auto.lux.network",
    team: "https://team.lux.network",
    sign: "https://sign.lux.network",
    dataroom: "https://dataroom.lux.network",
    captable: "https://captable.lux.network",
    docs: "https://docs.lux.network",
    status: "https://status.lux.network"
  },
  zoo: {
    id: "zoo",
    iam: "https://zoo.id",
    billing: "https://billing.zoo.ngo",
    console: "https://console.zoo.ngo",
    cloud: "https://cloud.zoo.network",
    chat: "https://chat.zoo.ngo",
    flow: "https://flow.zoo.ngo",
    bot: "https://bot.zoo.ngo",
    o11y: "https://o11y.zoo.network",
    sentry: "https://sentry.zoo.network",
    insights: "https://insights.zoo.ngo",
    analytics: "https://analytics.zoo.ngo",
    platform: "https://platform.zoo.ngo",
    storage: "https://s3.zoo.ngo",
    s3: "https://s3.zoo.ngo",
    kms: "https://kms.zoo.network",
    dns: "https://dns.zoo.ngo",
    registry: "https://registry.zoo.ngo",
    commerce: "https://commerce.zoo.ngo",
    base: "https://base.zoo.ngo",
    search: "https://search.zoo.ngo",
    auto: "https://auto.zoo.ngo",
    team: "https://team.zoo.ngo",
    sign: "https://sign.zoo.ngo",
    dataroom: "https://dataroom.zoo.ngo",
    captable: "https://captable.zoo.ngo",
    docs: "https://docs.zoo.ngo",
    status: "https://status.zoo.network"
  },
  pars: {
    id: "pars",
    iam: "https://pars.id",
    billing: "https://billing.pars.network",
    console: "https://console.pars.network",
    cloud: "https://cloud.pars.network",
    chat: "https://chat.pars.network",
    flow: "https://flow.pars.network",
    bot: "https://bot.pars.network",
    o11y: "https://o11y.pars.network",
    sentry: "https://sentry.pars.network",
    insights: "https://insights.pars.network",
    analytics: "https://analytics.pars.network",
    platform: "https://platform.pars.network",
    storage: "https://s3.pars.network",
    s3: "https://s3.pars.network",
    kms: "https://kms.pars.network",
    dns: "https://dns.pars.network",
    registry: "https://registry.pars.network",
    commerce: "https://commerce.pars.network",
    base: "https://base.pars.network",
    search: "https://search.pars.network",
    auto: "https://auto.pars.network",
    team: "https://team.pars.network",
    sign: "https://sign.pars.network",
    dataroom: "https://dataroom.pars.network",
    captable: "https://captable.pars.network",
    docs: "https://docs.pars.network",
    status: "https://status.pars.network"
  }
};
function getAppsForOrg(orgSlug) {
  const d = ORG_DOMAINS[orgSlug] || ORG_DOMAINS.hanzo;
  return [
    // Core
    { id: "account", label: "Account", href: `${d.iam}/account`, description: "Profile, orgs & referrals" },
    { id: "billing", label: "Billing", href: d.billing, description: "Subscriptions & usage" },
    { id: "console", label: "Console", href: d.console, description: "API keys & projects" },
    // AI
    { id: "chat", label: "Chat", href: d.chat, description: "AI chat & models" },
    { id: "flow", label: "Flow", href: d.flow, description: "Visual workflow builder" },
    { id: "bot", label: "Bot", href: d.bot, description: "AI bot platform" },
    // Observability
    { id: "o11y", label: "O11y", href: d.o11y, description: "Traces, logs & metrics" },
    { id: "sentry", label: "Sentry", href: d.sentry, description: "Error & crash tracking" },
    { id: "insights", label: "Insights", href: d.insights, description: "Product analytics & flags" },
    { id: "analytics", label: "Analytics", href: d.analytics, description: "Web analytics" },
    // Infrastructure
    { id: "platform", label: "Platform", href: d.platform, description: "Deploy & scale services" },
    { id: "cloud", label: "Cloud", href: d.cloud, description: "Cloud infrastructure" },
    { id: "storage", label: "Storage", href: d.storage, description: "S3 object storage" },
    { id: "kms", label: "KMS", href: d.kms, description: "Secrets & key management" },
    { id: "dns", label: "DNS", href: d.dns, description: "DNS management" },
    { id: "registry", label: "Registry", href: d.registry, description: "Container registry" },
    // Apps
    { id: "commerce", label: "Commerce", href: d.commerce, description: "Payments & storefront" },
    { id: "base", label: "Base", href: d.base, description: "Backend-as-a-Service" },
    { id: "search", label: "Search", href: d.search, description: "Full-text search" },
    { id: "auto", label: "Auto", href: d.auto, description: "Workflow automation" },
    // Business
    { id: "team", label: "Team", href: d.team, description: "Team collaboration" },
    { id: "sign", label: "Sign", href: d.sign, description: "Document signing" },
    { id: "dataroom", label: "Dataroom", href: d.dataroom, description: "Secure deal rooms" },
    { id: "captable", label: "Cap Table", href: d.captable, description: "Equity management" },
    // Content
    { id: "docs", label: "Docs", href: d.docs, description: "Documentation" },
    { id: "status", label: "Status", href: d.status, description: "System status" }
  ];
}
__name(getAppsForOrg, "getAppsForOrg");

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/AppSwitcher.js
var APP_GROUPS = [
  { label: "Core", ids: ["account", "billing", "console"] },
  { label: "AI", ids: ["chat", "flow", "bot"] },
  { label: "Observability", ids: ["o11y", "sentry", "insights", "analytics"] },
  { label: "Infrastructure", ids: ["platform", "cloud", "storage", "kms", "dns", "registry"] },
  { label: "Apps", ids: ["commerce", "base", "search", "auto"] },
  { label: "Business", ids: ["team", "sign", "dataroom", "captable"] },
  { label: "Resources", ids: ["docs", "status"] }
];
function AppSwitcher({ apps = DEFAULT_TENANT_APPS, currentAppId }) {
  const [open, setOpen] = useState2(false);
  const ref = useRef2(null);
  useEffect2(() => {
    const handler = /* @__PURE__ */ __name((e) => {
      if (ref.current && !ref.current.contains(e.target))
        setOpen(false);
    }, "handler");
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const filtered = apps.filter((a) => a.id !== currentAppId);
  const appMap = new Map(filtered.map((a) => [a.id, a]));
  return _jsxs2("div", { ref, className: "relative", children: [_jsx2("button", { type: "button", onClick: /* @__PURE__ */ __name(() => setOpen((v) => !v), "onClick"), className: "flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:bg-white/[0.06] hover:text-white/70 transition-colors", "aria-label": "Switch app", title: "Switch app", children: _jsxs2("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", children: [_jsx2("rect", { x: "1", y: "1", width: "4", height: "4", rx: "1" }), _jsx2("rect", { x: "6", y: "1", width: "4", height: "4", rx: "1" }), _jsx2("rect", { x: "11", y: "1", width: "4", height: "4", rx: "1" }), _jsx2("rect", { x: "1", y: "6", width: "4", height: "4", rx: "1" }), _jsx2("rect", { x: "6", y: "6", width: "4", height: "4", rx: "1" }), _jsx2("rect", { x: "11", y: "6", width: "4", height: "4", rx: "1" }), _jsx2("rect", { x: "1", y: "11", width: "4", height: "4", rx: "1" }), _jsx2("rect", { x: "6", y: "11", width: "4", height: "4", rx: "1" }), _jsx2("rect", { x: "11", y: "11", width: "4", height: "4", rx: "1" })] }) }), open && _jsxs2("div", { className: "absolute left-0 top-10 z-50 w-72 max-h-[80vh] overflow-y-auto rounded-xl border border-white/[0.08] bg-[#0e0e13] p-2 shadow-2xl", children: [APP_GROUPS.map((group) => {
    const groupApps = group.ids.map((id) => appMap.get(id)).filter(Boolean);
    if (groupApps.length === 0)
      return null;
    return _jsxs2("div", { children: [_jsx2("p", { className: "px-2 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wider text-white/30", children: group.label }), _jsx2("div", { className: "grid grid-cols-2 gap-0.5", children: groupApps.map((app) => _jsxs2("a", { href: app.href, className: "flex flex-col gap-0.5 rounded-lg px-3 py-2 hover:bg-white/[0.06] transition-colors", onClick: /* @__PURE__ */ __name(() => setOpen(false), "onClick"), children: [_jsx2("span", { className: "text-[13px] font-medium text-white/80", children: app.label }), app.description && _jsx2("span", { className: "text-[11px] leading-tight text-white/30", children: app.description })] }, app.id)) })] }, group.label);
  }), (() => {
    const groupedIds = new Set(APP_GROUPS.flatMap((g) => g.ids));
    const ungrouped = filtered.filter((a) => !groupedIds.has(a.id));
    if (ungrouped.length === 0)
      return null;
    return _jsxs2("div", { children: [_jsx2("p", { className: "px-2 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wider text-white/30", children: "Other" }), _jsx2("div", { className: "grid grid-cols-2 gap-0.5", children: ungrouped.map((app) => _jsxs2("a", { href: app.href, className: "flex flex-col gap-0.5 rounded-lg px-3 py-2 hover:bg-white/[0.06] transition-colors", onClick: /* @__PURE__ */ __name(() => setOpen(false), "onClick"), children: [_jsx2("span", { className: "text-[13px] font-medium text-white/80", children: app.label }), app.description && _jsx2("span", { className: "text-[11px] leading-tight text-white/30", children: app.description })] }, app.id)) })] });
  })()] })] });
}
__name(AppSwitcher, "AppSwitcher");

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/UserOrgDropdown.js
import { jsx as _jsx5, jsxs as _jsxs4 } from "react/jsx-runtime";
import { useState as useState4, useRef as useRef3, useEffect as useEffect3 } from "react";

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/UserAvatar.js
import { jsx as _jsx4 } from "react/jsx-runtime";
import { useState as useState3, useMemo } from "react";

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/BeamAvatar.js
import { jsx as _jsx3, jsxs as _jsxs3 } from "react/jsx-runtime";
var COLORS = ["#0A0310", "#49007E", "#FF005B", "#FF7D10", "#FFB238"];
function hashStr(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i) | 0;
  }
  return Math.abs(hash);
}
__name(hashStr, "hashStr");
function getUnit(hash, range, index) {
  const val = hash % (range * (index + 1));
  return val % range;
}
__name(getUnit, "getUnit");
function getBoolean(hash, index) {
  return getUnit(hash, 2, index) === 0;
}
__name(getBoolean, "getBoolean");
function getRandomColor(hash, index, colors) {
  return colors[getUnit(hash, colors.length, index)];
}
__name(getRandomColor, "getRandomColor");
function getContrast(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 > 128 ? "#000" : "#fff";
}
__name(getContrast, "getContrast");
function BeamAvatar({ name, size = 40, colors = COLORS, className, square = false }) {
  const hash = hashStr(name);
  const wrapperColor = getRandomColor(hash, 0, colors);
  const faceColor = getContrast(wrapperColor);
  const isOpen = getBoolean(hash, 2);
  const mouthSpread = getUnit(hash, 3, 7);
  const eyeSpread = getUnit(hash, 5, 8);
  const faceRotate = getUnit(hash, 10, 9);
  const faceTranslateX = faceRotate > 6 ? faceRotate - 10 : faceRotate;
  const faceTranslateY = getUnit(hash, 5, 10) > 3 ? getUnit(hash, 5, 10) - 5 : getUnit(hash, 5, 10);
  return _jsxs3("svg", { viewBox: "0 0 36 36", fill: "none", xmlns: "http://www.w3.org/2000/svg", width: size, height: size, className, style: square ? void 0 : { borderRadius: "50%" }, children: [_jsx3("mask", { id: `beam-${hash}`, maskUnits: "userSpaceOnUse", x: 0, y: 0, width: 36, height: 36, children: _jsx3("rect", { width: 36, height: 36, rx: square ? void 0 : 72, fill: "#fff" }) }), _jsxs3("g", { mask: `url(#beam-${hash})`, children: [_jsx3("rect", { width: 36, height: 36, fill: wrapperColor }), _jsx3("rect", { x: 0, y: 0, width: 36, height: 36, transform: `translate(${faceTranslateX} ${faceTranslateY}) rotate(${faceRotate} 18 18)`, fill: getRandomColor(hash, 1, colors), rx: 6 }), _jsxs3("g", { transform: `translate(${faceTranslateX} ${faceTranslateY}) rotate(${faceRotate} 18 18)`, children: [isOpen ? _jsx3("path", { d: `M15 ${19 + mouthSpread}c2 1 4 1 6 0`, stroke: faceColor, fill: "none", strokeLinecap: "round" }) : _jsx3("path", { d: `M13 ${19 + mouthSpread}a1 .75 0 0 0 10 0`, fill: faceColor }), _jsx3("rect", { x: 14 - eyeSpread, y: 14, width: 1.5, height: 2, rx: 1, fill: faceColor }), _jsx3("rect", { x: 20 + eyeSpread, y: 14, width: 1.5, height: 2, rx: 1, fill: faceColor })] })] })] });
}
__name(BeamAvatar, "BeamAvatar");

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/UserAvatar.js
async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256, "sha256");
function useGravatarUrl(email, size) {
  const [url, setUrl] = useState3(null);
  useMemo(() => {
    if (!email) {
      setUrl(null);
      return;
    }
    const trimmed = email.trim().toLowerCase();
    sha256(trimmed).then((hash) => {
      setUrl(`https://www.gravatar.com/avatar/${hash}?s=${size || 80}&d=404`);
    });
  }, [email, size]);
  return url;
}
__name(useGravatarUrl, "useGravatarUrl");
function UserAvatar({ src, email, name, size = 40, colors, className }) {
  const [photoFailed, setPhotoFailed] = useState3(false);
  const [gravatarFailed, setGravatarFailed] = useState3(false);
  const gravatarUrl = useGravatarUrl(email, size * 2);
  const imgClass = `rounded-full object-cover ${className || ""}`;
  const style = { width: size, height: size };
  if (src && !photoFailed) {
    return _jsx4("img", { src, alt: name || email || "avatar", className: imgClass, style, onError: /* @__PURE__ */ __name(() => setPhotoFailed(true), "onError") });
  }
  if (gravatarUrl && !gravatarFailed) {
    return _jsx4("img", { src: gravatarUrl, alt: name || email || "avatar", className: imgClass, style, onError: /* @__PURE__ */ __name(() => setGravatarFailed(true), "onError") });
  }
  const seed = name || email || "user";
  return _jsx4(BeamAvatar, { name: seed, size, colors, className });
}
__name(UserAvatar, "UserAvatar");

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/UserOrgDropdown.js
function UserOrgDropdown({ user, organizations = [], currentOrgId, onOrgSwitch, onSignOut }) {
  const [open, setOpen] = useState4(false);
  const ref = useRef3(null);
  useEffect3(() => {
    const handler = /* @__PURE__ */ __name((e) => {
      if (ref.current && !ref.current.contains(e.target))
        setOpen(false);
    }, "handler");
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  if (!user)
    return null;
  const currentOrg = organizations.find((o) => o.id === currentOrgId);
  const orgSlug = currentOrg?.slug || "hanzo";
  const domains = ORG_DOMAINS[orgSlug] || ORG_DOMAINS.hanzo;
  return _jsxs4("div", { ref, className: "relative", children: [_jsxs4("button", { type: "button", onClick: /* @__PURE__ */ __name(() => setOpen((v) => !v), "onClick"), className: "flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/[0.06] transition-colors", children: [_jsx5(UserAvatar, { src: user.avatar, email: user.email, name: user.name, size: 28 }), _jsxs4("div", { className: "hidden flex-col items-start sm:flex", children: [user.name && _jsx5("span", { className: "text-[12px] font-medium text-white/70 leading-none", children: user.name }), _jsx5("span", { className: "text-[11px] text-white/30 leading-none mt-0.5", children: user.email })] }), _jsx5("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "text-white/30 hidden sm:block", children: _jsx5("path", { d: "M6 9l6 6 6-6" }) })] }), open && _jsxs4("div", { className: "absolute right-0 top-10 z-50 w-64 rounded-xl border border-white/[0.08] bg-[#0e0e13] shadow-2xl", children: [_jsxs4("div", { className: "border-b border-white/[0.06] px-4 py-3", children: [_jsx5("p", { className: "text-[13px] font-medium text-white/80", children: user.name || "User" }), _jsx5("p", { className: "text-[11px] text-white/40", children: user.email }), currentOrg && _jsx5("p", { className: "mt-0.5 text-[10px] font-medium text-white/25 uppercase tracking-wider", children: currentOrg.name })] }), organizations.length > 0 && _jsxs4("div", { className: "border-b border-white/[0.06] p-2", children: [_jsx5("p", { className: "px-2 pb-1 pt-0.5 text-[10px] font-medium uppercase tracking-wider text-white/30", children: "Organizations" }), organizations.map((org) => _jsxs4("button", { type: "button", onClick: /* @__PURE__ */ __name(() => {
    onOrgSwitch?.(org.id);
    setOpen(false);
  }, "onClick"), className: "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-white/[0.06] transition-colors", children: [_jsxs4("div", { className: "flex flex-col", children: [_jsx5("span", { className: "text-[13px] text-white/70", children: org.name }), org.role && _jsx5("span", { className: "text-[10px] text-white/25 capitalize", children: org.role })] }), org.id === currentOrgId && _jsx5("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", className: "text-white/50", children: _jsx5("polyline", { points: "20 6 9 17 4 12" }) })] }, org.id))] }), _jsxs4("div", { className: "p-2", children: [_jsx5("a", { href: `${domains.iam}/account`, className: "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-colors", onClick: /* @__PURE__ */ __name(() => setOpen(false), "onClick"), children: "Account settings" }), _jsx5("a", { href: domains.billing, className: "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-colors", onClick: /* @__PURE__ */ __name(() => setOpen(false), "onClick"), children: "Billing" }), _jsx5("button", { type: "button", onClick: /* @__PURE__ */ __name(() => {
    setOpen(false);
    onSignOut?.();
  }, "onClick"), className: "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-white/40 hover:bg-white/[0.06] hover:text-red-400/70 transition-colors", children: "Sign out" })] })] })] });
}
__name(UserOrgDropdown, "UserOrgDropdown");

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/TenantHeader.js
function HardRefreshIcon({ className }) {
  return _jsxs5("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className, children: [_jsx6("path", { d: "M21 2v6h-6" }), _jsx6("path", { d: "M3 12a9 9 0 0 1 15-6.7L21 8" }), _jsx6("path", { d: "M3 22v-6h6" }), _jsx6("path", { d: "M21 12a9 9 0 0 1-15 6.7L3 16" })] });
}
__name(HardRefreshIcon, "HardRefreshIcon");
function SettingsIcon({ className }) {
  return _jsxs5("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className, children: [_jsx6("path", { d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" }), _jsx6("circle", { cx: "12", cy: "12", r: "3" })] });
}
__name(SettingsIcon, "SettingsIcon");
async function hardRefresh() {
  try {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0].trim();
      if (name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${location.hostname}`;
        const parts = location.hostname.split(".");
        if (parts.length > 2) {
          const parent = "." + parts.slice(-2).join(".");
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${parent}`;
        }
      }
    });
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    }
    if ("indexedDB" in window && indexedDB.databases) {
      try {
        const dbs = await indexedDB.databases();
        dbs.forEach((db) => {
          if (db.name)
            indexedDB.deleteDatabase(db.name);
        });
      } catch {
      }
    }
  } catch {
  }
  location.reload();
}
__name(hardRefresh, "hardRefresh");
function TenantHeader({ currentApp, currentAppId, user, organizations, currentOrgId, onOrgSwitch, onSignOut, apps, headerRight, settingsHref, onSettingsClick, hideHardRefresh, hideSettings }) {
  const [refreshing, setRefreshing] = useState5(false);
  const currentOrg = organizations?.find((o) => o.id === currentOrgId);
  const orgSlug = currentOrg?.slug || "hanzo";
  const resolvedApps = apps || getAppsForOrg(orgSlug);
  const domains = ORG_DOMAINS[orgSlug] || ORG_DOMAINS.hanzo;
  const handleHardRefresh = useCallback2(() => {
    setRefreshing(true);
    hardRefresh();
  }, []);
  const handleSettings = useCallback2(() => {
    if (onSettingsClick) {
      onSettingsClick();
    } else {
      window.location.href = settingsHref || `${domains.iam}/account`;
    }
  }, [onSettingsClick, settingsHref, domains.iam]);
  return _jsxs5("header", { className: "sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-white/[0.07] bg-[#09090b]/90 px-4 backdrop-blur-xl", role: "banner", children: [_jsxs5("div", { className: "flex min-w-0 items-center gap-2.5", children: [_jsx6("a", { href: `${domains.iam}/account`, className: "flex-shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20", "aria-label": "Account", children: _jsx6(TenantMark, { size: 22, brandMenu: true, animate: true }) }), _jsx6("span", { className: "select-none text-white/[0.15]", children: "/" }), _jsx6("span", { className: "truncate text-[13px] font-medium text-white/50", children: currentApp }), _jsx6(AppSwitcher, { apps: resolvedApps, currentAppId })] }), _jsxs5("div", { className: "flex flex-shrink-0 items-center gap-1", children: [headerRight, !hideHardRefresh && _jsx6("button", { type: "button", onClick: handleHardRefresh, className: "flex items-center justify-center rounded-lg p-2 text-white/30 hover:bg-white/[0.06] hover:text-white/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20", "aria-label": "Hard refresh \u2014 clear all storage, cookies, cache and reload", title: "Hard refresh", children: _jsx6(HardRefreshIcon, { className: refreshing ? "animate-spin" : "" }) }), !hideSettings && _jsx6("button", { type: "button", onClick: handleSettings, className: "flex items-center justify-center rounded-lg p-2 text-white/30 hover:bg-white/[0.06] hover:text-white/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20", "aria-label": "Settings", title: "Settings", children: _jsx6(SettingsIcon, {}) }), _jsx6(UserOrgDropdown, { user, organizations, currentOrgId, onOrgSwitch, onSignOut })] })] });
}
__name(TenantHeader, "TenantHeader");

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/useTenantAuth.js
import { useState as useState6, useEffect as useEffect4, useCallback as useCallback3 } from "react";
var TOKEN_KEY = "hanzo-auth-token";
var USER_KEY = "hanzo-user";
var EXPIRES_KEY = "hanzo-auth-expires";
var IAM_ENDPOINT = "https://iam.hanzo.ai";
var ORG_MAP = {
  hanzo: { name: "Hanzo AI", slug: "hanzo" },
  lux: { name: "Lux Network", slug: "lux" },
  zoo: { name: "Zoo Labs", slug: "zoo" },
  pars: { name: "Pars", slug: "pars" }
};
function useTenantAuth() {
  const [user, setUser] = useState6(void 0);
  const [organizations, setOrganizations] = useState6([]);
  const [currentOrgId, setCurrentOrgId] = useState6(void 0);
  const [token, setToken] = useState6(null);
  const [loading, setLoading] = useState6(true);
  const load = useCallback3(async () => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const expires = localStorage.getItem(EXPIRES_KEY);
      if (!storedToken || expires && Date.now() > Number(expires)) {
        setLoading(false);
        return;
      }
      setToken(storedToken);
      const cached = localStorage.getItem(USER_KEY);
      if (cached) {
        try {
          const u = JSON.parse(cached);
          if (u?.email) {
            setUser({ id: u.id, name: u.displayName || u.name, email: u.email, avatar: u.avatar });
          }
        } catch {
        }
      }
      const res = await fetch(`${IAM_ENDPOINT}/v1/iam/oauth/userinfo`, {
        headers: { Authorization: `Bearer ${storedToken}` }
      });
      if (res.ok) {
        const info = await res.json();
        const u = {
          id: info.sub || info.id,
          name: info.name || info.displayName,
          email: info.email,
          avatar: info.picture || info.avatar
        };
        setUser(u);
        localStorage.setItem(USER_KEY, JSON.stringify(info));
        const groups = info.groups || [];
        const orgs = groups.map((g) => {
          const slug = g.toLowerCase().replace(/^\//, "");
          const meta = ORG_MAP[slug];
          return meta ? { id: slug, name: meta.name, slug: meta.slug } : null;
        }).filter(Boolean);
        if (orgs.length === 0 && u.email) {
          orgs.push({ id: "personal", name: "Personal", slug: "personal" });
        }
        setOrganizations(orgs);
        setCurrentOrgId(orgs[0]?.id);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect4(() => {
    load();
  }, [load]);
  const signOut = useCallback3(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    window.location.href = "https://hanzo.id";
  }, []);
  const switchOrg = useCallback3((orgId) => {
    setCurrentOrgId(orgId);
  }, []);
  return { user, organizations, currentOrgId, token, loading, signOut, switchOrg };
}
__name(useTenantAuth, "useTenantAuth");

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/TenantCommandPalette.js
import { jsx as _jsx7, jsxs as _jsxs6, Fragment as _Fragment2 } from "react/jsx-runtime";
import { useState as useState7, useEffect as useEffect5, useRef as useRef4, useCallback as useCallback4 } from "react";
function buildCrossAppCommands(apps, currentAppId) {
  return apps.filter((app) => app.id !== currentAppId).map((app) => ({
    id: `app-${app.id}`,
    title: app.label,
    description: app.description,
    href: app.href,
    category: "Hanzo Apps",
    external: true,
    keywords: [app.id, app.label.toLowerCase()]
  }));
}
__name(buildCrossAppCommands, "buildCrossAppCommands");
function TenantCommandPalette({ commands: appCommands = [], apps, currentAppId, open: controlledOpen, onOpenChange, onNavigate }) {
  const [internalOpen, setInternalOpen] = useState7(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = useCallback4((v) => {
    if (onOpenChange)
      onOpenChange(v);
    else
      setInternalOpen(v);
  }, [onOpenChange]);
  const [search, setSearch] = useState7("");
  const [selectedIndex, setSelectedIndex] = useState7(0);
  const inputRef = useRef4(null);
  const listRef = useRef4(null);
  const crossApp = buildCrossAppCommands(apps ?? DEFAULT_TENANT_APPS, currentAppId);
  const allCommands = [...appCommands, ...crossApp];
  const q = search.toLowerCase();
  const filtered = q ? allCommands.filter((cmd) => cmd.title.toLowerCase().includes(q) || cmd.description?.toLowerCase().includes(q) || cmd.keywords?.some((k) => k.includes(q))) : allCommands;
  const grouped = {};
  for (const cmd of filtered) {
    ;
    (grouped[cmd.category] ??= []).push(cmd);
  }
  const flat = Object.values(grouped).flat();
  useEffect5(() => setSelectedIndex(0), [search]);
  useEffect5(() => {
    if (open) {
      setSearch("");
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);
  useEffect5(() => {
    const handler = /* @__PURE__ */ __name((e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    }, "handler");
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, setOpen]);
  const go = useCallback4((cmd) => {
    if (cmd.action) {
      cmd.action();
    } else if (cmd.href) {
      if (onNavigate) {
        onNavigate(cmd.href, cmd.external);
      } else if (cmd.external) {
        window.open(cmd.href, "_blank");
      } else {
        window.location.href = cmd.href;
      }
    }
    setOpen(false);
  }, [onNavigate, setOpen]);
  const handleKeyDown = useCallback4((e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % (flat.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + (flat.length || 1)) % (flat.length || 1));
    } else if (e.key === "Enter" && flat[selectedIndex]) {
      e.preventDefault();
      go(flat[selectedIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }, [flat, selectedIndex, go, setOpen]);
  useEffect5(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);
  if (!open)
    return null;
  return _jsxs6(_Fragment2, { children: [_jsx7("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]", onClick: /* @__PURE__ */ __name(() => setOpen(false), "onClick") }), _jsx7("div", { className: "fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl z-[101]", children: _jsxs6("div", { className: "bg-[#111113] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden", children: [_jsxs6("div", { className: "flex items-center gap-3 px-4 py-3 border-b border-white/[0.07]", children: [_jsx7("svg", { className: "w-4 h-4 text-white/30", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx7("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }), _jsx7("input", { ref: inputRef, type: "text", value: search, onChange: /* @__PURE__ */ __name((e) => setSearch(e.target.value), "onChange"), onKeyDown: handleKeyDown, placeholder: "Search commands...", className: "flex-1 bg-transparent text-white text-[13px] placeholder-white/30 outline-none" }), _jsx7("kbd", { className: "px-1.5 py-0.5 text-[10px] font-mono bg-white/[0.06] rounded text-white/30", children: "ESC" })] }), _jsx7("div", { ref: listRef, className: "max-h-[400px] overflow-y-auto py-1", children: flat.length === 0 ? _jsxs6("div", { className: "px-4 py-8 text-center text-white/30 text-[13px]", children: ["No results for \u201C", search, "\u201D"] }) : Object.entries(grouped).map(([category, items]) => _jsxs6("div", { children: [_jsx7("div", { className: "px-4 py-2 text-[10px] font-semibold text-white/25 uppercase tracking-widest", children: category }), items.map((cmd) => {
    const idx = flat.indexOf(cmd);
    const selected = idx === selectedIndex;
    return _jsxs6("button", { "data-idx": idx, onClick: /* @__PURE__ */ __name(() => go(cmd), "onClick"), onMouseEnter: /* @__PURE__ */ __name(() => setSelectedIndex(idx), "onMouseEnter"), className: `w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${selected ? "bg-white/[0.06] text-white" : "text-white/50 hover:bg-white/[0.03]"}`, children: [cmd.icon && _jsx7("span", { className: `w-5 h-5 flex items-center justify-center ${selected ? "text-white/70" : "text-white/25"}`, children: cmd.icon }), _jsxs6("div", { className: "flex-1 min-w-0", children: [_jsx7("span", { className: "text-[13px] font-medium truncate block", children: cmd.title }), cmd.description && _jsx7("span", { className: "text-[11px] text-white/25 truncate block", children: cmd.description })] }), selected && _jsx7("span", { className: "text-white/25 text-[11px]", children: "\u21B5" })] }, cmd.id);
  })] }, category)) }), _jsxs6("div", { className: "px-4 py-2 border-t border-white/[0.07] flex items-center justify-between", children: [_jsxs6("div", { className: "flex items-center gap-4 text-[10px] text-white/20", children: [_jsxs6("span", { className: "flex items-center gap-1", children: [_jsx7("kbd", { className: "px-1 py-0.5 bg-white/[0.06] rounded text-[9px]", children: "\u2191" }), _jsx7("kbd", { className: "px-1 py-0.5 bg-white/[0.06] rounded text-[9px]", children: "\u2193" }), "navigate"] }), _jsxs6("span", { className: "flex items-center gap-1", children: [_jsx7("kbd", { className: "px-1 py-0.5 bg-white/[0.06] rounded text-[9px]", children: "\u21B5" }), "select"] })] }), _jsx7("span", { className: "text-[10px] text-white/20", children: "\u2318K" })] })] }) })] });
}
__name(TenantCommandPalette, "TenantCommandPalette");

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/HanzoAppBar.js
import { jsx as _jsx10, jsxs as _jsxs9, Fragment as _Fragment4 } from "react/jsx-runtime";
import { useCallback as useCallback7, useEffect as useEffect9, useRef as useRef6, useState as useState10 } from "react";

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/HanzoAppLauncher.js
import { jsx as _jsx9, jsxs as _jsxs8 } from "react/jsx-runtime";
import { useCallback as useCallback6, useEffect as useEffect8, useId, useMemo as useMemo3, useRef as useRef5, useState as useState9 } from "react";

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/hanzo-apps.js
import { jsx as _jsx8, Fragment as _Fragment3, jsxs as _jsxs7 } from "react/jsx-runtime";

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/hanzo-registry.js
var U = {
  ai: "https://hanzo.ai",
  pricing: "https://hanzo.ai/pricing",
  solutions: "https://hanzo.ai/solutions",
  enterprise: "https://hanzo.ai/enterprise",
  allProducts: "https://hanzo.ai/products",
  // Products
  chat: "https://hanzo.chat",
  app: "https://hanzo.app",
  team: "https://hanzo.team",
  world: "https://world.hanzo.ai",
  studio: "https://studio.hanzo.ai",
  bot: "https://hanzo.bot",
  cloud: "https://cloud.hanzo.ai",
  dev: "https://hanzo.ai/dev",
  // Platform
  models: "https://hanzo.ai/models",
  enso: "https://hanzo.ai/enso",
  agents: "https://hanzo.ai/agents",
  mcp: "https://hanzo.ai/mcp",
  console: "https://console.hanzo.ai",
  keys: "https://console.hanzo.ai/keys",
  gateway: "https://console.hanzo.ai/gateway",
  platform: "https://platform.hanzo.ai",
  api: "https://hanzo.ai/api",
  // Install
  desktop: "https://hanzo.ai/desktop",
  extension: "https://hanzo.ai/extension",
  cli: "https://hanzo.ai/cli",
  sdks: "https://hanzo.ai/sdks",
  downloads: "https://hanzo.ai/download",
  // Developers / resources
  docs: "https://docs.hanzo.ai",
  apiRef: "https://docs.hanzo.ai/docs/api",
  cliRef: "https://docs.hanzo.ai/docs/cli",
  quickstarts: "https://docs.hanzo.ai/docs/getting-started",
  learn: "https://hanzo.ai/learn",
  // Community = the hub for everything built on Hanzo: templates + apps shipped on
  // hanzo.app + the hanzo-apps GitHub org. Lives on hanzo.app (the builder), which
  // owns the feed + its moderation. (Replaces the old hanzo.ai/showcase, which was
  // just the hero chat re-skinned.)
  community: "https://hanzo.app/community",
  research: "https://hanzo.ai/research",
  status: "https://status.hanzo.ai",
  support: "https://hanzo.ai/support",
  github: "https://github.com/hanzoai",
  // Company
  about: "https://hanzo.ai/about",
  customers: "https://hanzo.ai/customers",
  blog: "https://hanzo.ai/blog",
  careers: "https://hanzo.ai/careers",
  security: "https://hanzo.ai/security",
  contact: "https://hanzo.ai/contact",
  // Account
  account: "https://hanzo.id/account",
  billing: "https://billing.hanzo.ai",
  admin: "https://admin.hanzo.ai",
  // Legal
  privacy: "https://hanzo.ai/privacy",
  terms: "https://hanzo.ai/terms",
  cookies: "https://hanzo.ai/cookies"
};
var PRODUCT_BOUNDARIES = {
  chat: "Use AI",
  app: "Build applications",
  team: "Organize collaborative work",
  studio: "Create and evaluate intelligence",
  bot: "Distribute agents into channels",
  cloud: "Operate infrastructure",
  dev: "Build software from the editor and terminal",
  ai: "Explain and connect the ecosystem"
};
var HANZO_PRODUCTS = [
  { id: "chat", label: "Hanzo Chat", href: U.chat, verb: "Use AI", tagline: "Ask anything", boundary: PRODUCT_BOUNDARIES.chat, flagship: true },
  { id: "app", label: "Hanzo App", href: U.app, verb: "Build", tagline: "Build and ship apps", boundary: PRODUCT_BOUNDARIES.app, flagship: true },
  { id: "team", label: "Hanzo Team", href: U.team, verb: "Work", tagline: "People and AI together", boundary: PRODUCT_BOUNDARIES.team, flagship: true },
  { id: "studio", label: "Hanzo Studio", href: U.studio, verb: "Design AI", tagline: "Models, prompts and agents", boundary: PRODUCT_BOUNDARIES.studio, flagship: true },
  { id: "bot", label: "Hanzo Bot", href: U.bot, verb: "Deploy agents", tagline: "Publish AI anywhere", boundary: PRODUCT_BOUNDARIES.bot, flagship: true },
  { id: "cloud", label: "Hanzo Cloud", href: U.cloud, verb: "Operate", tagline: "Run the platform", boundary: PRODUCT_BOUNDARIES.cloud, flagship: true },
  { id: "dev", label: "Hanzo Dev", href: U.dev, verb: "Build software", tagline: "From the editor and terminal", boundary: PRODUCT_BOUNDARIES.dev }
];
var HANZO_FLAGSHIP = HANZO_PRODUCTS.filter((p) => p.flagship);
var MEET_HANZO_GROUPS = [
  {
    id: "products",
    title: "Flagship products",
    items: HANZO_FLAGSHIP
  },
  {
    id: "platform",
    title: "Platform",
    items: [
      { id: "models", label: "Models", href: U.models },
      { id: "enso", label: "Enso", href: U.enso },
      { id: "agents", label: "Managed Agents", href: U.agents },
      { id: "mcp", label: "MCP Tools", href: U.mcp },
      { id: "dev", label: "Hanzo Dev", href: U.dev },
      { id: "console", label: "Developer Console", href: U.console },
      { id: "api", label: "API Platform", href: U.api },
      { id: "cloud", label: "All cloud products", href: U.cloud }
    ]
  },
  {
    id: "install",
    title: "Install",
    items: [
      { id: "desktop", label: "Desktop app", href: U.desktop },
      { id: "extension", label: "Browser extension", href: U.extension },
      { id: "cli", label: "Hanzo CLI", href: U.cli },
      { id: "sdks", label: "SDKs", href: U.sdks },
      { id: "downloads", label: "All downloads", href: U.downloads }
    ]
  },
  {
    id: "resources",
    title: "Resources",
    items: [
      { id: "docs", label: "Documentation", href: U.docs },
      { id: "quickstarts", label: "Quickstarts", href: U.quickstarts },
      { id: "learn", label: "Learn", href: U.learn },
      { id: "community", label: "Community", href: U.community },
      { id: "status", label: "Status", href: U.status },
      { id: "support", label: "Support", href: U.support }
    ]
  }
];
var productCategorySlug = /* @__PURE__ */ __name((label) => label.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), "productCategorySlug");
var LUX_CLOUD = "https://lux.cloud";
var LUX_SERVICES = "https://lux.cloud/services";
var cat = /* @__PURE__ */ __name((label) => `${U.ai}/products/${productCategorySlug(label)}`, "cat");
var HANZO_PRODUCT_CATEGORIES = [
  {
    id: "ai",
    label: "AI",
    href: cat("AI"),
    tagline: "Models, agents, and inference \u2014 open weights, one API.",
    items: [
      { id: "models", label: "Models", href: `${U.ai}/models`, hint: "Open-weight model garden" },
      { id: "agents", label: "Agents", href: `${U.ai}/agents`, hint: "Build & run agents" },
      { id: "inference", label: "Inference", href: `${U.ai}/engine`, hint: "Serverless model serving" },
      { id: "fine-tuning", label: "Fine-tuning", href: `${U.ai}/cloud/fine-tuning`, hint: "Tune models on your data" },
      { id: "embeddings", label: "Embeddings", href: `${U.ai}/cloud/embeddings`, hint: "Vectorize text & images" },
      { id: "evals", label: "Evals", href: `${U.ai}/cloud/evals`, hint: "Score model quality" }
    ]
  },
  {
    id: "compute",
    label: "Compute",
    href: cat("Compute"),
    tagline: "GPUs, containers, and functions that scale to zero.",
    items: [
      { id: "gpus", label: "GPUs", href: `${U.ai}/cloud/gpus`, hint: "On-demand GPU compute" },
      { id: "machines", label: "Machines", href: `${U.ai}/machines`, hint: "Virtual machines" },
      { id: "containers", label: "Containers", href: `${U.ai}/cloud/containers`, hint: "Containers, scale to zero" },
      { id: "functions", label: "Functions", href: `${U.ai}/functions`, hint: "Event-driven functions" },
      { id: "edge", label: "Edge", href: `${U.ai}/edge`, hint: "Compute at the edge" },
      { id: "jobs", label: "Jobs", href: `${U.ai}/cloud/jobs`, hint: "Batch & scheduled jobs" }
    ]
  },
  {
    id: "data",
    label: "Data",
    href: cat("Data"),
    tagline: "Every persistence primitive, from vectors to objects.",
    items: [
      { id: "vector", label: "Vector", href: `${U.ai}/vector`, hint: "Vector search" },
      { id: "sql", label: "SQL", href: `${U.ai}/sql`, hint: "Managed SQL databases" },
      { id: "kv", label: "KV", href: `${U.ai}/kv`, hint: "In-memory key-value store" },
      { id: "storage", label: "Object Storage", href: `${U.ai}/storage`, hint: "S3-compatible object store" },
      { id: "datastore", label: "Datastore", href: `${U.ai}/datastore`, hint: "Wide-column datastore" },
      { id: "docdb", label: "DocDB", href: `${U.ai}/docdb`, hint: "Document database" }
    ]
  },
  {
    id: "network",
    label: "Network",
    href: cat("Network"),
    tagline: "Connect, route, and protect every service.",
    items: [
      { id: "gateway", label: "Gateway", href: `${U.ai}/gateway`, hint: "API gateway" },
      { id: "vpc", label: "VPC", href: `${U.ai}/network`, hint: "Private networks" },
      { id: "dns", label: "DNS", href: `${U.ai}/dns`, hint: "Managed DNS" },
      { id: "cdn", label: "CDN", href: `${U.ai}/cloud/cdn`, hint: "Global content delivery" },
      { id: "load-balancer", label: "Load Balancer", href: `${U.ai}/ingress`, hint: "Traffic load balancing" },
      { id: "service-mesh", label: "Service Mesh", href: `${U.ai}/cloud/service-mesh`, hint: "Service-to-service mesh" }
    ]
  },
  {
    id: "security",
    label: "Security",
    href: cat("Security"),
    tagline: "Identity, keys, and audit for the whole cloud.",
    items: [
      { id: "iam", label: "IAM", href: `${U.ai}/iam`, hint: "Identity & access" },
      { id: "authz", label: "Authz", href: `${U.ai}/authz`, hint: "Fine-grained authorization" },
      { id: "kms", label: "KMS", href: `${U.ai}/kms`, hint: "Key management" },
      { id: "hsm", label: "HSM", href: `${U.ai}/hsm`, hint: "Hardware key security" },
      { id: "secrets", label: "Secrets", href: `${U.ai}/cloud/secrets`, hint: "Secret storage & sync" },
      { id: "audit", label: "Audit", href: `${U.ai}/cloud/audit`, hint: "Audit logging" }
    ]
  },
  {
    id: "dev",
    label: "Dev",
    href: cat("Dev"),
    tagline: "Build against the cloud from anywhere.",
    items: [
      { id: "cli", label: "CLI", href: `${U.ai}/cli`, hint: "Command-line control" },
      { id: "sdks", label: "SDKs", href: `${U.ai}/cloud/sdks`, hint: "Client libraries" },
      { id: "api", label: "API", href: `${U.ai}/cloud/api`, hint: "Programmatic cloud API" },
      { id: "playground", label: "Playground", href: `${U.ai}/playground`, hint: "Prototype in the browser" },
      { id: "ide", label: "IDE", href: `${U.ai}/code`, hint: "In-browser IDE" },
      { id: "desktop", label: "Desktop", href: `${U.ai}/desktop`, hint: "Managed dev workstations" }
    ]
  },
  {
    id: "platform",
    label: "Platform",
    href: cat("Platform"),
    tagline: "Source to production as declared state.",
    items: [
      { id: "projects", label: "Projects", href: `${U.ai}/platform`, hint: "Organize resources" },
      { id: "environments", label: "Environments", href: `${U.ai}/cloud/environments`, hint: "Deploy targets" },
      { id: "builds", label: "Builds", href: `${U.ai}/cloud/builds`, hint: "Build from source" },
      { id: "registry", label: "Registry", href: `${U.ai}/registry`, hint: "Container & artifact registry" },
      { id: "releases", label: "Releases", href: `${U.ai}/cloud/releases`, hint: "Promote & roll out" },
      { id: "pipelines", label: "Pipelines", href: `${U.ai}/cloud/pipelines`, hint: "CI/CD pipelines" }
    ]
  },
  {
    id: "observe",
    label: "Observe",
    href: cat("Observe"),
    tagline: "Logs, metrics, traces, and cost in one pane.",
    items: [
      { id: "logs", label: "Logs", href: `${U.ai}/cloud/logs`, hint: "Centralized logging" },
      { id: "metrics", label: "Metrics", href: `${U.ai}/metrics`, hint: "Metrics & monitoring" },
      { id: "traces", label: "Traces", href: `${U.ai}/telemetry`, hint: "Distributed tracing" },
      { id: "dashboards", label: "Dashboards", href: `${U.ai}/dashboards`, hint: "Live dashboards" },
      { id: "alerts", label: "Alerts", href: `${U.ai}/sentry`, hint: "Alerting & incidents" },
      { id: "cost", label: "Cost", href: `${U.ai}/cloud/cost`, hint: "Cost & billing insights" }
    ]
  },
  {
    // Web3 = Lux Network settlement layer. Every leaf hands off to lux.cloud
    // under the Lux brand — never the Hanzo mark on a Lux surface.
    id: "web3",
    label: "Web3",
    href: cat("Web3"),
    tagline: "The settlement layer under every resource \u2014 powered by Lux Network.",
    items: [
      { id: "settlement", label: "Settlement", href: LUX_CLOUD, hint: "On-chain settlement", external: true },
      { id: "chains", label: "Chains", href: LUX_SERVICES, hint: "Launch L1 / L2 rollups", external: true },
      { id: "wallets", label: "Wallets", href: LUX_SERVICES, hint: "MPC custody & keys", external: true },
      { id: "tokens", label: "Tokens", href: LUX_SERVICES, hint: "Tokenization & assets", external: true },
      { id: "indexer", label: "Indexer", href: LUX_SERVICES, hint: "Explorer & chain data", external: true },
      { id: "attestations", label: "Attestations", href: LUX_SERVICES, hint: "Verifiable provenance", external: true }
    ]
  },
  {
    id: "apps",
    label: "Apps",
    href: cat("Apps"),
    tagline: "Production apps built on the primitives.",
    items: [
      { id: "chat", label: "Chat", href: `${U.ai}/chat`, hint: "Conversational AI app" },
      { id: "bot", label: "Bot", href: `${U.ai}/bot`, hint: "Multi-agent platform" },
      { id: "search", label: "Search", href: `${U.ai}/search`, hint: "AI-powered search" },
      { id: "crawl", label: "Crawl", href: `${U.ai}/crawl`, hint: "Web crawler" },
      { id: "studio", label: "Studio", href: `${U.ai}/studio`, hint: "Creative studio" },
      { id: "console", label: "Console", href: `${U.ai}/console`, hint: "Cloud console" }
    ]
  }
];
var HANZO_FOOTER_COLUMNS = [
  {
    id: "products",
    title: "Products",
    items: [
      ...HANZO_FLAGSHIP.map((p) => ({ id: p.id, label: p.label, href: p.href })),
      { id: "dev", label: "Hanzo Dev", href: U.dev },
      { id: "allProducts", label: "All products", href: U.allProducts }
    ]
  },
  {
    id: "platform",
    title: "AI Platform",
    items: [
      { id: "models", label: "Models", href: U.models },
      { id: "enso", label: "Enso", href: U.enso },
      { id: "agents", label: "Managed Agents", href: U.agents },
      { id: "mcp", label: "MCP Tools", href: U.mcp },
      { id: "api", label: "API Platform", href: U.api },
      { id: "console", label: "Developer Console", href: U.console },
      { id: "cloud", label: "All cloud products", href: U.cloud }
    ]
  },
  {
    id: "install",
    title: "Install",
    items: [
      { id: "desktop", label: "Desktop app", href: U.desktop },
      { id: "extension", label: "Browser extension", href: U.extension },
      { id: "cli", label: "Hanzo CLI", href: U.cli },
      { id: "sdks", label: "SDKs", href: U.sdks },
      { id: "downloads", label: "All downloads", href: U.downloads }
    ]
  },
  {
    id: "developers",
    title: "Developers",
    items: [
      { id: "docs", label: "Documentation", href: U.docs },
      { id: "apiRef", label: "API Reference", href: U.apiRef },
      { id: "cliRef", label: "CLI Reference", href: U.cliRef },
      { id: "github", label: "GitHub", href: U.github },
      { id: "status", label: "System Status", href: U.status }
    ]
  },
  {
    id: "resources",
    title: "Resources",
    items: [
      { id: "quickstarts", label: "Quickstarts", href: U.quickstarts },
      { id: "learn", label: "Learn", href: U.learn },
      { id: "community", label: "Community", href: U.community },
      { id: "research", label: "Research", href: U.research },
      { id: "support", label: "Support", href: U.support }
    ]
  },
  {
    id: "company",
    title: "Company",
    items: [
      { id: "about", label: "About Hanzo", href: U.about },
      { id: "customers", label: "Customers", href: U.customers },
      { id: "blog", label: "Blog", href: U.blog },
      { id: "careers", label: "Careers", href: U.careers },
      { id: "enterprise", label: "Enterprise", href: U.enterprise },
      { id: "contact", label: "Contact", href: U.contact }
    ]
  }
];
var HANZO_FOOTER_BOTTOM = {
  copyright: "\xA9 2026 Hanzo AI, Inc.",
  links: [
    { id: "security", label: "Security", href: U.security },
    { id: "privacy", label: "Privacy", href: U.privacy },
    { id: "terms", label: "Terms", href: U.terms },
    { id: "cookies", label: "Cookies", href: U.cookies }
  ]
};
var HANZO_SURFACES = [
  {
    id: "ai",
    host: "hanzo.ai",
    productId: "ai",
    brandName: "Hanzo",
    localNav: [
      { id: "models", label: "Models", href: U.models },
      { id: "agents", label: "Agents", href: U.agents },
      { id: "solutions", label: "Solutions", href: U.solutions },
      { id: "developers", label: "Developers", href: U.docs },
      { id: "pricing", label: "Pricing", href: U.pricing },
      { id: "enterprise", label: "Enterprise", href: U.enterprise }
    ],
    secondaryCTA: { id: "docs", label: "Documentation", href: U.docs },
    primaryCTA: { id: "chat", label: "Open Chat", href: U.chat },
    preFooter: {
      heading: "Meet the complete Hanzo AI platform",
      actions: [
        { id: "products", label: "Explore products", href: U.allProducts },
        { id: "chat", label: "Open Chat", href: U.chat }
      ]
    }
  },
  {
    id: "chat",
    host: "hanzo.chat",
    productId: "chat",
    brandName: "Hanzo Chat",
    localNav: [
      { id: "product", label: "Product", href: `${U.chat}/product` },
      { id: "models", label: "Models", href: U.models },
      { id: "agents", label: "Agents", href: U.agents },
      { id: "download", label: "Download", href: U.downloads },
      { id: "pricing", label: "Pricing", href: U.pricing }
    ],
    secondaryCTA: { id: "install", label: "Install Hanzo", href: U.downloads },
    primaryCTA: { id: "newchat", label: "New chat", href: U.chat },
    preFooter: {
      heading: "Take Hanzo everywhere you work",
      actions: [
        { id: "download", label: "Download Hanzo", href: U.downloads },
        { id: "extension", label: "Add browser extension", href: U.extension }
      ]
    }
  },
  {
    id: "app",
    host: "hanzo.app",
    productId: "app",
    brandName: "Hanzo App",
    localNav: [
      { id: "product", label: "Product", href: `${U.app}/product` },
      { id: "templates", label: "Templates", href: `${U.app}/templates` },
      { id: "pricing", label: "Pricing", href: U.pricing },
      { id: "enterprise", label: "Enterprise", href: U.enterprise }
    ],
    secondaryCTA: { id: "download", label: "Download", href: U.downloads },
    primaryCTA: { id: "newproject", label: "+ New project", href: U.app },
    preFooter: {
      heading: "Turn an idea into a live application",
      actions: [
        { id: "newproject", label: "New project", href: U.app },
        { id: "templates", label: "Browse templates", href: `${U.app}/templates` }
      ]
    }
  },
  {
    id: "cloud",
    host: "cloud.hanzo.ai",
    productId: "cloud",
    brandName: "Hanzo Cloud",
    localNav: [
      { id: "products", label: "Products", href: `${U.cloud}/products` },
      { id: "solutions", label: "Solutions", href: U.solutions },
      { id: "developers", label: "Developers", href: U.docs },
      { id: "pricing", label: "Pricing", href: U.pricing },
      { id: "docs", label: "Docs", href: U.docs }
    ],
    secondaryCTA: { id: "apikey", label: "Get API key", href: U.keys },
    primaryCTA: { id: "console", label: "Open Console", href: U.console },
    preFooter: {
      heading: "Build and operate on the AI cloud",
      actions: [
        { id: "apikey", label: "Get API key", href: U.keys },
        { id: "console", label: "Open Console", href: U.console }
      ]
    }
  },
  {
    id: "team",
    host: "hanzo.team",
    productId: "team",
    brandName: "Hanzo Team",
    localNav: [
      { id: "product", label: "Product", href: `${U.team}/product` },
      { id: "solutions", label: "Solutions", href: U.solutions },
      { id: "integrations", label: "Integrations", href: `${U.team}/integrations` },
      { id: "pricing", label: "Pricing", href: U.pricing },
      { id: "enterprise", label: "Enterprise", href: U.enterprise }
    ],
    secondaryCTA: { id: "download", label: "Download", href: U.downloads },
    primaryCTA: { id: "workspace", label: "Open workspace", href: U.team },
    preFooter: {
      heading: "Bring your people and AI coworkers together",
      actions: [
        { id: "createorg", label: "Create organization", href: U.team },
        { id: "workspace", label: "Open workspace", href: U.team }
      ]
    }
  },
  {
    id: "bot",
    host: "hanzo.bot",
    productId: "bot",
    brandName: "Hanzo Bot",
    localNav: [
      // These point at hanzo.bot's real pages. /product, /channels and
      // /templates never existed there, so the header shipped three 404s;
      // the site calls the same things platform, integrations and skills.
      { id: "platform", label: "Platform", href: `${U.bot}/platform` },
      { id: "skills", label: "Skills", href: `${U.bot}/skills` },
      { id: "integrations", label: "Integrations", href: `${U.bot}/integrations` },
      { id: "showcase", label: "Showcase", href: `${U.bot}/showcase` },
      { id: "pricing", label: "Pricing", href: U.pricing }
    ],
    secondaryCTA: { id: "docs", label: "Documentation", href: U.docs },
    primaryCTA: { id: "createbot", label: "Create bot", href: U.bot },
    preFooter: {
      heading: "Put an intelligent agent in every channel",
      actions: [
        { id: "createbot", label: "Create bot", href: U.bot },
        { id: "integrations", label: "View integrations", href: `${U.bot}/integrations` }
      ]
    }
  },
  {
    id: "studio",
    host: "studio.hanzo.ai",
    productId: "studio",
    brandName: "Hanzo Studio",
    localNav: [
      { id: "models", label: "Models", href: U.models },
      { id: "prompts", label: "Prompts", href: `${U.studio}/prompts` },
      { id: "agents", label: "Agents", href: U.agents },
      { id: "evaluations", label: "Evaluations", href: `${U.studio}/evaluations` },
      { id: "docs", label: "Docs", href: U.docs }
    ],
    secondaryCTA: { id: "apiref", label: "API Reference", href: U.apiRef },
    primaryCTA: { id: "studio", label: "Open Studio", href: U.studio },
    preFooter: {
      heading: "Take models and agents from idea to production",
      actions: [
        { id: "studio", label: "Open Studio", href: U.studio },
        { id: "quickstart", label: "Read quickstart", href: U.quickstarts }
      ]
    }
  },
  {
    id: "world",
    host: "world.hanzo.ai",
    productId: "world",
    brandName: "Hanzo World",
    localNav: [
      { id: "globe", label: "Globe", href: U.world },
      { id: "news", label: "News", href: `${U.world}/news` },
      { id: "reports", label: "Reports", href: `${U.world}/reports` },
      { id: "widgets", label: "Widgets", href: `${U.world}/widgets` },
      { id: "docs", label: "Docs", href: U.docs }
    ],
    secondaryCTA: { id: "studio", label: "Open Studio", href: U.studio },
    primaryCTA: { id: "world", label: "Open World", href: U.world },
    preFooter: {
      heading: "Build your world \u2014 realtime intelligence, reports, and widgets",
      actions: [
        { id: "world", label: "Open World", href: U.world },
        { id: "quickstart", label: "Read quickstart", href: U.quickstarts }
      ]
    }
  }
];
var DEFAULT_SURFACE = HANZO_SURFACES[0];
function getSurface(id) {
  return id ? HANZO_SURFACES.find((s) => s.id === id) : void 0;
}
__name(getSurface, "getSurface");
function findSurfaceByHost(host) {
  if (!host)
    return DEFAULT_SURFACE;
  const h = host.toLowerCase().replace(/^www\./, "").replace(/:\d+$/, "");
  const exact = HANZO_SURFACES.find((s) => s.host === h);
  if (exact)
    return exact;
  const suffix = HANZO_SURFACES.filter((s) => h === s.host || h.endsWith(`.${s.host}`)).sort((a, b) => b.host.length - a.host.length)[0];
  return suffix ?? DEFAULT_SURFACE;
}
__name(findSurfaceByHost, "findSurfaceByHost");
var UNLIMITED = Number.MAX_SAFE_INTEGER;
var HANZO_PLANS = [
  {
    slug: "free",
    name: "Free",
    tagline: "The on-ramp \u2014 build with AI at no cost",
    kind: "personal",
    rank: 0,
    priceMonthly: 0,
    limits: { requestsPerMinute: 60, tokensPerMinute: 1e5, includedCreditUsd: 5, includedCloudCredits: 0, minSeats: 1, maxMembers: 1 }
  },
  {
    slug: "pro",
    name: "Pro",
    tagline: "For individuals shipping with AI every day",
    kind: "personal",
    rank: 1,
    priceMonthly: 2e3,
    limits: { requestsPerMinute: 500, tokensPerMinute: 1e6, includedCreditUsd: 20, includedCloudCredits: 5, minSeats: 1, maxMembers: 1 }
  },
  {
    slug: "plus",
    name: "Plus",
    tagline: "More throughput and the max-tier models",
    kind: "personal",
    rank: 2,
    priceMonthly: 1e4,
    limits: { requestsPerMinute: 2500, tokensPerMinute: 5e6, includedCreditUsd: 100, includedCloudCredits: 25, minSeats: 1, maxMembers: 1 }
  },
  {
    slug: "max",
    name: "Max",
    tagline: "Unlimited premium models and fine-tuning",
    kind: "personal",
    rank: 3,
    priceMonthly: 2e4,
    limits: { requestsPerMinute: 5e3, tokensPerMinute: 1e7, includedCreditUsd: 200, includedCloudCredits: 100, minSeats: 1, maxMembers: 1 }
  },
  {
    slug: "team",
    name: "Team",
    tagline: "People and AI coworkers together, with SSO",
    kind: "team",
    rank: 4,
    priceMonthly: 2500,
    perSeat: true,
    limits: { requestsPerMinute: 500, tokensPerMinute: 1e6, includedCreditUsd: 0, includedCloudCredits: 100, minSeats: 2, maxMembers: 100 }
  },
  {
    slug: "team-max",
    name: "Team Max",
    tagline: "Team, with unlimited premium models per seat",
    kind: "team",
    rank: 5,
    priceMonthly: 22500,
    perSeat: true,
    limits: { requestsPerMinute: 5e3, tokensPerMinute: 1e7, includedCreditUsd: 0, includedCloudCredits: 100, minSeats: 2, maxMembers: 100 }
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    tagline: "Unlimited members, SLA, on-prem, SOC 2",
    kind: "enterprise",
    rank: 6,
    priceMonthly: 999900,
    contactSales: true,
    limits: { requestsPerMinute: 5e3, tokensPerMinute: 1e7, includedCreditUsd: 1e3, includedCloudCredits: 100, minSeats: 2, maxMembers: UNLIMITED }
  },
  {
    slug: "custom",
    name: "Custom",
    tagline: "Dedicated, air-gapped, custom SLA",
    kind: "enterprise",
    rank: 7,
    priceMonthly: null,
    contactSales: true,
    limits: { requestsPerMinute: UNLIMITED, tokensPerMinute: UNLIMITED, includedCreditUsd: 0, includedCloudCredits: 0, minSeats: 2, maxMembers: UNLIMITED }
  }
];
var HANZO_PLAN_TIERS = HANZO_PLANS.map((p) => p.slug);
var DEFAULT_PLAN_TIER = "free";
var getPlanTier = /* @__PURE__ */ __name((slug) => slug ? HANZO_PLANS.find((p) => p.slug === slug) : void 0, "getPlanTier");
var APP_ENTITLEMENTS = {
  // Products
  chat: "free",
  app: "free",
  search: "free",
  dev: "free",
  cloud: "free",
  studio: "pro",
  bot: "pro",
  world: "pro",
  // bundled via world-pro on pro/plus/max, world-team on team
  team: "team",
  // Platform
  console: "free",
  gateway: "free",
  platform: "pro",
  // Install (clients are always free)
  desktop: "free",
  extension: "free",
  vscode: "free",
  cli: "free",
  // Account
  account: "free",
  billing: "free",
  admin: "team"
  // org/member administration requires a team plan
};

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/hanzo-apps.js
var svg = /* @__PURE__ */ __name((children) => /* @__PURE__ */ __name(function Icon({ size = 20 }) {
  return _jsx8("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children });
}, "Icon"), "svg");
var ChatIcon = svg(_jsx8("path", { d: "M21 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" }));
var AppIcon = svg(_jsxs7(_Fragment3, { children: [_jsx8("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1.4" }), _jsx8("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1.4" }), _jsx8("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1.4" }), _jsx8("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1.4" })] }));
var UsersIcon = svg(_jsxs7(_Fragment3, { children: [_jsx8("circle", { cx: "9", cy: "8", r: "3.2" }), _jsx8("path", { d: "M3.5 20a5.5 5.5 0 0 1 11 0" }), _jsx8("path", { d: "M16 5.2a3.2 3.2 0 0 1 0 6M17.5 20a5.5 5.5 0 0 0-3-4.9" })] }));
var StudioIcon = svg(_jsxs7(_Fragment3, { children: [_jsx8("path", { d: "M12 3v3M12 18v3M3 12h3M18 12h3" }), _jsx8("path", { d: "M12 8.2 13.4 11l2.8 1-2.8 1L12 15.8 10.6 13l-2.8-1 2.8-1z" })] }));
var BotIcon = svg(_jsxs7(_Fragment3, { children: [_jsx8("path", { d: "M12 4V2" }), _jsx8("rect", { x: "4", y: "7", width: "16", height: "12", rx: "2.5" }), _jsx8("path", { d: "M2 13h2M20 13h2M9 12v1M15 12v1" }), _jsx8("path", { d: "M9.5 16.5h5" })] }));
var CloudIcon = svg(_jsx8("path", { d: "M17.5 19H8a5 5 0 1 1 1.2-9.86A6 6 0 0 1 21 11a4 4 0 0 1-3.5 8Z" }));
var CodeIcon = svg(_jsxs7(_Fragment3, { children: [_jsx8("path", { d: "m9 8-4 4 4 4" }), _jsx8("path", { d: "m15 8 4 4-4 4" })] }));
var GlobeIcon = svg(_jsxs7(_Fragment3, { children: [_jsx8("circle", { cx: "12", cy: "12", r: "9" }), _jsx8("path", { d: "M3 12h18" }), _jsx8("path", { d: "M12 3a13 13 0 0 1 0 18 13 13 0 0 1 0-18" })] }));
var SearchIcon = svg(_jsxs7(_Fragment3, { children: [_jsx8("circle", { cx: "11", cy: "11", r: "7" }), _jsx8("path", { d: "m20 20-3.2-3.2" })] }));
var TerminalIcon = svg(_jsxs7(_Fragment3, { children: [_jsx8("path", { d: "m5 8 4 4-4 4" }), _jsx8("path", { d: "M13 16h6" }), _jsx8("rect", { x: "2.5", y: "4", width: "19", height: "16", rx: "2.5" })] }));
var GatewayIcon = svg(_jsxs7(_Fragment3, { children: [_jsx8("rect", { x: "9", y: "3", width: "6", height: "6", rx: "1.2" }), _jsx8("rect", { x: "3", y: "15", width: "6", height: "6", rx: "1.2" }), _jsx8("rect", { x: "15", y: "15", width: "6", height: "6", rx: "1.2" }), _jsx8("path", { d: "M12 9v3M6 15v-1a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" })] }));
var LayersIcon = svg(_jsxs7(_Fragment3, { children: [_jsx8("path", { d: "m12 3 9 5-9 5-9-5z" }), _jsx8("path", { d: "m3 13 9 5 9-5" })] }));
var MonitorIcon = svg(_jsxs7(_Fragment3, { children: [_jsx8("rect", { x: "3", y: "4", width: "18", height: "12", rx: "2" }), _jsx8("path", { d: "M8 20h8M12 16v4" })] }));
var PuzzleIcon = svg(_jsx8("path", { d: "M9 4.5a1.5 1.5 0 0 1 3 0V6h3a1 1 0 0 1 1 1v3h1.5a1.5 1.5 0 0 1 0 3H16v3a1 1 0 0 1-1 1h-3v-1.5a1.5 1.5 0 0 0-3 0V20H6a1 1 0 0 1-1-1v-3H3.5a1.5 1.5 0 0 1 0-3H5V7a1 1 0 0 1 1-1h3z" }));
var UserIcon = svg(_jsxs7(_Fragment3, { children: [_jsx8("circle", { cx: "12", cy: "12", r: "9" }), _jsx8("circle", { cx: "12", cy: "10", r: "3" }), _jsx8("path", { d: "M6.5 19a5.5 5.5 0 0 1 11 0" })] }));
var CardIcon = svg(_jsxs7(_Fragment3, { children: [_jsx8("rect", { x: "2.5", y: "5", width: "19", height: "14", rx: "2.5" }), _jsx8("path", { d: "M2.5 10h19M6 15h4" })] }));
var ShieldIcon = svg(_jsx8("path", { d: "M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z" }));
var HanzoGridIcon = /* @__PURE__ */ __name(({ size = 18 }) => _jsx8("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "currentColor", "aria-hidden": "true", children: [1, 6, 11].flatMap((y) => [1, 6, 11].map((x) => _jsx8("rect", { x, y, width: "4", height: "4", rx: "1.2" }, `${x}-${y}`))) }), "HanzoGridIcon");
var HANZO_APPS = [
  // ── Products ──
  { id: "chat", label: "Chat", href: U.chat, description: "Use AI \u2014 ask anything", icon: ChatIcon, category: "Products", core: true },
  { id: "app", label: "App", href: U.app, description: "Build and ship apps", icon: AppIcon, category: "Products", core: true },
  { id: "team", label: "Team", href: U.team, description: "People and AI together", icon: UsersIcon, category: "Products", core: true },
  { id: "studio", label: "Studio", href: U.studio, description: "Models, prompts and agents", icon: StudioIcon, category: "Products", core: true },
  { id: "bot", label: "Bot", href: U.bot, description: "Publish AI anywhere", icon: BotIcon, category: "Products", core: true },
  { id: "cloud", label: "Cloud", href: U.cloud, description: "Operate the platform", icon: CloudIcon, category: "Products", core: true },
  { id: "dev", label: "Dev", href: U.dev, description: "Build from editor and terminal", icon: CodeIcon, category: "Products" },
  { id: "world", label: "World", href: U.ai + "/world", description: "Real-time global intelligence", icon: GlobeIcon, category: "Products" },
  { id: "search", label: "Search", href: U.ai + "/search", description: "AI-powered search", icon: SearchIcon, category: "Products" },
  // ── Platform ──
  { id: "console", label: "Console", href: U.console, description: "API keys, projects & products", icon: TerminalIcon, category: "Platform", core: true },
  { id: "gateway", label: "Gateway", href: U.gateway, description: "Unified AI API gateway", icon: GatewayIcon, category: "Platform" },
  { id: "platform", label: "Platform", href: U.platform, description: "Deploy & scale services", icon: LayersIcon, category: "Platform" },
  // ── Install ──
  { id: "desktop", label: "Desktop", href: U.desktop, description: "Desktop app", icon: MonitorIcon, category: "Install" },
  { id: "extension", label: "Browser", href: U.extension, description: "Browser extension", icon: PuzzleIcon, category: "Install" },
  { id: "cli", label: "CLI", href: U.cli, description: "Command-line interface", icon: TerminalIcon, category: "Install" },
  // ── Account ──
  { id: "account", label: "Account", href: U.account, description: "Profile, orgs & billing", icon: UserIcon, category: "Account" },
  { id: "billing", label: "Billing", href: U.billing, description: "Subscriptions & usage", icon: CardIcon, category: "Account" },
  { id: "admin", label: "Admin", href: U.admin, description: "Platform administration", icon: ShieldIcon, category: "Account" }
];
var getHanzoApps = /* @__PURE__ */ __name(() => HANZO_APPS, "getHanzoApps");
var findHanzoApp = /* @__PURE__ */ __name((id) => id ? HANZO_APPS.find((a) => a.id === id) : void 0, "findHanzoApp");

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/entitlements.js
var RANK = Object.fromEntries(HANZO_PLANS.map((p) => [p.slug, p.rank]));
function rankOf(tier) {
  return RANK[tier] ?? RANK[DEFAULT_PLAN_TIER] ?? 0;
}
__name(rankOf, "rankOf");
function requiredTier(appId) {
  return APP_ENTITLEMENTS[appId] ?? DEFAULT_PLAN_TIER;
}
__name(requiredTier, "requiredTier");
function isEntitled(appId, tier) {
  return rankOf(tier) >= rankOf(requiredTier(appId));
}
__name(isEntitled, "isEntitled");
function entitlementFor(tier) {
  const r = rankOf(tier);
  const unlocked = /* @__PURE__ */ new Set();
  for (const appId of Object.keys(APP_ENTITLEMENTS)) {
    if (rankOf(requiredTier(appId)) <= r)
      unlocked.add(appId);
  }
  return unlocked;
}
__name(entitlementFor, "entitlementFor");
function normalizeTier(raw) {
  if (!raw)
    return DEFAULT_PLAN_TIER;
  const t = raw.trim().toLowerCase();
  if (getPlanTier(t))
    return t;
  if (t === "starter")
    return "pro";
  if (t === "developer" || t === "personal")
    return "free";
  return DEFAULT_PLAN_TIER;
}
__name(normalizeTier, "normalizeTier");

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/useEntitlement.js
import { useCallback as useCallback5, useEffect as useEffect6, useMemo as useMemo2, useState as useState8 } from "react";
var FREE_TIER = "free";
function resolveTier(payload, fallback) {
  const arr = Array.isArray(payload) ? payload : payload?.data ?? payload?.subscriptions ?? [];
  if (!Array.isArray(arr))
    return { tier: fallback, found: false };
  const active = arr.find((s) => {
    const st = s?.status;
    return st === "active" || st === "trialing";
  });
  const plan = active?.plan;
  const slug = typeof plan === "string" ? plan : plan?.slug ?? plan?.id ?? plan?.name;
  if (typeof slug === "string" && slug)
    return { tier: slug, found: true };
  return { tier: fallback, found: false };
}
__name(resolveTier, "resolveTier");
function useEntitlement(options = {}) {
  const { endpoint = "/v1/billing/subscriptions", headers, fallbackTier = FREE_TIER, fetchImpl, enabled = true } = options;
  const [tier, setTier] = useState8(fallbackTier);
  const [state, setState] = useState8(enabled ? "loading" : "none");
  const [nonce, setNonce] = useState8(0);
  const refresh = useCallback5(() => setNonce((n) => n + 1), []);
  const headerKey = headers ? JSON.stringify(headers) : "";
  useEffect6(() => {
    if (!enabled || typeof window === "undefined") {
      setTier(fallbackTier);
      setState("none");
      return;
    }
    let cancelled = false;
    const doFetch = fetchImpl ?? window.fetch.bind(window);
    setState("loading");
    doFetch(endpoint, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json", ...headers ?? {} }
    }).then((r) => r.ok ? r.json() : Promise.reject(new Error(String(r.status)))).then((payload) => {
      if (cancelled)
        return;
      const resolved = resolveTier(payload, fallbackTier);
      setTier(resolved.tier);
      setState(resolved.found ? "tier" : "none");
    }).catch(() => {
      if (cancelled)
        return;
      setTier(fallbackTier);
      setState("none");
    });
    return () => {
      cancelled = true;
    };
  }, [endpoint, fallbackTier, fetchImpl, enabled, nonce, headerKey]);
  const isEntitled2 = useCallback5((appId) => isEntitled(appId, normalizeTier(tier)), [tier]);
  return useMemo2(() => ({ tier, state, loading: state === "loading", isEntitled: isEntitled2, refresh }), [tier, state, isEntitled2, refresh]);
}
__name(useEntitlement, "useEntitlement");

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/theme.js
var CHROME = {
  bg: "rgba(9,9,11,0.85)",
  panel: "#0b0b0f",
  border: "rgba(255,255,255,0.09)",
  borderSoft: "rgba(255,255,255,0.06)",
  fg: "rgba(255,255,255,0.92)",
  fgMuted: "rgba(255,255,255,0.6)",
  fgDim: "rgba(255,255,255,0.45)",
  hover: "rgba(255,255,255,0.06)",
  font: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
};
var ACCENT = "var(--hanzo-accent, #ffffff)";
var ACCENT_SOFT = "rgba(255,255,255,0.14)";
var ACCENT_SOFTER = "rgba(255,255,255,0.22)";
var ACCENT_TINT = "rgba(255,255,255,0.18)";
var FS = {
  xs: "var(--font-size-xs, 0.6875rem)",
  // 11px — section labels / eyebrows
  sm: "var(--font-size-sm, 0.8125rem)",
  // 13px — nav labels, dense body
  base: "var(--font-size-base, 0.875rem)",
  // 14px — base app text (was 16px)
  lg: "var(--font-size-lg, 0.9375rem)",
  // 15px
  xl: "var(--font-size-xl, 1.0625rem)",
  // 17px
  "2xl": "var(--font-size-2xl, 1.3125rem)"
  // 21px
};
var Z = {
  sticky: "var(--z-sticky, 200)",
  dropdown: "var(--z-dropdown, 100)",
  overlay: "var(--z-overlay, 300)",
  modal: "var(--z-modal, 400)",
  popover: "var(--z-popover, 500)"
};

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/focusRing.js
import { useEffect as useEffect7 } from "react";
var STYLE_ID = "hanzo-shell-focus-ring";
var CSS = `[data-hanzo-shell] :focus-visible{outline:2px solid rgba(255,255,255,0.7)!important;outline-offset:2px!important}`;
function useShellFocusRing() {
  useEffect7(() => {
    if (typeof document === "undefined")
      return;
    if (document.getElementById(STYLE_ID))
      return;
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
}
__name(useShellFocusRing, "useShellFocusRing");

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/HanzoAppLauncher.js
var PANEL_BG = CHROME.panel;
var BORDER = CHROME.border;
var FG = CHROME.fg;
var FG_DIM = CHROME.fgDim;
var HOVER_BG = CHROME.hover;
function HanzoAppLauncher({ currentApp, apps = HANZO_APPS, align = "left", quickSwitchKey = "k", label = "Hanzo apps", size = 18, defaultOpen = false, userPlan, isEntitled: providedIsEntitled, entitlement, upgradeHref = U.pricing, trigger }) {
  useShellFocusRing();
  const auto = useEntitlement({
    enabled: !!entitlement && providedIsEntitled == null && userPlan == null,
    endpoint: typeof entitlement === "object" ? entitlement.endpoint : void 0,
    fallbackTier: typeof entitlement === "object" ? entitlement.fallbackTier : void 0
  });
  const check = useMemo3(() => {
    if (providedIsEntitled)
      return providedIsEntitled;
    if (userPlan != null)
      return (id) => isEntitled(id, normalizeTier(userPlan));
    if (entitlement)
      return auto.isEntitled;
    return null;
  }, [providedIsEntitled, userPlan, entitlement, auto.isEntitled]);
  const [open, setOpen] = useState9(defaultOpen);
  const [hover, setHover] = useState9(false);
  const [query, setQuery] = useState9("");
  const rootRef = useRef5(null);
  const triggerRef = useRef5(null);
  const searchRef = useRef5(null);
  const tileRefs = useRef5([]);
  const panelId = useId();
  const close = useCallback6(() => {
    setOpen(false);
    setQuery("");
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);
  useEffect8(() => {
    if (!quickSwitchKey)
      return;
    const onKey = /* @__PURE__ */ __name((e) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === quickSwitchKey.toLowerCase()) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }, "onKey");
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [quickSwitchKey]);
  useEffect8(() => {
    if (!open)
      return;
    const onDown = /* @__PURE__ */ __name((e) => {
      if (rootRef.current && !rootRef.current.contains(e.target))
        setOpen(false);
    }, "onDown");
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);
  useEffect8(() => {
    if (open)
      requestAnimationFrame(() => searchRef.current?.focus());
  }, [open]);
  const q = query.trim().toLowerCase();
  const filtering = q.length > 0;
  const visible = useMemo3(() => {
    if (!filtering)
      return apps;
    return apps.filter((a) => a.label.toLowerCase().includes(q) || (a.description ?? "").toLowerCase().includes(q));
  }, [apps, filtering, q]);
  const pinned = filtering ? [] : visible.filter((a) => a.pinned);
  const grid = filtering ? visible : visible.filter((a) => !a.pinned);
  const order = useMemo3(() => [...pinned, ...grid], [pinned, grid]);
  const focusTile = useCallback6((i) => {
    const n = tileRefs.current.length;
    if (n === 0)
      return;
    const idx = (i % n + n) % n;
    tileRefs.current[idx]?.focus();
  }, []);
  const onPanelKeyDown = useCallback6((e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    const active = document.activeElement;
    const cur = tileRefs.current.findIndex((t) => t === active);
    if (e.key === "ArrowDown" && active === searchRef.current) {
      e.preventDefault();
      focusTile(0);
      return;
    }
    if (cur < 0)
      return;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        focusTile(cur + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        focusTile(cur - 1);
        break;
      case "Home":
        e.preventDefault();
        focusTile(0);
        break;
      case "End":
        e.preventDefault();
        focusTile(tileRefs.current.length - 1);
        break;
    }
  }, [close, focusTile]);
  tileRefs.current = [];
  const registerTile = /* @__PURE__ */ __name((el) => {
    if (el)
      tileRefs.current.push(el);
  }, "registerTile");
  const Tile = /* @__PURE__ */ __name((app, wide) => {
    const isCurrent = app.id === currentApp;
    const locked = check ? !check(app.id) : false;
    const Icon = app.icon;
    return _jsxs8("a", { ref: registerTile, href: locked ? upgradeHref : app.href, "aria-current": isCurrent ? "page" : void 0, "aria-label": locked ? `${app.label} \u2014 locked, upgrade to unlock` : app.description ? `${app.label} \u2014 ${app.description}` : app.label, onClick: /* @__PURE__ */ __name(() => setOpen(false), "onClick"), style: {
      display: "flex",
      flexDirection: wide ? "row" : "column",
      alignItems: "center",
      gap: wide ? 12 : 8,
      textAlign: wide ? "left" : "center",
      textDecoration: "none",
      padding: wide ? "10px 12px" : "12px 8px",
      borderRadius: 12,
      border: `1px solid ${isCurrent ? ACCENT : "transparent"}`,
      background: isCurrent ? ACCENT_SOFT : "transparent",
      color: FG,
      opacity: locked ? 0.55 : 1,
      outlineColor: ACCENT,
      transition: "background 120ms ease, border-color 120ms ease, opacity 120ms ease",
      justifyContent: wide ? "flex-start" : "center"
    }, onMouseEnter: /* @__PURE__ */ __name((e) => {
      if (!isCurrent)
        e.currentTarget.style.background = HOVER_BG;
    }, "onMouseEnter"), onMouseLeave: /* @__PURE__ */ __name((e) => {
      if (!isCurrent)
        e.currentTarget.style.background = "transparent";
    }, "onMouseLeave"), children: [_jsxs8("span", { "aria-hidden": "true", style: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: wide ? 40 : 44,
      height: wide ? 40 : 44,
      flexShrink: 0,
      borderRadius: 12,
      background: isCurrent ? ACCENT_SOFTER : "rgba(255,255,255,0.05)",
      color: isCurrent ? ACCENT : FG
    }, children: [_jsx9(Icon, { size: wide ? 20 : 22 }), locked ? _jsx9("span", { style: {
      position: "absolute",
      right: -3,
      bottom: -3,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 16,
      height: 16,
      borderRadius: "50%",
      background: PANEL_BG,
      border: `1px solid ${BORDER}`,
      color: FG_DIM
    }, children: _jsx9(LockGlyph, { size: 9 }) }) : null] }), _jsxs8("span", { style: { display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }, children: [_jsx9("span", { style: {
      fontSize: 13,
      fontWeight: 600,
      lineHeight: 1.2,
      color: isCurrent ? ACCENT : FG,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: wide ? void 0 : 92
    }, children: app.label }), wide && app.description ? _jsx9("span", { style: { fontSize: 11.5, color: FG_DIM, lineHeight: 1.25 }, children: app.description }) : null] })] }, app.id);
  }, "Tile");
  const triggerColor = open || hover ? ACCENT : CHROME.fgMuted;
  return _jsxs8("div", { ref: rootRef, "data-hanzo-shell": "", style: { position: "relative", display: "inline-flex" }, children: [_jsx9("button", { ref: triggerRef, type: "button", onClick: /* @__PURE__ */ __name(() => setOpen((v) => !v), "onClick"), onMouseEnter: /* @__PURE__ */ __name(() => setHover(true), "onMouseEnter"), onMouseLeave: /* @__PURE__ */ __name(() => setHover(false), "onMouseLeave"), "aria-haspopup": "true", "aria-expanded": open, "aria-controls": open ? panelId : void 0, "aria-label": label, title: label, style: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: trigger ? "auto" : 34,
    height: 34,
    padding: 0,
    border: "none",
    borderRadius: 9,
    background: open && !trigger ? ACCENT_SOFT : "transparent",
    color: triggerColor,
    cursor: "pointer",
    transition: "background 120ms ease, color 120ms ease"
  }, children: trigger ? trigger({ open, hover }) : _jsx9(HanzoGridIcon, { size }) }), open ? _jsxs8("div", { id: panelId, "aria-label": "Hanzo apps", onKeyDown: onPanelKeyDown, style: {
    position: "absolute",
    top: 44,
    left: align === "left" ? 0 : void 0,
    right: align === "right" ? 0 : void 0,
    zIndex: 1e3,
    width: 340,
    maxWidth: "calc(100vw - 24px)",
    maxHeight: "80vh",
    overflowY: "auto",
    padding: 12,
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
    background: PANEL_BG,
    boxShadow: "0 24px 60px -12px rgba(0,0,0,0.7)",
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  }, children: [_jsxs8("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "2px 4px 10px" }, children: [_jsx9(HanzoWordmark, {}), _jsx9("span", { style: { fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: FG_DIM, textTransform: "uppercase" }, children: "Apps" })] }), _jsx9("input", { ref: searchRef, value: query, onChange: /* @__PURE__ */ __name((e) => setQuery(e.target.value), "onChange"), placeholder: "Filter apps\u2026", "aria-label": "Filter apps", autoComplete: "off", spellCheck: false, style: {
    width: "100%",
    boxSizing: "border-box",
    padding: "9px 12px",
    marginBottom: 10,
    borderRadius: 10,
    border: `1px solid ${BORDER}`,
    background: "rgba(255,255,255,0.03)",
    color: FG,
    fontSize: 13,
    outline: "none"
  } }), pinned.length > 0 ? _jsx9("div", { style: { display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }, children: pinned.map((a) => Tile(a, true)) }) : null, grid.length > 0 ? _jsx9("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }, children: grid.map((a) => Tile(a, false)) }) : _jsxs8("div", { style: { padding: "18px 8px", textAlign: "center", color: FG_DIM, fontSize: 13 }, children: ["No apps match \u201C", query.trim(), "\u201D."] }), quickSwitchKey ? _jsxs8("div", { style: { display: "flex", justifyContent: "flex-end", paddingTop: 10, color: FG_DIM, fontSize: 11 }, children: [_jsxs8("kbd", { style: {
    fontFamily: "inherit",
    border: `1px solid ${BORDER}`,
    borderRadius: 6,
    padding: "1px 6px",
    background: "rgba(255,255,255,0.04)"
  }, children: ["\u2318", quickSwitchKey.toUpperCase()] }), _jsx9("span", { style: { marginLeft: 6 }, children: "to switch" })] }) : null] }) : null] });
}
__name(HanzoAppLauncher, "HanzoAppLauncher");
function LockGlyph({ size = 10 }) {
  return _jsxs8("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx9("rect", { x: "4.5", y: "10.5", width: "15", height: "10", rx: "2.2" }), _jsx9("path", { d: "M8 10.5V7.5a4 4 0 0 1 8 0v3" })] });
}
__name(LockGlyph, "LockGlyph");
function HanzoWordmark() {
  return _jsxs8("span", { style: { display: "inline-flex", alignItems: "center", gap: 7 }, children: [_jsxs8("svg", { width: 16, height: 16, viewBox: "0 0 67 67", "aria-hidden": "true", children: [_jsx9("path", { d: "M22.21 67V44.6369H0V67H22.21Z", fill: "#fff" }), _jsx9("path", { d: "M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z", fill: "#fff" }), _jsx9("path", { d: "M22.21 0H0V22.3184H22.21V0Z", fill: "#fff" }), _jsx9("path", { d: "M66.7198 0H44.5098V22.3184H66.7198V0Z", fill: "#fff" }), _jsx9("path", { d: "M66.7198 67V44.6369H44.5098V67H66.7198Z", fill: "#fff" })] }), _jsx9("span", { style: { fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: -0.2 }, children: "Hanzo" })] });
}
__name(HanzoWordmark, "HanzoWordmark");

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/HanzoAppBar.js
var BAR_BG = CHROME.bg;
var BORDER2 = "rgba(255,255,255,0.08)";
var FG2 = CHROME.fg;
var FG_DIM2 = "rgba(255,255,255,0.42)";
var HOVER_BG2 = CHROME.hover;
function HanzoAppBar({ currentApp, currentAppLabel, apps = HANZO_APPS, logoHref = "https://hanzo.ai", user, settingsHref, onSettingsClick, accountHref, onProfileClick, onSignOut, accountItems, children, quickSwitchKey = "k", sticky = true }) {
  useShellFocusRing();
  const current = apps.find((a) => a.id === currentApp);
  const label = currentAppLabel ?? current?.label ?? titleCase(currentApp);
  return _jsxs9("header", { role: "banner", "data-hanzo-shell": "", style: {
    position: sticky ? "sticky" : "relative",
    top: 0,
    zIndex: 900,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    padding: "0 16px",
    boxSizing: "border-box",
    borderBottom: `1px solid ${BORDER2}`,
    background: BAR_BG,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    color: FG2,
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  }, children: [_jsxs9("div", { style: { display: "flex", alignItems: "center", gap: 8, minWidth: 0 }, children: [_jsx10(HanzoAppLauncher, { currentApp, apps, quickSwitchKey, label: "Switch Hanzo apps (\u2318K)", trigger: /* @__PURE__ */ __name(({ open, hover }) => _jsx10("span", { style: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 5px",
    borderRadius: 7,
    background: open ? "rgba(255,255,255,0.06)" : "transparent",
    color: open || hover ? FG2 : "rgba(255,255,255,0.82)",
    transition: "background 120ms ease, color 120ms ease"
  }, children: _jsx10(HMark, { size: 22 }) }), "trigger") }), _jsx10("span", { "aria-hidden": "true", style: { color: "rgba(255,255,255,0.18)", fontSize: 16 }, children: "/" }), _jsx10("span", { style: {
    fontSize: 13.5,
    fontWeight: 600,
    color: "rgba(255,255,255,0.6)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  }, children: label })] }), _jsxs9("div", { style: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }, children: [children, _jsx10(AccountMenu, { user, settingsHref, onSettingsClick, accountHref, onProfileClick, onSignOut, accountItems })] })] });
}
__name(HanzoAppBar, "HanzoAppBar");
function AccountMenu({ user, settingsHref, onSettingsClick, accountHref, onProfileClick, onSignOut, accountItems }) {
  const [open, setOpen] = useState10(false);
  const ref = useRef6(null);
  useEffect9(() => {
    if (!open)
      return;
    const onDown = /* @__PURE__ */ __name((e) => {
      if (ref.current && !ref.current.contains(e.target))
        setOpen(false);
    }, "onDown");
    const onKey = /* @__PURE__ */ __name((e) => {
      if (e.key === "Escape")
        setOpen(false);
    }, "onKey");
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const go = useCallback7((action) => {
    setOpen(false);
    if (action.onClick)
      action.onClick();
    else if (action.href)
      window.location.href = action.href;
  }, []);
  const rows = [];
  if (accountHref || onProfileClick)
    rows.push({ label: "Profile", href: accountHref, onClick: onProfileClick });
  if (settingsHref || onSettingsClick)
    rows.push({ label: "Settings", href: settingsHref, onClick: onSettingsClick });
  if (accountItems)
    rows.push(...accountItems);
  const name = user?.name?.trim() || "Account";
  const email = user?.email;
  return _jsxs9("div", { ref, style: { position: "relative", display: "inline-flex" }, children: [_jsx10("button", { type: "button", onClick: /* @__PURE__ */ __name(() => setOpen((v) => !v), "onClick"), "aria-haspopup": "menu", "aria-expanded": open, "aria-label": "Account and settings", style: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    height: 34,
    padding: user ? "0 6px 0 6px" : 0,
    width: user ? void 0 : 34,
    justifyContent: "center",
    border: "none",
    borderRadius: 9,
    background: open ? HOVER_BG2 : "transparent",
    color: FG2,
    cursor: "pointer",
    transition: "background 120ms ease"
  }, onMouseEnter: /* @__PURE__ */ __name((e) => {
    if (!open)
      e.currentTarget.style.background = HOVER_BG2;
  }, "onMouseEnter"), onMouseLeave: /* @__PURE__ */ __name((e) => {
    if (!open)
      e.currentTarget.style.background = "transparent";
  }, "onMouseLeave"), children: _jsx10(Avatar, { user }) }), open ? _jsxs9("div", { role: "menu", "aria-label": "Account", style: {
    position: "absolute",
    top: 42,
    right: 0,
    zIndex: 1e3,
    width: 248,
    padding: 8,
    borderRadius: 14,
    border: `1px solid ${BORDER2}`,
    background: "#0b0b0f",
    boxShadow: "0 24px 60px -12px rgba(0,0,0,0.7)"
  }, children: [_jsxs9("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "6px 8px 10px" }, children: [_jsx10(Avatar, { user, size: 34 }), _jsxs9("div", { style: { minWidth: 0 }, children: [_jsx10("div", { style: { fontSize: 13, fontWeight: 700, color: FG2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: name }), email ? _jsx10("div", { style: { fontSize: 11.5, color: FG_DIM2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: email }) : null] })] }), rows.map((r) => _jsx10(MenuRow, { label: r.label, onClick: /* @__PURE__ */ __name(() => go(r), "onClick") }, r.label)), onSignOut ? _jsxs9(_Fragment4, { children: [_jsx10("div", { style: { height: 1, background: BORDER2, margin: "6px 4px" } }), _jsx10(MenuRow, { label: "Sign out", onClick: /* @__PURE__ */ __name(() => go({ onClick: onSignOut }), "onClick") })] }) : null] }) : null] });
}
__name(AccountMenu, "AccountMenu");
function MenuRow({ label, onClick }) {
  return _jsx10("button", { type: "button", role: "menuitem", onClick, style: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "8px 10px",
    border: "none",
    borderRadius: 9,
    background: "transparent",
    color: FG2,
    fontSize: 13,
    textAlign: "left",
    cursor: "pointer"
  }, onMouseEnter: /* @__PURE__ */ __name((e) => e.currentTarget.style.background = HOVER_BG2, "onMouseEnter"), onMouseLeave: /* @__PURE__ */ __name((e) => e.currentTarget.style.background = "transparent", "onMouseLeave"), children: label });
}
__name(MenuRow, "MenuRow");
function Avatar({ user, size = 26 }) {
  if (user?.avatarUrl) {
    return _jsx10("img", { src: user.avatarUrl, alt: "", style: { width: size, height: size, borderRadius: 8, objectFit: "cover", display: "block", flexShrink: 0 } });
  }
  const initials = (user?.name?.trim() || "").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || null;
  if (initials) {
    return _jsx10("span", { "aria-hidden": "true", style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: size,
      height: size,
      borderRadius: 8,
      background: ACCENT_TINT,
      color: ACCENT,
      fontSize: Math.round(size * 0.42),
      fontWeight: 800,
      flexShrink: 0
    }, children: initials });
  }
  return _jsxs9("svg", { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx10("circle", { cx: "12", cy: "8", r: "4" }), _jsx10("path", { d: "M4 21a8 8 0 0 1 16 0" })] });
}
__name(Avatar, "Avatar");
function HMark({ size = 22 }) {
  return _jsxs9("svg", { width: size, height: size, viewBox: "0 0 67 67", xmlns: "http://www.w3.org/2000/svg", "aria-label": "Hanzo", children: [_jsx10("path", { d: "M22.21 67V44.6369H0V67H22.21Z", fill: "#fff" }), _jsx10("path", { d: "M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z", fill: "#fff" }), _jsx10("path", { d: "M22.21 0H0V22.3184H22.21V0Z", fill: "#fff" }), _jsx10("path", { d: "M66.7198 0H44.5098V22.3184H66.7198V0Z", fill: "#fff" }), _jsx10("path", { d: "M66.7198 67V44.6369H44.5098V67H66.7198Z", fill: "#fff" })] });
}
__name(HMark, "HMark");
function titleCase(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
__name(titleCase, "titleCase");

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/mark.js
import { jsx as _jsx11, jsxs as _jsxs10 } from "react/jsx-runtime";
function HanzoMark({ size = 22, title = "Hanzo" }) {
  return _jsxs10("svg", { width: size, height: size, viewBox: "0 0 67 67", fill: "currentColor", role: "img", "aria-label": title, children: [_jsx11("path", { d: "M22.21 67V44.6369H0V67H22.21Z" }), _jsx11("path", { d: "M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z" }), _jsx11("path", { d: "M22.21 0H0V22.3184H22.21V0Z" }), _jsx11("path", { d: "M66.7198 0H44.5098V22.3184H66.7198V0Z" }), _jsx11("path", { d: "M66.7198 67V44.6369H44.5098V67H66.7198Z" })] });
}
__name(HanzoMark, "HanzoMark");
function HanzoWordmark2({ label = "Hanzo", size = 22 }) {
  return _jsxs10("span", { style: { display: "inline-flex", alignItems: "center", gap: 8, color: "inherit" }, children: [_jsx11(HanzoMark, { size }), _jsx11("span", { style: { fontSize: Math.round(size * 0.62), fontWeight: 800, letterSpacing: -0.2 }, children: label })] });
}
__name(HanzoWordmark2, "HanzoWordmark");

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/useMediaQuery.js
import { useEffect as useEffect10, useState as useState11 } from "react";
function useMediaQuery(query) {
  const [matches, setMatches] = useState11(false);
  useEffect10(() => {
    if (typeof window === "undefined" || !window.matchMedia)
      return;
    const mql = window.matchMedia(query);
    const onChange = /* @__PURE__ */ __name(() => setMatches(mql.matches), "onChange");
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}
__name(useMediaQuery, "useMediaQuery");
function useIsMobile(px = 900) {
  return useMediaQuery(`(max-width: ${px - 0.02}px)`);
}
__name(useIsMobile, "useIsMobile");

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/HanzoAccessGate.js
import { jsx as _jsx12, jsxs as _jsxs11, Fragment as _Fragment5 } from "react/jsx-runtime";
function requiredTier2(appId) {
  const slug = APP_ENTITLEMENTS[appId];
  if (!slug)
    return null;
  const plan = HANZO_PLANS.find((p) => p.slug === slug);
  return { slug, name: plan?.name ?? slug };
}
__name(requiredTier2, "requiredTier");
var LockGlyph2 = /* @__PURE__ */ __name(({ size = 22 }) => _jsxs11("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx12("rect", { x: "4.5", y: "10.5", width: "15", height: "10", rx: "2.2" }), _jsx12("path", { d: "M8 10.5V7.5a4 4 0 0 1 8 0v3" }), _jsx12("circle", { cx: "12", cy: "15.5", r: "1.1", fill: "currentColor", stroke: "none" })] }), "LockGlyph");
function HanzoAccessGate({ appId, children, upgrade, isEntitled: providedIsEntitled, tier: providedTier, endpoint, upgradeHref = U.pricing, appName }) {
  useShellFocusRing();
  const controlled = providedIsEntitled != null;
  const auto = useEntitlement({ endpoint, enabled: !controlled });
  const loading = controlled ? false : auto.loading;
  const entitled = controlled ? providedIsEntitled(appId) : providedTier != null ? isEntitled(appId, normalizeTier(providedTier)) : auto.isEntitled(appId);
  if (loading) {
    return _jsx12("div", { "data-hanzo-shell": "", "aria-busy": "true", style: { minHeight: 120, display: "flex", alignItems: "center", justifyContent: "center" } });
  }
  if (entitled)
    return _jsx12(_Fragment5, { children });
  if (upgrade !== void 0)
    return _jsx12(_Fragment5, { children: upgrade });
  const req = requiredTier2(appId);
  const name = appName ?? findHanzoApp(appId)?.label ?? appId;
  return _jsxs11("div", { "data-hanzo-shell": "", role: "region", "aria-label": `${name} requires an upgrade`, style: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: 14,
    maxWidth: 380,
    margin: "0 auto",
    padding: "40px 28px",
    borderRadius: 16,
    border: `1px solid ${CHROME.border}`,
    background: CHROME.panel,
    color: CHROME.fg,
    fontFamily: CHROME.font
  }, children: [_jsx12("span", { "aria-hidden": "true", style: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 52,
    height: 52,
    borderRadius: 14,
    background: ACCENT_SOFT,
    color: ACCENT
  }, children: _jsx12(LockGlyph2, { size: 24 }) }), _jsxs11("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: [_jsx12("span", { style: { fontSize: FS.xl, fontWeight: 700, lineHeight: 1.25 }, children: name }), _jsx12("span", { style: { fontSize: FS.sm, color: CHROME.fgMuted, lineHeight: 1.4 }, children: req ? _jsxs11(_Fragment5, { children: ["Included in ", _jsx12("strong", { style: { color: CHROME.fg, fontWeight: 600 }, children: req.name })] }) : "Upgrade your plan to unlock this." })] }), _jsx12("a", { href: upgradeHref, style: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "9px 18px",
    borderRadius: 10,
    background: ACCENT,
    color: "#000",
    fontSize: FS.sm,
    fontWeight: 600,
    textDecoration: "none",
    border: `1px solid ${ACCENT}`
  }, children: req ? `Upgrade to ${req.name}` : "View plans" })] });
}
__name(HanzoAccessGate, "HanzoAccessGate");

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/HanzoPlans.js
import { jsx as _jsx13, jsxs as _jsxs12 } from "react/jsx-runtime";
import { useEffect as useEffect11, useMemo as useMemo4, useRef as useRef7, useState as useState12 } from "react";
var { panel: PANEL_BG2, border: BORDER3, borderSoft: BORDER_SOFT, fg: FG3, fgMuted: FG_MUTED, fgDim: FG_DIM3, hover: HOVER_BG3, font: FONT } = CHROME;
var KIND_ORDER = ["personal", "team", "enterprise"];
var KIND_LABEL = {
  personal: "Personal",
  team: "Team",
  enterprise: "Enterprise"
};
function priceLabel(cents) {
  return `$${(cents / 100).toLocaleString(void 0, { maximumFractionDigits: 0 })}`;
}
__name(priceLabel, "priceLabel");
function compact(n) {
  if (n >= UNLIMITED)
    return "Unlimited";
  if (n >= 1e6) {
    const m = n / 1e6;
    return `${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  if (n >= 1e5)
    return `${Math.round(n / 1e3)}K`;
  return n.toLocaleString();
}
__name(compact, "compact");
function limitLines(plan) {
  const l = plan.limits;
  const perSeat = plan.perSeat ? "/seat" : "";
  const lines = [
    `${compact(l.requestsPerMinute)} requests/min${perSeat}`,
    `${compact(l.tokensPerMinute)} tokens/min${perSeat}`
  ];
  if (l.includedCreditUsd > 0)
    lines.push(`$${l.includedCreditUsd.toLocaleString()}/mo included usage`);
  if (l.includedCloudCredits > 0)
    lines.push(`$${l.includedCloudCredits.toLocaleString()}${perSeat}/mo cloud credits`);
  if (l.maxMembers >= UNLIMITED)
    lines.push("Unlimited members");
  else if (plan.kind !== "personal")
    lines.push(`Up to ${l.maxMembers.toLocaleString()} members`);
  if (l.minSeats > 1)
    lines.push(`From ${l.minSeats} seats`);
  return lines;
}
__name(limitLines, "limitLines");
function appsIntroducedBy(slug) {
  return Object.keys(APP_ENTITLEMENTS).filter((id) => normalizeTier(APP_ENTITLEMENTS[id]) === slug).map((id) => findHanzoApp(id)).filter((a) => Boolean(a));
}
__name(appsIntroducedBy, "appsIntroducedBy");
function prevSameKind(plan, plans) {
  return plans.filter((p) => p.kind === plan.kind && p.rank < plan.rank).sort((a, b) => b.rank - a.rank)[0];
}
__name(prevSameKind, "prevSameKind");
function HanzoPlans({ checkoutHref = `${U.console}/billing/upgrade`, salesHref = U.contact, onSelectPlan, plans = HANZO_PLANS, entitlement, entitlementOptions, recommendedTier, defaultKind, heading = "Plans & pricing", subheading = "Pick the tier that fits \u2014 every plan includes the full developer surface; upgrade for more throughput, models, and collaboration.", style, id }) {
  useShellFocusRing();
  const auto = useEntitlement(entitlement ? { ...entitlementOptions, enabled: false } : entitlementOptions);
  const ent = entitlement ?? auto;
  const currentSlug = ent.state === "tier" ? normalizeTier(ent.tier) : void 0;
  const baselineRank = currentSlug ? rankOf(currentSlug) : rankOf(DEFAULT_PLAN_TIER);
  const ascending = useMemo4(() => [...plans].sort((a, b) => a.rank - b.rank), [plans]);
  const recommendedSlug = useMemo4(() => {
    if (recommendedTier)
      return recommendedTier;
    const next = ascending.find((p) => p.rank > baselineRank && !p.contactSales);
    return next && next.slug !== currentSlug ? next.slug : void 0;
  }, [recommendedTier, ascending, baselineRank, currentSlug]);
  const kinds = useMemo4(() => KIND_ORDER.filter((k) => plans.some((p) => p.kind === k)), [plans]);
  const [activeKind, setActiveKind] = useState12(defaultKind ?? getPlanTier(currentSlug)?.kind ?? "personal");
  const pinned = useRef7(Boolean(defaultKind));
  useEffect11(() => {
    if (pinned.current)
      return;
    if (ent.state === "tier") {
      const k = getPlanTier(normalizeTier(ent.tier))?.kind;
      if (k) {
        setActiveKind(k);
        pinned.current = true;
      }
    }
  }, [ent.state, ent.tier]);
  const selectKind = /* @__PURE__ */ __name((k) => {
    pinned.current = true;
    setActiveKind(k);
  }, "selectKind");
  const shown = useMemo4(() => ascending.filter((p) => p.kind === activeKind), [ascending, activeKind]);
  return _jsxs12("section", { id, "data-hanzo-shell": "", "aria-label": heading, style: {
    boxSizing: "border-box",
    width: "100%",
    color: FG3,
    fontFamily: FONT,
    ...style
  }, children: [_jsxs12("div", { style: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 24
  }, children: [_jsxs12("div", { style: { minWidth: 0, flex: "1 1 320px" }, children: [_jsx13("h2", { style: { margin: 0, fontSize: FS["2xl"], fontWeight: 800, letterSpacing: -0.4, color: FG3 }, children: heading }), subheading ? _jsx13("p", { style: { margin: "8px 0 0", fontSize: FS.base, lineHeight: 1.5, color: FG_MUTED, maxWidth: 560 }, children: subheading }) : null] }), kinds.length > 1 ? _jsx13("div", { role: "group", "aria-label": "Plan type", style: {
    display: "inline-flex",
    padding: 3,
    gap: 2,
    borderRadius: 12,
    border: `1px solid ${BORDER3}`,
    background: "rgba(255,255,255,0.03)"
  }, children: kinds.map((k) => {
    const active = k === activeKind;
    return _jsx13("button", { type: "button", "aria-pressed": active, onClick: /* @__PURE__ */ __name(() => selectKind(k), "onClick"), style: {
      appearance: "none",
      border: "none",
      cursor: "pointer",
      padding: "7px 14px",
      borderRadius: 9,
      fontSize: FS.sm,
      fontWeight: 600,
      fontFamily: FONT,
      color: active ? "#000" : FG_MUTED,
      background: active ? ACCENT : "transparent",
      transition: "background 120ms ease, color 120ms ease"
    }, onMouseEnter: /* @__PURE__ */ __name((e) => {
      if (!active)
        e.currentTarget.style.background = HOVER_BG3;
    }, "onMouseEnter"), onMouseLeave: /* @__PURE__ */ __name((e) => {
      if (!active)
        e.currentTarget.style.background = "transparent";
    }, "onMouseLeave"), children: KIND_LABEL[k] }, k);
  }) }) : null] }), _jsx13("div", { style: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 16,
    alignItems: "stretch"
  }, children: shown.map((plan) => _jsx13(PlanCard, { plan, plans: ascending, isCurrent: plan.slug === currentSlug, isRecommended: plan.slug === recommendedSlug, baselineRank, checkoutHref, salesHref, onSelectPlan }, plan.slug)) })] });
}
__name(HanzoPlans, "HanzoPlans");
function PlanCard({ plan, plans, isCurrent, isRecommended, baselineRank, checkoutHref, salesHref, onSelectPlan }) {
  const emphasise = isRecommended && !isCurrent;
  const introduced = appsIntroducedBy(plan.slug);
  const prev = prevSameKind(plan, plans);
  const limits = limitLines(plan);
  let priceBig;
  let priceSuffix = "";
  let priceNote = "";
  if (plan.priceMonthly == null) {
    priceBig = "Custom";
    priceNote = "Tailored to you";
  } else if (plan.priceMonthly === 0) {
    priceBig = "$0";
    priceNote = "Free forever";
  } else {
    priceBig = priceLabel(plan.priceMonthly);
    priceSuffix = plan.perSeat ? "/seat/mo" : "/mo";
    if (plan.contactSales)
      priceNote = "Starting price \xB7 contact sales";
  }
  const higher = plan.rank > baselineRank;
  let ctaLabel;
  if (isCurrent)
    ctaLabel = "Current plan";
  else if (plan.contactSales)
    ctaLabel = "Contact sales";
  else if (higher)
    ctaLabel = "Upgrade";
  else
    ctaLabel = `Switch to ${plan.name}`;
  const href = plan.contactSales ? `${salesHref}?plan=${plan.slug}` : `${checkoutHref}?plan=${plan.slug}`;
  return _jsxs12("div", { "aria-label": `${plan.name} plan`, style: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    padding: 20,
    borderRadius: 16,
    border: `1px solid ${emphasise || isCurrent ? ACCENT : BORDER3}`,
    background: emphasise ? ACCENT_SOFT : PANEL_BG2,
    boxShadow: emphasise ? "0 20px 50px -20px rgba(0,0,0,0.65)" : "none"
  }, children: [(isCurrent || emphasise) && _jsx13("div", { style: { position: "absolute", top: 16, right: 16 }, children: _jsx13("span", { style: {
    display: "inline-block",
    padding: "3px 9px",
    borderRadius: 999,
    fontSize: FS.xs,
    fontWeight: 700,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: isCurrent ? FG3 : "#000",
    background: isCurrent ? ACCENT_SOFTER : ACCENT,
    border: isCurrent ? `1px solid ${BORDER3}` : "none"
  }, children: isCurrent ? "Current" : "Recommended" }) }), _jsxs12("div", { style: { marginBottom: 14, paddingRight: 84 }, children: [_jsx13("div", { style: { fontSize: FS.lg, fontWeight: 700, color: FG3 }, children: plan.name }), _jsx13("div", { style: { marginTop: 4, fontSize: FS.sm, lineHeight: 1.4, color: FG_DIM3, minHeight: 34 }, children: plan.tagline })] }), _jsxs12("div", { style: { display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }, children: [_jsx13("span", { style: { fontSize: FS["2xl"], fontWeight: 800, letterSpacing: -0.6, color: FG3 }, children: priceBig }), priceSuffix ? _jsx13("span", { style: { fontSize: FS.sm, color: FG_MUTED }, children: priceSuffix }) : null] }), _jsx13("div", { style: { minHeight: 16, marginBottom: 16, fontSize: FS.xs, color: FG_DIM3 }, children: priceNote }), _jsx13(PlanCTA, { label: ctaLabel, href, disabled: isCurrent, emphasise, onClick: onSelectPlan ? () => onSelectPlan(plan) : void 0 }), _jsxs12("div", { style: { marginTop: 18 }, children: [_jsx13("div", { style: sectionLabelStyle, children: prev ? `Everything in ${prev.name}, plus` : "Included apps" }), introduced.length > 0 ? _jsx13("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }, children: introduced.map((app) => _jsx13(AppChip, { app }, app.id)) }) : _jsx13("div", { style: { marginTop: 8, fontSize: FS.sm, color: FG_DIM3 }, children: prev ? "All the same apps, with more capacity." : "The full developer surface." })] }), _jsxs12("div", { style: { marginTop: 16 }, children: [_jsx13("div", { style: sectionLabelStyle, children: "Limits & usage" }), _jsx13("ul", { style: { listStyle: "none", margin: "8px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 7 }, children: limits.map((line) => _jsxs12("li", { style: { display: "flex", alignItems: "flex-start", gap: 8, fontSize: FS.sm, color: FG_MUTED }, children: [_jsx13(CheckIcon, {}), _jsx13("span", { style: { lineHeight: 1.35 }, children: line })] }, line)) })] })] });
}
__name(PlanCard, "PlanCard");
var sectionLabelStyle = {
  fontSize: FS.xs,
  fontWeight: 700,
  letterSpacing: 0.4,
  textTransform: "uppercase",
  color: FG_DIM3
};
function PlanCTA({ label, href, disabled, emphasise, onClick }) {
  const base = {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 14px",
    borderRadius: 10,
    textAlign: "center",
    fontSize: FS.sm,
    fontWeight: 700,
    fontFamily: FONT,
    textDecoration: "none",
    cursor: disabled ? "default" : "pointer",
    transition: "background 120ms ease, border-color 120ms ease, opacity 120ms ease"
  };
  if (disabled) {
    return _jsx13("span", { "aria-disabled": "true", style: { ...base, color: FG_DIM3, background: "transparent", border: `1px solid ${BORDER_SOFT}` }, children: label });
  }
  const filled = emphasise;
  const style = filled ? { ...base, color: "#000", background: ACCENT, border: "1px solid transparent" } : { ...base, color: FG3, background: "transparent", border: `1px solid ${BORDER3}` };
  const hover = /* @__PURE__ */ __name((e, on) => {
    const el = e.currentTarget;
    if (filled)
      el.style.opacity = on ? "0.88" : "1";
    else
      el.style.background = on ? HOVER_BG3 : "transparent";
  }, "hover");
  if (onClick) {
    return _jsx13("button", { type: "button", onClick, onMouseEnter: /* @__PURE__ */ __name((e) => hover(e, true), "onMouseEnter"), onMouseLeave: /* @__PURE__ */ __name((e) => hover(e, false), "onMouseLeave"), style: { ...style, appearance: "none" }, children: label });
  }
  return _jsx13("a", { href, onMouseEnter: /* @__PURE__ */ __name((e) => hover(e, true), "onMouseEnter"), onMouseLeave: /* @__PURE__ */ __name((e) => hover(e, false), "onMouseLeave"), style, children: label });
}
__name(PlanCTA, "PlanCTA");
function AppChip({ app }) {
  const Icon = app.icon;
  return _jsxs12("span", { title: app.description ? `${app.label} \u2014 ${app.description}` : app.label, style: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 9px 4px 7px",
    borderRadius: 999,
    border: `1px solid ${BORDER_SOFT}`,
    background: "rgba(255,255,255,0.04)",
    fontSize: FS.xs,
    fontWeight: 600,
    color: FG_MUTED,
    whiteSpace: "nowrap"
  }, children: [_jsx13("span", { "aria-hidden": "true", style: { display: "inline-flex", color: FG3 }, children: _jsx13(Icon, { size: 14 }) }), app.label] });
}
__name(AppChip, "AppChip");
function CheckIcon() {
  return _jsx13("svg", { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", style: { flexShrink: 0, marginTop: 1, color: FG_MUTED }, children: _jsx13("path", { d: "M20 6 9 17l-5-5" }) });
}
__name(CheckIcon, "CheckIcon");

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/HanzoHeader.js
import { jsx as _jsx16, Fragment as _Fragment8, jsxs as _jsxs15 } from "react/jsx-runtime";
import { useCallback as useCallback10, useEffect as useEffect14, useRef as useRef10, useState as useState13 } from "react";

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/MeetHanzoMenu.js
import { jsx as _jsx14, jsxs as _jsxs13, Fragment as _Fragment6 } from "react/jsx-runtime";
import { useCallback as useCallback8, useEffect as useEffect12, useMemo as useMemo5, useRef as useRef8 } from "react";
function MeetHanzoMenu({ open, onClose, anchor = 60, currentProductId, id, className, resolveHref }) {
  const panelRef = useRef8(null);
  const itemRefs = useRef8([]);
  const restoreRef = useRef8(null);
  useShellFocusRing();
  const narrow = useMediaQuery("(max-width: 720px)");
  const close = useCallback8(() => onClose?.(), [onClose]);
  useEffect12(() => {
    if (!open)
      return;
    restoreRef.current = document.activeElement ?? null;
    const first = itemRefs.current.find(Boolean);
    requestAnimationFrame(() => first?.focus());
    return () => {
      restoreRef.current?.focus?.();
    };
  }, [open]);
  const focusItem = useCallback8((i) => {
    const els = itemRefs.current.filter(Boolean);
    if (els.length === 0)
      return;
    const idx = (i % els.length + els.length) % els.length;
    els[idx]?.focus();
  }, []);
  const onKeyDown = useCallback8((e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    const els = itemRefs.current.filter(Boolean);
    const cur = els.indexOf(document.activeElement);
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        focusItem((cur < 0 ? -1 : cur) + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        focusItem((cur < 0 ? els.length : cur) - 1);
        break;
      case "Home":
        e.preventDefault();
        focusItem(0);
        break;
      case "End":
        e.preventDefault();
        focusItem(els.length - 1);
        break;
    }
  }, [close, focusItem]);
  const resolve = resolveHref ?? ((h) => h);
  const flagship = useMemo5(
    () => HANZO_FLAGSHIP.map((p) => ({ ...p, href: resolve(p.href, p.id) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resolveHref]
  );
  const columnGroups = useMemo5(
    () => MEET_HANZO_GROUPS.filter((g) => g.id !== "products").map((g) => ({
      ...g,
      items: g.items.map((it) => ({ ...it, href: resolve(it.href, it.id) }))
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resolveHref]
  );
  itemRefs.current = [];
  const register = /* @__PURE__ */ __name((el) => {
    if (el)
      itemRefs.current.push(el);
  }, "register");
  if (!open)
    return null;
  return _jsxs13(_Fragment6, { children: [_jsx14("div", { "aria-hidden": "true", onClick: close, style: { position: "fixed", inset: 0, zIndex: Z.overlay, background: "transparent" } }), _jsx14("div", { ref: panelRef, id, "data-hanzo-shell": "", role: "dialog", "aria-modal": "false", "aria-label": "Meet Hanzo", className, onKeyDown, style: {
    position: "fixed",
    top: anchor,
    left: 0,
    right: 0,
    zIndex: Z.modal,
    display: "flex",
    justifyContent: "center",
    padding: "0 16px 16px",
    boxSizing: "border-box",
    fontFamily: CHROME.font,
    color: CHROME.fg
  }, children: _jsxs13("div", { style: {
    width: "100%",
    maxWidth: 1120,
    maxHeight: "calc(100vh - 96px)",
    overflowY: "auto",
    padding: 24,
    borderRadius: 18,
    border: `1px solid ${CHROME.border}`,
    background: CHROME.panel,
    boxShadow: "0 30px 80px -20px rgba(0,0,0,0.8)"
  }, children: [_jsx14(SectionLabel, { children: "Flagship products" }), _jsx14("div", { style: {
    display: "grid",
    gridTemplateColumns: narrow ? "repeat(2, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))",
    gap: 10,
    marginBottom: 24
  }, children: flagship.map((p) => _jsx14(ProductCard, { product: p, current: p.id === currentProductId, register, onNavigate: close }, p.id)) }), _jsx14("div", { style: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 24
  }, children: columnGroups.map((group) => _jsxs13("div", { children: [_jsx14(SectionLabel, { children: group.title }), _jsx14("div", { style: { display: "flex", flexDirection: "column", gap: 2 }, children: group.items.map((item) => _jsx14(LinkRow, { link: item, current: item.id === currentProductId, register, onNavigate: close }, item.id)) })] }, group.id)) })] }) })] });
}
__name(MeetHanzoMenu, "MeetHanzoMenu");
function SectionLabel({ children }) {
  return _jsx14("div", { style: {
    fontSize: FS.xs,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: CHROME.fgDim,
    marginBottom: 10
  }, children });
}
__name(SectionLabel, "SectionLabel");
function ProductCard({ product, current, register, onNavigate }) {
  return _jsxs13("a", { ref: register, href: product.href, "aria-current": current ? "true" : void 0, "aria-label": `${product.verb} \u2014 ${product.label}: ${product.tagline}`, onClick: onNavigate, style: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    textDecoration: "none",
    padding: "14px 16px",
    borderRadius: 14,
    border: `1px solid ${current ? ACCENT : CHROME.border}`,
    background: current ? ACCENT_SOFT : "rgba(255,255,255,0.02)",
    color: CHROME.fg,
    outlineColor: ACCENT,
    transition: "background 120ms ease, border-color 120ms ease"
  }, onMouseEnter: /* @__PURE__ */ __name((e) => {
    if (!current)
      e.currentTarget.style.background = CHROME.hover;
  }, "onMouseEnter"), onMouseLeave: /* @__PURE__ */ __name((e) => {
    if (!current)
      e.currentTarget.style.background = "rgba(255,255,255,0.02)";
  }, "onMouseLeave"), children: [_jsx14("span", { style: { fontSize: FS.xs, fontWeight: 600, color: current ? ACCENT : CHROME.fgMuted }, children: product.verb }), _jsx14("span", { style: { fontSize: FS.base, fontWeight: 700, color: current ? ACCENT : CHROME.fg }, children: product.label }), _jsx14("span", { style: { fontSize: FS.sm, color: CHROME.fgMuted, lineHeight: 1.3 }, children: product.tagline })] });
}
__name(ProductCard, "ProductCard");
function LinkRow({ link, current, register, onNavigate }) {
  return _jsx14("a", { ref: register, href: link.href, "aria-current": current ? "true" : void 0, onClick: onNavigate, style: {
    display: "block",
    padding: "6px 8px",
    margin: "0 -8px",
    borderRadius: 8,
    textDecoration: "none",
    fontSize: FS.sm,
    color: current ? ACCENT : CHROME.fgMuted,
    outlineColor: ACCENT,
    transition: "background 120ms ease, color 120ms ease"
  }, onMouseEnter: /* @__PURE__ */ __name((e) => {
    const el = e.currentTarget;
    el.style.background = ACCENT_SOFTER;
    el.style.color = CHROME.fg;
  }, "onMouseEnter"), onMouseLeave: /* @__PURE__ */ __name((e) => {
    const el = e.currentTarget;
    el.style.background = "transparent";
    el.style.color = current ? ACCENT : CHROME.fgMuted;
  }, "onMouseLeave"), children: link.label });
}
__name(LinkRow, "LinkRow");

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/ProductsMegaMenu.js
import { jsx as _jsx15, Fragment as _Fragment7, jsxs as _jsxs14 } from "react/jsx-runtime";
import { useCallback as useCallback9, useEffect as useEffect13, useRef as useRef9 } from "react";
function ProductsMegaMenu({ categories, open, onClose, anchor = 60, currentCategoryId, currentHref, id, className }) {
  const itemRefs = useRef9([]);
  const restoreRef = useRef9(null);
  useShellFocusRing();
  const close = useCallback9(() => onClose?.(), [onClose]);
  useEffect13(() => {
    if (!open)
      return;
    restoreRef.current = document.activeElement ?? null;
    const first = itemRefs.current.find(Boolean);
    requestAnimationFrame(() => first?.focus());
    return () => {
      restoreRef.current?.focus?.();
    };
  }, [open]);
  const focusItem = useCallback9((i) => {
    const els = itemRefs.current.filter(Boolean);
    if (els.length === 0)
      return;
    const idx = (i % els.length + els.length) % els.length;
    els[idx]?.focus();
  }, []);
  const onKeyDown = useCallback9((e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    const els = itemRefs.current.filter(Boolean);
    const cur = els.indexOf(document.activeElement);
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        focusItem((cur < 0 ? -1 : cur) + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        focusItem((cur < 0 ? els.length : cur) - 1);
        break;
      case "Home":
        e.preventDefault();
        focusItem(0);
        break;
      case "End":
        e.preventDefault();
        focusItem(els.length - 1);
        break;
    }
  }, [close, focusItem]);
  itemRefs.current = [];
  const register = /* @__PURE__ */ __name((el) => {
    if (el)
      itemRefs.current.push(el);
  }, "register");
  if (!open)
    return null;
  return _jsxs14(_Fragment7, { children: [_jsx15("div", { "aria-hidden": "true", onClick: close, style: { position: "fixed", inset: 0, zIndex: Z.overlay, background: "transparent" } }), _jsx15("div", { id, "data-hanzo-shell": "", role: "dialog", "aria-modal": "false", "aria-label": "Products", className, onKeyDown, style: {
    position: "fixed",
    top: anchor,
    left: 0,
    right: 0,
    zIndex: Z.modal,
    display: "flex",
    justifyContent: "center",
    padding: "0 16px 16px",
    boxSizing: "border-box",
    fontFamily: CHROME.font,
    color: CHROME.fg
  }, children: _jsx15("div", { style: {
    width: "100%",
    maxWidth: 1180,
    maxHeight: "calc(100vh - 96px)",
    overflowY: "auto",
    padding: 24,
    borderRadius: 18,
    border: `1px solid ${CHROME.border}`,
    background: CHROME.panel,
    boxShadow: "0 30px 80px -20px rgba(0,0,0,0.8)"
  }, children: _jsx15("div", { style: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "20px 24px"
  }, children: categories.map((category) => _jsx15(CategoryColumn, { category, currentCategory: category.id === currentCategoryId, currentHref, register, onNavigate: close }, category.id)) }) }) })] });
}
__name(ProductsMegaMenu, "ProductsMegaMenu");
function CategoryColumn({ category, currentCategory, currentHref, register, onNavigate }) {
  return _jsxs14("div", { children: [_jsxs14("a", { ref: register, href: category.href, "aria-current": currentCategory ? "true" : void 0, onClick: onNavigate, style: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    margin: "0 -6px 4px",
    padding: "2px 6px",
    borderRadius: 7,
    textDecoration: "none",
    fontSize: FS.xs,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: currentCategory ? ACCENT : CHROME.fg,
    outlineColor: ACCENT,
    transition: "color 120ms ease"
  }, onMouseEnter: /* @__PURE__ */ __name((e) => {
    ;
    e.currentTarget.style.color = ACCENT;
  }, "onMouseEnter"), onMouseLeave: /* @__PURE__ */ __name((e) => {
    ;
    e.currentTarget.style.color = currentCategory ? ACCENT : CHROME.fg;
  }, "onMouseLeave"), children: [category.label, _jsx15(Arrow, {})] }), category.tagline ? _jsx15("p", { title: category.tagline, style: {
    margin: "0 0 8px",
    fontSize: FS.xs,
    lineHeight: 1.3,
    color: CHROME.fgDim,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden"
  }, children: category.tagline }) : null, _jsx15("div", { style: { display: "flex", flexDirection: "column", gap: 2 }, children: category.items.map((item) => _jsx15(LeafRow, { link: item, current: !!currentHref && item.href === currentHref, register, onNavigate }, item.id)) })] });
}
__name(CategoryColumn, "CategoryColumn");
function LeafRow({ link, current, register, onNavigate }) {
  return _jsxs14("a", { ref: register, href: link.href, "aria-current": current ? "true" : void 0, target: link.external ? "_blank" : void 0, rel: link.external ? "noreferrer noopener" : void 0, onClick: onNavigate, style: {
    display: "block",
    padding: "5px 8px",
    margin: "0 -8px",
    borderRadius: 8,
    textDecoration: "none",
    outlineColor: ACCENT,
    background: current ? ACCENT_SOFT : "transparent",
    transition: "background 120ms ease"
  }, onMouseEnter: /* @__PURE__ */ __name((e) => {
    if (!current)
      e.currentTarget.style.background = ACCENT_SOFTER;
  }, "onMouseEnter"), onMouseLeave: /* @__PURE__ */ __name((e) => {
    if (!current)
      e.currentTarget.style.background = "transparent";
  }, "onMouseLeave"), children: [_jsx15("span", { style: {
    display: "block",
    fontSize: FS.sm,
    fontWeight: 500,
    lineHeight: 1.25,
    color: current ? ACCENT : CHROME.fg
  }, children: link.label }), link.hint ? _jsx15("span", { style: {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    whiteSpace: "normal",
    fontSize: FS.xs,
    lineHeight: 1.25,
    color: CHROME.fgDim
  }, children: link.hint }) : null] });
}
__name(LeafRow, "LeafRow");
function Arrow() {
  return _jsx15("svg", { width: 10, height: 10, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx15("path", { d: "M5 12h14M13 6l6 6-6 6" }) });
}
__name(Arrow, "Arrow");

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/HanzoHeader.js
var HEADER_H = 60;
function withoutProductsDup(nav, hasProducts) {
  if (!hasProducts)
    return nav;
  return nav.filter((l) => !(l.id === "products" || l.label === "Products" && /\/products\/?$/.test(l.href)));
}
__name(withoutProductsDup, "withoutProductsDup");
function resolveSurface(surface) {
  if (typeof surface !== "string")
    return surface;
  return getSurface(surface) ?? findSurfaceByHost(surface) ?? DEFAULT_SURFACE;
}
__name(resolveSurface, "resolveSurface");
function HanzoHeader({ surface, account, onAskHanzo, productsTaxonomy, currentCategoryId, currentHref, brandSlot, identitySlot, signInHref = "#", className }) {
  useShellFocusRing();
  const s = resolveSurface(surface);
  const isMobile = useIsMobile(900);
  const [meetOpen, setMeetOpen] = useState13(false);
  const [productsOpen, setProductsOpen] = useState13(false);
  const [mobileOpen, setMobileOpen] = useState13(false);
  const meetBtnRef = useRef10(null);
  const productsBtnRef = useRef10(null);
  const hasProducts = !!productsTaxonomy && productsTaxonomy.length > 0;
  const home = `https://${s.host}`;
  const localNav = withoutProductsDup(s.localNav, hasProducts);
  const accountNode = account ?? _jsx16(DefaultAccount, { href: signInHref });
  useEffect14(() => {
    if (!mobileOpen)
      return;
    const onKey = /* @__PURE__ */ __name((e) => {
      if (e.key === "Escape")
        setMobileOpen(false);
    }, "onKey");
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);
  const toggleMeet = useCallback10(() => {
    setMobileOpen(false);
    setProductsOpen(false);
    setMeetOpen((v) => !v);
  }, []);
  const toggleProducts = useCallback10(() => {
    setMobileOpen(false);
    setMeetOpen(false);
    setProductsOpen((v) => !v);
  }, []);
  return _jsxs15("header", { role: "banner", "data-hanzo-shell": "", className, style: {
    position: "sticky",
    top: 0,
    zIndex: Z.sticky,
    display: "flex",
    alignItems: "center",
    gap: 12,
    height: HEADER_H,
    padding: "0 16px",
    boxSizing: "border-box",
    borderBottom: `1px solid ${CHROME.border}`,
    background: CHROME.bg,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    color: CHROME.fg,
    fontFamily: CHROME.font
  }, children: [brandSlot ?? _jsx16("a", { href: home, "aria-label": s.brandName, style: {
    display: "inline-flex",
    alignItems: "center",
    gap: 9,
    flexShrink: 0,
    textDecoration: "none",
    color: CHROME.fg
  }, children: _jsx16(HanzoMark, { size: 22 }) }), isMobile ? _jsxs15(_Fragment8, { children: [_jsx16("div", { style: { flex: 1 } }), _jsx16(IconButton, { label: "Search", onClick: /* @__PURE__ */ __name(() => onAskHanzo?.(), "onClick"), children: _jsx16(SearchGlyph, {}) }), _jsx16(IconButton, { label: mobileOpen ? "Close menu" : "Open menu", expanded: mobileOpen, onClick: /* @__PURE__ */ __name(() => {
    setMeetOpen(false);
    setMobileOpen((v) => !v);
  }, "onClick"), children: mobileOpen ? _jsx16(CloseGlyph, {}) : _jsx16(MenuGlyph, {}) })] }) : _jsxs15(_Fragment8, { children: [_jsxs15("button", { ref: meetBtnRef, type: "button", onClick: toggleMeet, "aria-haspopup": "dialog", "aria-expanded": meetOpen, "aria-controls": meetOpen ? "hanzo-meet-menu" : void 0, style: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    flexShrink: 0,
    height: 34,
    padding: "0 10px",
    border: "none",
    borderRadius: 9,
    background: meetOpen ? CHROME.hover : "transparent",
    color: CHROME.fg,
    fontSize: FS.sm,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "background 120ms ease"
  }, onMouseEnter: /* @__PURE__ */ __name((e) => {
    if (!meetOpen)
      e.currentTarget.style.background = CHROME.hover;
  }, "onMouseEnter"), onMouseLeave: /* @__PURE__ */ __name((e) => {
    if (!meetOpen)
      e.currentTarget.style.background = "transparent";
  }, "onMouseLeave"), children: ["Meet Hanzo", _jsx16(Chevron, { open: meetOpen })] }), hasProducts ? _jsxs15("button", { ref: productsBtnRef, type: "button", onClick: toggleProducts, "aria-haspopup": "dialog", "aria-expanded": productsOpen, "aria-controls": productsOpen ? "hanzo-products-menu" : void 0, style: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    flexShrink: 0,
    height: 34,
    padding: "0 10px",
    border: "none",
    borderRadius: 9,
    background: productsOpen ? CHROME.hover : "transparent",
    color: CHROME.fg,
    fontSize: FS.sm,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "background 120ms ease"
  }, onMouseEnter: /* @__PURE__ */ __name((e) => {
    if (!productsOpen)
      e.currentTarget.style.background = CHROME.hover;
  }, "onMouseEnter"), onMouseLeave: /* @__PURE__ */ __name((e) => {
    if (!productsOpen)
      e.currentTarget.style.background = "transparent";
  }, "onMouseLeave"), children: ["Products", _jsx16(Chevron, { open: productsOpen })] }) : null, _jsx16("nav", { "aria-label": `${s.brandName} navigation`, style: { display: "flex", alignItems: "center", gap: 2, minWidth: 0 }, children: localNav.map((link) => _jsx16(NavLink, { link }, link.id)) }), _jsx16("div", { style: { flex: 1 } }), _jsx16(CTA, { link: s.secondaryCTA, variant: "ghost" }), _jsx16(CTA, { link: s.primaryCTA, variant: "filled" }), identitySlot, accountNode] }), _jsx16(MeetHanzoMenu, { id: "hanzo-meet-menu", open: meetOpen, onClose: /* @__PURE__ */ __name(() => setMeetOpen(false), "onClose"), anchor: HEADER_H, currentProductId: s.productId }), hasProducts ? _jsx16(ProductsMegaMenu, { id: "hanzo-products-menu", categories: productsTaxonomy, open: productsOpen, onClose: /* @__PURE__ */ __name(() => setProductsOpen(false), "onClose"), anchor: HEADER_H, currentCategoryId, currentHref }) : null, isMobile && mobileOpen ? _jsx16(MobileSheet, { surface: s, account: accountNode, identity: identitySlot, productsTaxonomy: hasProducts ? productsTaxonomy : void 0, currentHref, top: HEADER_H, onClose: /* @__PURE__ */ __name(() => setMobileOpen(false), "onClose"), onMeet: /* @__PURE__ */ __name(() => {
    setMobileOpen(false);
    setMeetOpen(true);
  }, "onMeet") }) : null] });
}
__name(HanzoHeader, "HanzoHeader");
function NavLink({ link }) {
  return _jsx16("a", { href: link.href, style: {
    display: "inline-flex",
    alignItems: "center",
    height: 34,
    padding: "0 10px",
    borderRadius: 9,
    textDecoration: "none",
    fontSize: FS.sm,
    fontWeight: 500,
    color: CHROME.fgMuted,
    whiteSpace: "nowrap",
    transition: "background 120ms ease, color 120ms ease"
  }, onMouseEnter: /* @__PURE__ */ __name((e) => {
    const el = e.currentTarget;
    el.style.background = CHROME.hover;
    el.style.color = CHROME.fg;
  }, "onMouseEnter"), onMouseLeave: /* @__PURE__ */ __name((e) => {
    const el = e.currentTarget;
    el.style.background = "transparent";
    el.style.color = CHROME.fgMuted;
  }, "onMouseLeave"), children: link.label });
}
__name(NavLink, "NavLink");
function CTA({ link, variant }) {
  const filled = variant === "filled";
  return _jsx16("a", { href: link.href, style: {
    display: "inline-flex",
    alignItems: "center",
    flexShrink: 0,
    height: 34,
    padding: "0 14px",
    borderRadius: 9,
    textDecoration: "none",
    fontSize: FS.sm,
    fontWeight: 600,
    whiteSpace: "nowrap",
    border: filled ? "1px solid transparent" : `1px solid ${CHROME.border}`,
    background: filled ? ACCENT : "transparent",
    color: filled ? "#0b0b0f" : CHROME.fg,
    transition: "opacity 120ms ease, background 120ms ease"
  }, onMouseEnter: /* @__PURE__ */ __name((e) => {
    const el = e.currentTarget;
    if (filled)
      el.style.opacity = "0.85";
    else
      el.style.background = CHROME.hover;
  }, "onMouseEnter"), onMouseLeave: /* @__PURE__ */ __name((e) => {
    const el = e.currentTarget;
    if (filled)
      el.style.opacity = "1";
    else
      el.style.background = "transparent";
  }, "onMouseLeave"), children: link.label });
}
__name(CTA, "CTA");
function IconButton({ label, children, onClick, expanded }) {
  return _jsx16("button", { type: "button", onClick, "aria-label": label, "aria-expanded": expanded, style: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
    flexShrink: 0,
    border: "none",
    borderRadius: 9,
    background: expanded ? CHROME.hover : "transparent",
    color: CHROME.fg,
    cursor: "pointer"
  }, children });
}
__name(IconButton, "IconButton");
function MobileSheet({ surface, account, identity, productsTaxonomy, currentHref, top, onClose, onMeet }) {
  const hasProducts = !!productsTaxonomy && productsTaxonomy.length > 0;
  const localNav = withoutProductsDup(surface.localNav, hasProducts);
  return _jsxs15(_Fragment8, { children: [_jsx16("div", { "aria-hidden": "true", onClick: onClose, style: { position: "fixed", inset: 0, top, zIndex: Z.overlay, background: "rgba(0,0,0,0.4)" } }), _jsxs15("div", { role: "dialog", "aria-label": `${surface.brandName} menu`, style: {
    position: "fixed",
    top,
    left: 0,
    right: 0,
    zIndex: Z.modal,
    maxHeight: `calc(100vh - ${top}px)`,
    overflowY: "auto",
    padding: 12,
    background: CHROME.panel,
    borderBottom: `1px solid ${CHROME.border}`,
    boxShadow: "0 24px 60px -12px rgba(0,0,0,0.7)",
    fontFamily: CHROME.font
  }, children: [_jsxs15("button", { type: "button", onClick: onMeet, style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "12px 12px",
    border: `1px solid ${CHROME.border}`,
    borderRadius: 12,
    background: "transparent",
    color: CHROME.fg,
    fontSize: FS.base,
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: "pointer",
    marginBottom: 8
  }, children: ["Meet Hanzo", _jsx16(Chevron, { open: false })] }), _jsx16("div", { style: { display: "flex", flexDirection: "column", gap: 2, marginBottom: 12 }, children: localNav.map((link) => _jsx16("a", { href: link.href, onClick: onClose, style: {
    display: "block",
    padding: "11px 12px",
    borderRadius: 10,
    textDecoration: "none",
    fontSize: FS.base,
    color: CHROME.fg
  }, children: link.label }, link.id)) }), hasProducts ? _jsx16("div", { style: { marginBottom: 12, borderTop: `1px solid ${CHROME.border}`, paddingTop: 4 }, children: productsTaxonomy.map((category) => _jsx16(MobileProductsCategory, { category, currentHref, onClose }, category.id)) }) : null, _jsxs15("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: [_jsx16(CTA, { link: surface.secondaryCTA, variant: "ghost" }), _jsx16(CTA, { link: surface.primaryCTA, variant: "filled" })] }), identity || account ? _jsxs15("div", { style: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTop: `1px solid ${CHROME.border}`
  }, children: [identity, account] }) : null] })] });
}
__name(MobileSheet, "MobileSheet");
function MobileProductsCategory({ category, currentHref, onClose }) {
  const [open, setOpen] = useState13(false);
  const panelId = `hanzo-mprod-${category.id}`;
  return _jsxs15("div", { style: { borderBottom: `1px solid ${CHROME.borderSoft}` }, children: [_jsxs15("button", { type: "button", onClick: /* @__PURE__ */ __name(() => setOpen((v) => !v), "onClick"), "aria-expanded": open, "aria-controls": open ? panelId : void 0, style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "12px",
    border: "none",
    background: "transparent",
    color: CHROME.fg,
    fontSize: FS.sm,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    fontFamily: "inherit",
    cursor: "pointer"
  }, children: [category.label, _jsx16(Chevron, { open })] }), open ? _jsxs15("div", { id: panelId, style: { paddingBottom: 6 }, children: [_jsxs15("a", { href: category.href, onClick: onClose, style: {
    display: "block",
    padding: "9px 12px",
    borderRadius: 10,
    textDecoration: "none",
    fontSize: FS.sm,
    fontWeight: 600,
    color: category.href === currentHref ? ACCENT : CHROME.fg
  }, children: ["All ", category.label] }), category.items.map((item) => _jsx16("a", { href: item.href, target: item.external ? "_blank" : void 0, rel: item.external ? "noreferrer noopener" : void 0, onClick: onClose, style: {
    display: "block",
    padding: "9px 12px",
    borderRadius: 10,
    textDecoration: "none",
    fontSize: FS.sm,
    color: item.href === currentHref ? ACCENT : CHROME.fgMuted
  }, children: item.label }, item.id))] }) : null] });
}
__name(MobileProductsCategory, "MobileProductsCategory");
function DefaultAccount({ href }) {
  return _jsx16("a", { href, style: {
    display: "inline-flex",
    alignItems: "center",
    flexShrink: 0,
    height: 34,
    padding: "0 10px",
    borderRadius: 9,
    textDecoration: "none",
    fontSize: FS.sm,
    fontWeight: 600,
    whiteSpace: "nowrap",
    color: CHROME.fg,
    transition: "background 120ms ease"
  }, onMouseEnter: /* @__PURE__ */ __name((e) => {
    ;
    e.currentTarget.style.background = CHROME.hover;
  }, "onMouseEnter"), onMouseLeave: /* @__PURE__ */ __name((e) => {
    ;
    e.currentTarget.style.background = "transparent";
  }, "onMouseLeave"), children: "Sign in" });
}
__name(DefaultAccount, "DefaultAccount");
function Chevron({ open }) {
  return _jsx16("svg", { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", style: { transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms ease" }, children: _jsx16("path", { d: "M6 9l6 6 6-6" }) });
}
__name(Chevron, "Chevron");
function SearchGlyph() {
  return _jsxs15("svg", { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx16("circle", { cx: "11", cy: "11", r: "7" }), _jsx16("path", { d: "m20 20-3.2-3.2" })] });
}
__name(SearchGlyph, "SearchGlyph");
function MenuGlyph() {
  return _jsx16("svg", { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", "aria-hidden": "true", children: _jsx16("path", { d: "M3 6h18M3 12h18M3 18h18" }) });
}
__name(MenuGlyph, "MenuGlyph");
function CloseGlyph() {
  return _jsx16("svg", { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", "aria-hidden": "true", children: _jsx16("path", { d: "M6 6l12 12M18 6L6 18" }) });
}
__name(CloseGlyph, "CloseGlyph");

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/HanzoAppHeader.js
import { jsx as _jsx17, jsxs as _jsxs16, Fragment as _Fragment9 } from "react/jsx-runtime";
import { useEffect as useEffect15, useRef as useRef11, useState as useState14 } from "react";
var HEADER_H2 = 56;
function HanzoAppHeader({ productId, mark = "logo", backHref = "..", backLabel = "Back", org, orgs, onOrgChange, project, projects, onProjectChange, search, actions = [], account, className, logoHref = "https://hanzo.ai" }) {
  useShellFocusRing();
  return _jsxs16("header", { role: "banner", "data-hanzo-shell": "", className, "data-product": productId, style: {
    position: "sticky",
    top: 0,
    zIndex: Z.sticky,
    display: "flex",
    alignItems: "center",
    gap: 10,
    height: HEADER_H2,
    padding: "0 14px",
    boxSizing: "border-box",
    borderBottom: `1px solid ${CHROME.border}`,
    background: CHROME.bg,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    color: CHROME.fg,
    fontFamily: CHROME.font
  }, children: [mark === "back" ? _jsxs16("a", { href: backHref, style: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
    height: 34,
    padding: "0 10px",
    borderRadius: 9,
    textDecoration: "none",
    fontSize: FS.sm,
    fontWeight: 600,
    color: CHROME.fg
  }, children: [_jsx17(BackArrow, {}), backLabel] }) : _jsx17("a", { href: logoHref, "aria-label": "Hanzo", style: { display: "inline-flex", flexShrink: 0, color: CHROME.fg }, children: _jsx17(HanzoMark, { size: 22 }) }), _jsxs16("div", { style: { display: "flex", alignItems: "center", gap: 2, minWidth: 0 }, children: [org ? _jsx17(Crumb, { node: org, options: orgs, onSelect: onOrgChange, label: "Organization" }) : null, org && project ? _jsx17(Sep, {}) : null, project ? _jsx17(Crumb, { node: project, options: projects, onSelect: onProjectChange, label: "Project" }) : null] }), search ? _jsx17("div", { style: { flex: 1, display: "flex", justifyContent: "center", minWidth: 0, padding: "0 8px" }, children: isSearchConfig(search) ? _jsx17(SearchField, { ...search }) : search }) : _jsx17("div", { style: { flex: 1 } }), actions.map((action, i) => _jsx17(ActionButton, { action }, `${action.label}-${i}`)), account] });
}
__name(HanzoAppHeader, "HanzoAppHeader");
function isSearchConfig(v) {
  return typeof v === "object" && v !== null && "placeholder" in v;
}
__name(isSearchConfig, "isSearchConfig");
function SearchField({ placeholder, onClick }) {
  return _jsxs16("button", { type: "button", onClick, style: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    maxWidth: 420,
    height: 34,
    padding: "0 12px",
    border: `1px solid ${CHROME.border}`,
    borderRadius: 9,
    background: "rgba(255,255,255,0.03)",
    color: CHROME.fgMuted,
    fontSize: FS.sm,
    fontFamily: "inherit",
    cursor: "pointer",
    textAlign: "left"
  }, onMouseEnter: /* @__PURE__ */ __name((e) => {
    ;
    e.currentTarget.style.background = CHROME.hover;
  }, "onMouseEnter"), onMouseLeave: /* @__PURE__ */ __name((e) => {
    ;
    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
  }, "onMouseLeave"), children: [_jsx17(SearchGlyph2, {}), _jsx17("span", { style: { flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: placeholder }), _jsx17("kbd", { style: {
    fontSize: FS.xs,
    fontFamily: "inherit",
    color: CHROME.fgDim,
    border: `1px solid ${CHROME.border}`,
    borderRadius: 5,
    padding: "1px 5px"
  }, children: "\u2318K" })] });
}
__name(SearchField, "SearchField");
function Crumb({ node, options, onSelect, label }) {
  const [open, setOpen] = useState14(false);
  const btnRef = useRef11(null);
  const menuRef = useRef11(null);
  const switchable = !!options && options.length > 0;
  useEffect15(() => {
    if (!open)
      return;
    const onDoc = /* @__PURE__ */ __name((e) => {
      if (!menuRef.current?.contains(e.target) && !btnRef.current?.contains(e.target))
        setOpen(false);
    }, "onDoc");
    const onKey = /* @__PURE__ */ __name((e) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    }, "onKey");
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const inner = _jsxs16(_Fragment9, { children: [_jsx17("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: node.label }), switchable ? _jsx17(Chevron2, { open }) : null] });
  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    maxWidth: 200,
    height: 32,
    padding: "0 9px",
    borderRadius: 8,
    border: "none",
    background: open ? CHROME.hover : "transparent",
    color: CHROME.fg,
    fontSize: FS.sm,
    fontWeight: 600,
    fontFamily: "inherit",
    textDecoration: "none",
    cursor: switchable ? "pointer" : "default"
  };
  if (!switchable) {
    return node.href ? _jsx17("a", { href: node.href, style: baseStyle, children: inner }) : _jsx17("span", { style: baseStyle, children: inner });
  }
  return _jsxs16("div", { style: { position: "relative" }, children: [_jsx17("button", { ref: btnRef, type: "button", onClick: /* @__PURE__ */ __name(() => setOpen((v) => !v), "onClick"), "aria-haspopup": "listbox", "aria-expanded": open, "aria-label": `${label}: ${node.label}`, style: baseStyle, onMouseEnter: /* @__PURE__ */ __name((e) => {
    if (!open)
      e.currentTarget.style.background = CHROME.hover;
  }, "onMouseEnter"), onMouseLeave: /* @__PURE__ */ __name((e) => {
    if (!open)
      e.currentTarget.style.background = "transparent";
  }, "onMouseLeave"), children: inner }), open ? _jsx17("div", { ref: menuRef, role: "listbox", "aria-label": label, style: {
    position: "absolute",
    top: "100%",
    left: 0,
    marginTop: 6,
    minWidth: 220,
    maxHeight: 320,
    overflowY: "auto",
    zIndex: Z.popover,
    padding: 6,
    borderRadius: 12,
    border: `1px solid ${CHROME.border}`,
    background: CHROME.panel,
    boxShadow: "0 24px 60px -16px rgba(0,0,0,0.7)"
  }, children: options.map((opt) => {
    const current = opt.id === node.id;
    return _jsxs16("button", { type: "button", role: "option", "aria-selected": current, onClick: /* @__PURE__ */ __name(() => {
      onSelect?.(opt);
      setOpen(false);
    }, "onClick"), style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      width: "100%",
      padding: "8px 10px",
      border: "none",
      borderRadius: 8,
      background: current ? ACCENT_SOFT : "transparent",
      color: current ? ACCENT : CHROME.fg,
      fontSize: FS.sm,
      fontWeight: current ? 600 : 500,
      fontFamily: "inherit",
      cursor: "pointer",
      textAlign: "left"
    }, onMouseEnter: /* @__PURE__ */ __name((e) => {
      if (!current)
        e.currentTarget.style.background = CHROME.hover;
    }, "onMouseEnter"), onMouseLeave: /* @__PURE__ */ __name((e) => {
      if (!current)
        e.currentTarget.style.background = "transparent";
    }, "onMouseLeave"), children: [_jsx17("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: opt.label }), current ? _jsx17(Check, {}) : null] }, opt.id);
  }) }) : null] });
}
__name(Crumb, "Crumb");
function ActionButton({ action }) {
  const filled = action.variant === "filled";
  const style = {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    flexShrink: 0,
    height: 34,
    padding: "0 13px",
    borderRadius: 9,
    textDecoration: "none",
    fontSize: FS.sm,
    fontWeight: 600,
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    cursor: "pointer",
    border: filled ? "1px solid transparent" : `1px solid ${CHROME.border}`,
    background: filled ? ACCENT : "transparent",
    color: filled ? "#0b0b0f" : CHROME.fg,
    transition: "opacity 120ms ease, background 120ms ease"
  };
  const hoverIn = /* @__PURE__ */ __name((el) => {
    if (filled)
      el.style.opacity = "0.85";
    else
      el.style.background = CHROME.hover;
  }, "hoverIn");
  const hoverOut = /* @__PURE__ */ __name((el) => {
    if (filled)
      el.style.opacity = "1";
    else
      el.style.background = "transparent";
  }, "hoverOut");
  const body = _jsxs16(_Fragment9, { children: [action.label, action.chevron ? _jsx17(Chevron2, { open: false }) : null] });
  return action.href ? _jsx17("a", { href: action.href, onClick: action.onClick, style, onMouseEnter: /* @__PURE__ */ __name((e) => hoverIn(e.currentTarget), "onMouseEnter"), onMouseLeave: /* @__PURE__ */ __name((e) => hoverOut(e.currentTarget), "onMouseLeave"), children: body }) : _jsx17("button", { type: "button", onClick: action.onClick, style, onMouseEnter: /* @__PURE__ */ __name((e) => hoverIn(e.currentTarget), "onMouseEnter"), onMouseLeave: /* @__PURE__ */ __name((e) => hoverOut(e.currentTarget), "onMouseLeave"), children: body });
}
__name(ActionButton, "ActionButton");
function Sep() {
  return _jsx17("span", { "aria-hidden": "true", style: { color: CHROME.fgDim, fontSize: FS.sm, padding: "0 1px" }, children: "/" });
}
__name(Sep, "Sep");
function Chevron2({ open }) {
  return _jsx17("svg", { width: 11, height: 11, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", style: { transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms ease", flexShrink: 0 }, children: _jsx17("path", { d: "M6 9l6 6 6-6" }) });
}
__name(Chevron2, "Chevron");
function BackArrow() {
  return _jsx17("svg", { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx17("path", { d: "M19 12H5M12 19l-7-7 7-7" }) });
}
__name(BackArrow, "BackArrow");
function SearchGlyph2() {
  return _jsxs16("svg", { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx17("circle", { cx: "11", cy: "11", r: "7" }), _jsx17("path", { d: "m20 20-3.2-3.2" })] });
}
__name(SearchGlyph2, "SearchGlyph");
function Check() {
  return _jsx17("svg", { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", style: { flexShrink: 0 }, children: _jsx17("path", { d: "M20 6L9 17l-5-5" }) });
}
__name(Check, "Check");

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/HanzoFooter.js
import { jsx as _jsx18, jsxs as _jsxs17 } from "react/jsx-runtime";
function HanzoFooter({ currentProductId, className }) {
  useShellFocusRing();
  return _jsx18("footer", { role: "contentinfo", "data-hanzo-shell": "", className, style: {
    borderTop: `1px solid ${CHROME.border}`,
    background: CHROME.panel,
    color: CHROME.fg,
    fontFamily: CHROME.font
  }, children: _jsxs17("div", { style: { maxWidth: 1200, margin: "0 auto", padding: "48px 24px 24px", boxSizing: "border-box" }, children: [_jsx18("div", { style: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "32px 24px"
  }, children: HANZO_FOOTER_COLUMNS.map((col) => _jsxs17("nav", { "aria-label": col.title, children: [_jsx18("div", { style: {
    fontSize: FS.xs,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: CHROME.fgDim,
    marginBottom: 14
  }, children: col.title }), _jsx18("ul", { style: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 9 }, children: col.items.map((item) => _jsx18("li", { children: _jsx18(FooterLink, { link: item, current: col.id === "products" && item.id === currentProductId }) }, item.id)) })] }, col.id)) }), _jsxs17("div", { style: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 16,
    marginTop: 40,
    paddingTop: 22,
    borderTop: `1px solid ${CHROME.border}`
  }, children: [_jsx18("a", { href: "https://hanzo.ai", "aria-label": "Hanzo", style: { color: CHROME.fg, textDecoration: "none", flexShrink: 0 }, children: _jsx18(HanzoWordmark2, { label: "Hanzo", size: 20 }) }), _jsx18("span", { style: { fontSize: FS.sm, color: CHROME.fgMuted, flexShrink: 0 }, children: HANZO_FOOTER_BOTTOM.copyright }), _jsx18("div", { style: { flex: 1 } }), _jsx18("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 }, children: HANZO_FOOTER_BOTTOM.links.map((link) => _jsx18(LegalLink, { link }, link.id)) })] })] }) });
}
__name(HanzoFooter, "HanzoFooter");
function FooterLink({ link, current }) {
  return _jsx18("a", { href: link.href, "aria-current": current ? "true" : void 0, style: {
    fontSize: FS.sm,
    textDecoration: "none",
    color: current ? ACCENT : CHROME.fgMuted,
    transition: "color 120ms ease"
  }, onMouseEnter: /* @__PURE__ */ __name((e) => {
    ;
    e.currentTarget.style.color = CHROME.fg;
  }, "onMouseEnter"), onMouseLeave: /* @__PURE__ */ __name((e) => {
    ;
    e.currentTarget.style.color = current ? ACCENT : CHROME.fgMuted;
  }, "onMouseLeave"), children: link.label });
}
__name(FooterLink, "FooterLink");
function LegalLink({ link }) {
  return _jsx18("a", { href: link.href, style: {
    fontSize: FS.sm,
    textDecoration: "none",
    color: CHROME.fgMuted,
    padding: "2px 6px",
    borderRadius: 6,
    transition: "color 120ms ease"
  }, onMouseEnter: /* @__PURE__ */ __name((e) => {
    ;
    e.currentTarget.style.color = CHROME.fg;
  }, "onMouseEnter"), onMouseLeave: /* @__PURE__ */ __name((e) => {
    ;
    e.currentTarget.style.color = CHROME.fgMuted;
  }, "onMouseLeave"), children: link.label });
}
__name(LegalLink, "LegalLink");

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/HanzoPreFooterCTA.js
import { jsx as _jsx19, jsxs as _jsxs18 } from "react/jsx-runtime";
function HanzoPreFooterCTA({ surface, className }) {
  const s = resolveSurface(surface);
  const { heading, actions } = s.preFooter;
  return _jsx19("section", { className, "aria-label": heading, style: {
    borderTop: `1px solid ${CHROME.border}`,
    background: CHROME.bg,
    color: CHROME.fg,
    fontFamily: CHROME.font
  }, children: _jsxs18("div", { style: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "56px 24px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 24,
    textAlign: "center"
  }, children: [_jsx19("h2", { style: {
    margin: 0,
    fontSize: FS["2xl"],
    fontWeight: 800,
    letterSpacing: -0.4,
    lineHeight: 1.15
  }, children: heading }), _jsx19("div", { style: { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }, children: actions.map((action, i) => _jsx19(ActionButton2, { link: action, variant: i === 0 ? "filled" : "ghost" }, action.id)) })] }) });
}
__name(HanzoPreFooterCTA, "HanzoPreFooterCTA");
function ActionButton2({ link, variant }) {
  const filled = variant === "filled";
  return _jsx19("a", { href: link.href, style: {
    display: "inline-flex",
    alignItems: "center",
    height: 42,
    padding: "0 22px",
    borderRadius: 10,
    textDecoration: "none",
    fontSize: FS.base,
    fontWeight: 600,
    whiteSpace: "nowrap",
    border: filled ? "1px solid transparent" : `1px solid ${CHROME.border}`,
    background: filled ? ACCENT : "transparent",
    color: filled ? "#0b0b0f" : CHROME.fg,
    transition: "opacity 120ms ease, background 120ms ease"
  }, onMouseEnter: /* @__PURE__ */ __name((e) => {
    const el = e.currentTarget;
    if (filled)
      el.style.opacity = "0.85";
    else
      el.style.background = CHROME.hover;
  }, "onMouseEnter"), onMouseLeave: /* @__PURE__ */ __name((e) => {
    const el = e.currentTarget;
    if (filled)
      el.style.opacity = "1";
    else
      el.style.background = "transparent";
  }, "onMouseLeave"), children: link.label });
}
__name(ActionButton2, "ActionButton");

// node_modules/.pnpm/@hanzogui+shell@7.6.3_@hanzo+iam@0.21.1_react-dom@19.2.4_react@19.2.4__react@19.2.4__re_5b950da0e137a2bbaf83e0d107a16708/node_modules/@hanzogui/shell/dist/AskHanzo.js
import { jsx as _jsx20, jsxs as _jsxs19, Fragment as _Fragment10 } from "react/jsx-runtime";
import { useCallback as useCallback11, useEffect as useEffect16, useRef as useRef12, useState as useState15 } from "react";
var DEFAULT_ENDPOINT = "https://api.hanzo.ai/v1/chat/completions";
function AskHanzo({ endpoint = DEFAULT_ENDPOINT, model = "enso", authToken, placeholder = "Ask Hanzo anything\u2026", onSubmit, trigger, greeting = "Ask about products, models, APIs, or how to get started.", className }) {
  useShellFocusRing();
  const [open, setOpen] = useState15(false);
  const [messages, setMessages] = useState15([]);
  const [draft, setDraft] = useState15("");
  const [busy, setBusy] = useState15(false);
  const [error, setError] = useState15(null);
  const inputRef = useRef12(null);
  const logRef = useRef12(null);
  const panelRef = useRef12(null);
  const restoreRef = useRef12(null);
  const openPanel = useCallback11(() => {
    restoreRef.current = document.activeElement ?? null;
    setOpen(true);
  }, []);
  const closePanel = useCallback11(() => {
    setOpen(false);
    restoreRef.current?.focus?.();
  }, []);
  useEffect16(() => {
    if (!open)
      return;
    requestAnimationFrame(() => inputRef.current?.focus());
    const onKey = /* @__PURE__ */ __name((e) => {
      if (e.key === "Escape") {
        closePanel();
        return;
      }
      if (e.key === "Tab") {
        const root = panelRef.current;
        if (!root)
          return;
        const focusables = root.querySelectorAll('a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])');
        if (focusables.length === 0)
          return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }, "onKey");
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closePanel]);
  useEffect16(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, busy]);
  const send = useCallback11(async () => {
    const text = draft.trim();
    if (!text || busy)
      return;
    setError(null);
    setDraft("");
    const history = messages;
    const next = [...history, { role: "user", content: text }];
    setMessages(next);
    setBusy(true);
    try {
      let reply;
      if (onSubmit) {
        reply = await onSubmit(text, history);
      } else {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authToken ? { Authorization: `Bearer ${authToken}` } : {}
          },
          body: JSON.stringify({ model, messages: next })
        });
        if (!res.ok)
          throw new Error(`${res.status} ${res.statusText}`);
        const data = await res.json();
        reply = data?.choices?.[0]?.message?.content ?? "(no response)";
      }
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [draft, busy, messages, onSubmit, endpoint, authToken, model]);
  return _jsxs19("span", { className, children: [trigger ? trigger(openPanel) : _jsxs19("button", { type: "button", onClick: openPanel, style: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    height: 34,
    padding: "0 13px",
    border: `1px solid ${CHROME.border}`,
    borderRadius: 9,
    background: "transparent",
    color: CHROME.fg,
    fontSize: FS.sm,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer"
  }, onMouseEnter: /* @__PURE__ */ __name((e) => {
    ;
    e.currentTarget.style.background = CHROME.hover;
  }, "onMouseEnter"), onMouseLeave: /* @__PURE__ */ __name((e) => {
    ;
    e.currentTarget.style.background = "transparent";
  }, "onMouseLeave"), children: [_jsx20(Sparkle, {}), "Ask Hanzo"] }), open ? _jsxs19(_Fragment10, { children: [_jsx20("div", { "aria-hidden": "true", onClick: closePanel, style: { position: "fixed", inset: 0, zIndex: Z.overlay, background: "rgba(0,0,0,0.45)" } }), _jsxs19("div", { ref: panelRef, role: "dialog", "aria-modal": "true", "aria-label": "Ask Hanzo", "data-hanzo-shell": "", style: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    width: "min(440px, 100vw)",
    zIndex: Z.modal,
    display: "flex",
    flexDirection: "column",
    background: CHROME.panel,
    borderLeft: `1px solid ${CHROME.border}`,
    boxShadow: "-24px 0 60px -20px rgba(0,0,0,0.7)",
    color: CHROME.fg,
    fontFamily: CHROME.font
  }, children: [_jsxs19("div", { style: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    height: 56,
    padding: "0 14px",
    borderBottom: `1px solid ${CHROME.border}`,
    flexShrink: 0
  }, children: [_jsx20(Sparkle, {}), _jsx20("strong", { style: { fontSize: FS.base, fontWeight: 700 }, children: "Ask Hanzo" }), _jsx20("div", { style: { flex: 1 } }), _jsx20("button", { type: "button", onClick: closePanel, "aria-label": "Close", style: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 34,
    height: 34,
    border: "none",
    borderRadius: 8,
    background: "transparent",
    color: CHROME.fg,
    cursor: "pointer"
  }, children: _jsx20(CloseGlyph2, {}) })] }), _jsxs19("div", { ref: logRef, "aria-live": "polite", style: { flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }, children: [messages.length === 0 ? _jsx20("p", { style: { margin: 0, fontSize: FS.sm, color: CHROME.fgMuted, lineHeight: 1.5 }, children: greeting }) : messages.map((m, i) => _jsx20(Bubble, { message: m }, i)), busy ? _jsx20("div", { style: { fontSize: FS.sm, color: CHROME.fgDim }, children: "Thinking\u2026" }) : null, error ? _jsx20("div", { style: { fontSize: FS.sm, color: CHROME.fg, background: "rgba(255,80,80,0.12)", border: "1px solid rgba(255,80,80,0.3)", borderRadius: 10, padding: "8px 10px" }, children: error }) : null] }), _jsx20("div", { style: { padding: 12, borderTop: `1px solid ${CHROME.border}`, flexShrink: 0 }, children: _jsxs19("div", { style: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
    padding: 8,
    border: `1px solid ${CHROME.border}`,
    borderRadius: 12,
    background: "rgba(255,255,255,0.03)"
  }, children: [_jsx20("textarea", { ref: inputRef, value: draft, onChange: /* @__PURE__ */ __name((e) => setDraft(e.target.value), "onChange"), onKeyDown: /* @__PURE__ */ __name((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }, "onKeyDown"), rows: 1, placeholder, style: {
    flex: 1,
    resize: "none",
    maxHeight: 140,
    border: "none",
    outline: "none",
    background: "transparent",
    color: CHROME.fg,
    fontSize: FS.sm,
    fontFamily: "inherit",
    lineHeight: 1.5
  } }), _jsx20("button", { type: "button", onClick: /* @__PURE__ */ __name(() => void send(), "onClick"), disabled: !draft.trim() || busy, "aria-label": "Send", style: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    flexShrink: 0,
    border: "none",
    borderRadius: 8,
    background: draft.trim() && !busy ? ACCENT : CHROME.hover,
    color: draft.trim() && !busy ? "#0b0b0f" : CHROME.fgDim,
    cursor: draft.trim() && !busy ? "pointer" : "default"
  }, children: _jsx20(SendGlyph, {}) })] }) })] })] }) : null] });
}
__name(AskHanzo, "AskHanzo");
function Bubble({ message }) {
  const user = message.role === "user";
  return _jsx20("div", { style: {
    alignSelf: user ? "flex-end" : "flex-start",
    maxWidth: "85%",
    padding: "9px 12px",
    borderRadius: 12,
    background: user ? ACCENT_SOFT : "rgba(255,255,255,0.04)",
    border: `1px solid ${CHROME.border}`,
    fontSize: FS.sm,
    lineHeight: 1.5,
    color: CHROME.fg,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word"
  }, children: message.content });
}
__name(Bubble, "Bubble");
function Sparkle() {
  return _jsx20("svg", { width: 16, height: 16, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true", style: { flexShrink: 0 }, children: _jsx20("path", { d: "M12 2l1.9 5.1L19 9l-5.1 1.9L12 16l-1.9-5.1L5 9l5.1-1.9L12 2zM19 15l.9 2.4L22 18l-2.1.8L19 21l-.9-2.2L16 18l2.1-.6L19 15z" }) });
}
__name(Sparkle, "Sparkle");
function SendGlyph() {
  return _jsx20("svg", { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx20("path", { d: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" }) });
}
__name(SendGlyph, "SendGlyph");
function CloseGlyph2() {
  return _jsx20("svg", { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", "aria-hidden": "true", children: _jsx20("path", { d: "M6 6l12 12M18 6L6 18" }) });
}
__name(CloseGlyph2, "CloseGlyph");
export {
  ACCENT,
  ACCENT_SOFT,
  ACCENT_SOFTER,
  ACCENT_TINT,
  APP_ENTITLEMENTS,
  AppSwitcher,
  AskHanzo,
  BeamAvatar,
  CHROME,
  DEFAULT_PLAN_TIER,
  DEFAULT_SURFACE,
  DEFAULT_TENANT_APPS,
  FREE_TIER,
  FS,
  HANZO_APPS,
  HANZO_FLAGSHIP,
  HANZO_FOOTER_BOTTOM,
  HANZO_FOOTER_COLUMNS,
  HANZO_PLANS,
  HANZO_PLAN_TIERS,
  HANZO_PRODUCTS,
  HANZO_PRODUCT_CATEGORIES,
  HANZO_SURFACES,
  HanzoAccessGate,
  HanzoAppBar,
  HanzoAppHeader,
  HanzoAppLauncher,
  HanzoFooter,
  HanzoGridIcon,
  HanzoHeader,
  HanzoMark,
  HanzoPlans,
  HanzoPreFooterCTA,
  HanzoWordmark2 as HanzoWordmark,
  MEET_HANZO_GROUPS,
  MeetHanzoMenu,
  ORG_DOMAINS,
  PRODUCT_BOUNDARIES,
  ProductsMegaMenu,
  TenantCommandPalette,
  TenantHeader,
  TenantMark,
  U,
  UNLIMITED,
  UserAvatar,
  UserOrgDropdown,
  Z,
  entitlementFor,
  findHanzoApp,
  findSurfaceByHost,
  getAppsForOrg,
  getHanzoApps,
  getPlanTier,
  getSurface,
  isEntitled,
  normalizeTier,
  productCategorySlug,
  rankOf,
  requiredTier,
  resolveSurface,
  useEntitlement,
  useIsMobile,
  useMediaQuery,
  useTenantAuth
};
