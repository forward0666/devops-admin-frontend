import { useLocalStorage } from '@vueuse/core'

export interface CfAccount {
  id: string
  name: string
  apiKey: string
  description: string
  tags: string[] // dns, zone, firewall, ssl, cache
  createdAt: string
}

const accounts = useLocalStorage<CfAccount[]>('cf_accounts', [])

export function useCfAccounts() {
  function add(account: Omit<CfAccount, 'id' | 'createdAt'>) {
    accounts.value.push({
      ...account,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      createdAt: new Date().toISOString(),
    })
  }

  function update(id: string, data: Partial<CfAccount>) {
    const idx = accounts.value.findIndex(a => a.id === id)
    if (idx !== -1) accounts.value[idx] = { ...accounts.value[idx], ...data }
  }

  function remove(id: string) {
    accounts.value = accounts.value.filter(a => a.id !== id)
  }

  function getByTag(tag: string) {
    return accounts.value.filter(a => a.tags.includes(tag))
  }

  function getById(id: string) {
    return accounts.value.find(a => a.id === id)
  }

  function maskKey(key: string) {
    if (key.length <= 8) return '••••••••'
    return key.slice(0, 4) + '••••••••' + key.slice(-4)
  }

  return { accounts, add, update, remove, getByTag, getById, maskKey }
}

export interface CfDnsRecord {
  id: string
  type: string
  name: string
  content: string
  proxied: boolean
  ttl: number
  zoneId: string
}

export interface CfZone {
  id: string
  name: string
  status: string
  plan: string
  nameServers: string[]
  sslMode: string
  accountId: string
}

export interface CfFirewallRule {
  id: string
  name: string
  expression: string
  action: string
  priority: number
  status: string
  zoneId: string
}

export interface CfCacheLog {
  id: string
  zoneId: string
  type: string
  target: string
  timestamp: string
}

const dnsRecords = useLocalStorage<CfDnsRecord[]>('cf_dns_records', [])
const zones = useLocalStorage<CfZone[]>('cf_zones', [])
const firewallRules = useLocalStorage<CfFirewallRule[]>('cf_firewall_rules', [])
const cacheLogs = useLocalStorage<CfCacheLog[]>('cf_cache_logs', [])

export function useCfData() {
  return { dnsRecords, zones, firewallRules, cacheLogs }
}

export const TAG_COLORS: Record<string, string> = {
  dns: 'info',
  zone: 'success',
  firewall: 'error',
  ssl: 'warning',
  cache: 'secondary',
}

export const TAG_LABELS: Record<string, string> = {
  dns: 'DNS',
  zone: 'Zone',
  firewall: 'Firewall',
  ssl: 'SSL',
  cache: 'Cache',
}

export const DNS_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA', 'PTR']
export const FIREWALL_ACTIONS = ['block', 'allow', 'challenge', 'skip']
export const SSL_MODES = ['off', 'flexible', 'full', 'full_strict']
