import apiClient from '~/services/api'

const CF_GATEWAY = '/cloudflare'
const CF_SECRET = 'u8m3xB7aVm92NdLtGjPQwf6eKzLY1tbW'

function cfHeaders(apiToken: string) {
  return {
    'X-Encrypted-Data': CF_SECRET,
    'X-Cf-Token': apiToken,
  }
}

export const cfApi = {
  // Zones
  async listZones(apiToken: string) {
    const { data } = await apiClient.get(`${CF_GATEWAY}/zones`, { headers: cfHeaders(apiToken) })
    return data
  },

  // DNS
  async listDns(apiToken: string, zoneId: string) {
    const { data } = await apiClient.get(`${CF_GATEWAY}/zones/${zoneId}/dns`, { headers: cfHeaders(apiToken) })
    return data
  },

  async createDns(apiToken: string, zoneId: string, body: Record<string, any>) {
    const { data } = await apiClient.post(`${CF_GATEWAY}/zones/${zoneId}/dns`, body, { headers: cfHeaders(apiToken) })
    return data
  },

  async updateDns(apiToken: string, zoneId: string, recordId: string, body: Record<string, any>) {
    const { data } = await apiClient.put(`${CF_GATEWAY}/zones/${zoneId}/dns/${recordId}`, body, { headers: cfHeaders(apiToken) })
    return data
  },

  async deleteDns(apiToken: string, zoneId: string, recordId: string) {
    const { data } = await apiClient.delete(`${CF_GATEWAY}/zones/${zoneId}/dns/${recordId}`, { headers: cfHeaders(apiToken) })
    return data
  },

  // Firewall
  async listFirewallRules(apiToken: string, zoneId: string) {
    const { data } = await apiClient.get(`${CF_GATEWAY}/zones/${zoneId}/firewall/rules`, { headers: cfHeaders(apiToken) })
    return data
  },

  async createFirewallRule(apiToken: string, zoneId: string, body: Record<string, any>) {
    const { data } = await apiClient.post(`${CF_GATEWAY}/zones/${zoneId}/firewall/rules`, body, { headers: cfHeaders(apiToken) })
    return data
  },

  async updateFirewallRule(apiToken: string, zoneId: string, ruleId: string, body: Record<string, any>) {
    const { data } = await apiClient.put(`${CF_GATEWAY}/zones/${zoneId}/firewall/rules/${ruleId}`, body, { headers: cfHeaders(apiToken) })
    return data
  },

  async deleteFirewallRule(apiToken: string, zoneId: string, ruleId: string) {
    const { data } = await apiClient.delete(`${CF_GATEWAY}/zones/${zoneId}/firewall/rules/${ruleId}`, { headers: cfHeaders(apiToken) })
    return data
  },

  // SSL
  async getSsl(apiToken: string, zoneId: string) {
    const { data } = await apiClient.get(`${CF_GATEWAY}/zones/${zoneId}/ssl`, { headers: cfHeaders(apiToken) })
    return data
  },

  async updateSsl(apiToken: string, zoneId: string, value: string) {
    const { data } = await apiClient.patch(`${CF_GATEWAY}/zones/${zoneId}/ssl`, { value }, { headers: cfHeaders(apiToken) })
    return data
  },

  // Cache
  async purgeAll(apiToken: string, zoneId: string) {
    const { data } = await apiClient.post(`${CF_GATEWAY}/zones/${zoneId}/cache/purge`, {}, { headers: cfHeaders(apiToken) })
    return data
  },

  async purgeUrls(apiToken: string, zoneId: string, files: string[]) {
    const { data } = await apiClient.post(`${CF_GATEWAY}/zones/${zoneId}/cache/purge/urls`, { files }, { headers: cfHeaders(apiToken) })
    return data
  },

  async purgeTags(apiToken: string, zoneId: string, tags: string[]) {
    const { data } = await apiClient.post(`${CF_GATEWAY}/zones/${zoneId}/cache/purge/tags`, { tags }, { headers: cfHeaders(apiToken) })
    return data
  },

  async purgeHosts(apiToken: string, zoneId: string, hosts: string[]) {
    const { data } = await apiClient.post(`${CF_GATEWAY}/zones/${zoneId}/cache/purge/hosts`, { hosts }, { headers: cfHeaders(apiToken) })
    return data
  },
}
