import { onMounted, onActivated, watch } from 'vue'
import { useRoute } from '#imports'

/**
 * 在 onMounted + onActivated + 路由变化时执行回调
 * 解决 Nuxt KeepAlive 导致页面切换后数据不刷新的问题
 */
export function usePageRefresh(callback: () => void) {
  const route = useRoute()
  let initialized = false

  onMounted(() => {
    initialized = true
    callback()
  })

  onActivated(() => {
    if (initialized) callback()
  })

  // Fallback: 监听路由变化，确保页面切换时刷新
  watch(() => route.fullPath, () => {
    if (initialized) callback()
  })
}
