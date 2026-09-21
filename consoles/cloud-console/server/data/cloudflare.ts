// ============ Cloudflare Mock Data (mutable state) ============

export interface CFZone {
  id: string
  name: string
  status: string
  plan: string
  nameServers: string[]
  createdAt: string
}

export interface CFDNSRecord {
  id: string
  zoneName: string
  name: string
  type: string
  content: string
  ttl: number
  proxied: boolean
}

export interface CFSecurityRule {
  id: string
  description: string
  expression: string
  action: string
  enabled: boolean
  zoneName: string
  createdAt: string
}

export interface CFCacheRule {
  id: string
  zoneName: string
  rule: string
  target: string
  status: 'active' | 'disabled'
  ttl: number
  createdAt: string
}

export interface CFSSLConfig {
  mode: string
  minTlsVersion: string
  automaticHttpsRewrites: boolean
  alwaysUseHttps: boolean
}

// ---- Zones ----
export const cfZones: CFZone[] = [
  { id: 'zone-001', name: 'example.com', status: 'active', plan: 'Pro', nameServers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'], createdAt: '2023-06-15' },
  { id: 'zone-002', name: 'myapp.io', status: 'active', plan: 'Business', nameServers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'], createdAt: '2023-09-01' },
  { id: 'zone-003', name: 'staging.dev', status: 'active', plan: 'Free', nameServers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'], createdAt: '2024-01-10' },
  { id: 'zone-004', name: 'api-service.com', status: 'active', plan: 'Pro', nameServers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'], createdAt: '2024-03-22' },
  { id: 'zone-005', name: 'cdn-assets.net', status: 'active', plan: 'Enterprise', nameServers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'], createdAt: '2023-11-05' },
  { id: 'zone-006', name: 'blog.example.com', status: 'pending', plan: 'Free', nameServers: [], createdAt: '2025-01-01' },
]

// ---- DNS Records ----
export const cfDNSRecords: CFDNSRecord[] = [
  { id: 'dns-001', zoneName: 'example.com', name: 'example.com', type: 'A', content: '104.21.45.12', ttl: 1, proxied: true },
  { id: 'dns-002', zoneName: 'example.com', name: 'www.example.com', type: 'CNAME', content: 'example.com', ttl: 1, proxied: true },
  { id: 'dns-003', zoneName: 'example.com', name: 'api.example.com', type: 'A', content: '203.0.113.50', ttl: 300, proxied: true },
  { id: 'dns-004', zoneName: 'example.com', name: 'mail.example.com', type: 'MX', content: 'mail.example.com', ttl: 3600, proxied: false },
  { id: 'dns-005', zoneName: 'example.com', name: 'example.com', type: 'TXT', content: 'v=spf1 include:_spf.google.com ~all', ttl: 3600, proxied: false },
  { id: 'dns-006', zoneName: 'myapp.io', name: 'myapp.io', type: 'A', content: '198.51.100.23', ttl: 1, proxied: true },
  { id: 'dns-007', zoneName: 'myapp.io', name: '*.myapp.io', type: 'A', content: '198.51.100.23', ttl: 1, proxied: true },
  { id: 'dns-008', zoneName: 'myapp.io', name: 'db.myapp.io', type: 'A', content: '10.0.1.15', ttl: 300, proxied: false },
  { id: 'dns-009', zoneName: 'staging.dev', name: 'staging.dev', type: 'A', content: '192.0.2.44', ttl: 1, proxied: true },
  { id: 'dns-010', zoneName: 'staging.dev', name: 'app.staging.dev', type: 'CNAME', content: 'staging.dev', ttl: 1, proxied: true },
  { id: 'dns-011', zoneName: 'api-service.com', name: 'api-service.com', type: 'A', content: '203.0.113.80', ttl: 1, proxied: true },
  { id: 'dns-012', zoneName: 'api-service.com', name: 'v2.api-service.com', type: 'A', content: '203.0.113.81', ttl: 300, proxied: true },
  { id: 'dns-013', zoneName: 'cdn-assets.net', name: 'cdn-assets.net', type: 'A', content: '104.21.90.1', ttl: 1, proxied: true },
  { id: 'dns-014', zoneName: 'cdn-assets.net', name: 'static.cdn-assets.net', type: 'CNAME', content: 'cdn-assets.net', ttl: 1, proxied: true },
  { id: 'dns-015', zoneName: 'example.com', name: 'example.com', type: 'AAAA', content: '2606:4700:3030::6815:2d0c', ttl: 1, proxied: true },
]

// ---- Security Rules ----
export const cfSecurityRules: CFSecurityRule[] = [
  { id: 'rule-001', description: 'Block known bots', expression: '(cf.bot_management.score lt 30)', action: 'block', enabled: true, zoneName: 'example.com', createdAt: '2024-06-01' },
  { id: 'rule-002', description: 'Rate limit login', expression: '(http.request.uri.path eq "/api/login")', action: 'challenge', enabled: true, zoneName: 'example.com', createdAt: '2024-06-15' },
  { id: 'rule-003', description: 'Block non-US traffic', expression: '(ip.geoip.country ne "US")', action: 'block', enabled: false, zoneName: 'myapp.io', createdAt: '2024-07-01' },
  { id: 'rule-004', description: 'Challenge suspicious UA', expression: '(http.user_agent contains "curl")', action: 'challenge', enabled: true, zoneName: 'myapp.io', createdAt: '2024-08-10' },
  { id: 'rule-005', description: 'Block SQL injection attempts', expression: '(cf.waf.score lt 20)', action: 'block', enabled: true, zoneName: 'api-service.com', createdAt: '2024-09-01' },
  { id: 'rule-006', description: 'Allow admin IPs only', expression: '(not ip.src in {10.0.0.0/8})', action: 'block', enabled: true, zoneName: 'staging.dev', createdAt: '2024-09-15' },
  { id: 'rule-007', description: 'Block credential stuffing', expression: '(http.request.uri.path contains "/login" and cf.threat_score gt 50)', action: 'js_challenge', enabled: true, zoneName: 'example.com', createdAt: '2024-10-01' },
  { id: 'rule-008', description: 'Allow internal API', expression: '(ip.src in {10.0.0.0/8} and http.request.uri.path contains "/internal")', action: 'allow', enabled: true, zoneName: 'api-service.com', createdAt: '2024-10-15' },
]

// ---- Cache Rules ----
export const cfCacheRules: CFCacheRule[] = [
  { id: 'cache-001', zoneName: 'example.com', rule: 'Cache Everything', target: '/*', status: 'active', ttl: 3600, createdAt: '2024-01-15' },
  { id: 'cache-002', zoneName: 'example.com', rule: 'Bypass Cache for Admin', target: '/admin/*', status: 'active', ttl: 0, createdAt: '2024-01-15' },
  { id: 'cache-003', zoneName: 'myapp.io', rule: 'Cache Static Assets', target: '*.css, *.js, *.png', status: 'active', ttl: 86400, createdAt: '2024-02-01' },
  { id: 'cache-004', zoneName: 'myapp.io', rule: 'Edge Cache TTL', target: '/*', status: 'active', ttl: 7200, createdAt: '2024-02-10' },
  { id: 'cache-005', zoneName: 'cdn-assets.net', rule: 'Cache Everything', target: '/*', status: 'active', ttl: 2592000, createdAt: '2024-03-01' },
  { id: 'cache-006', zoneName: 'api-service.com', rule: 'Bypass Cache for API', target: '/api/*', status: 'active', ttl: 0, createdAt: '2024-03-15' },
  { id: 'cache-007', zoneName: 'staging.dev', rule: 'Development Bypass', target: '/*', status: 'disabled', ttl: 0, createdAt: '2024-04-01' },
]

// ---- SSL Config ----
export let cfSSLConfig: CFSSLConfig = {
  mode: 'Full',
  minTlsVersion: '1.2',
  automaticHttpsRewrites: true,
  alwaysUseHttps: true,
}

// ---- ID Counters ----
let _dnsCounter = 16
let _zoneCounter = 7
let _ruleCounter = 9
let _cacheCounter = 8

export function nextDnsId() { return `dns-${String(_dnsCounter++).padStart(3, '0')}` }
export function nextZoneId() { return `zone-${String(_zoneCounter++).padStart(3, '0')}` }
export function nextRuleId() { return `rule-${String(_ruleCounter++).padStart(3, '0')}` }
export function nextCacheId() { return `cache-${String(_cacheCounter++).padStart(3, '0')}` }
