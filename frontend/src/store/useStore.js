import { create } from 'zustand'

const HISTORY_KEY = 'yoloe_history'

const loadHistory = () => {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const saveHistory = (items) => {
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 10)))
  } catch {}
}

export const useStore = create((set, get) => ({
  // 上传文件
  uploadedFile: null,
  uploadedFileUrl: null,
  fileType: null, // 'image' | 'video'

  // 检测模式
  mode: 'none', // 'text' | 'visual' | 'none'

  // 文本提示
  textPrompt: '',

  // 参考图
  referenceImage: null,
  referenceImageUrl: null,

  // 参数
  confThreshold: 0.25,
  iouThreshold: 0.45,

  // 结果
  resultImage: null,
  detections: [],
  stats: null,

  // 状态
  isLoading: false,
  loadingProgress: 0,
  loadingMessage: '',
  error: null,

  // 历史
  history: loadHistory(),

  // Model status
  modelStatus: 'checking', // 'checking' | 'online' | 'offline'

  // Actions
  setUploadedFile: (file, url, type) => set({ uploadedFile: file, uploadedFileUrl: url, fileType: type, resultImage: null, detections: [], stats: null, error: null }),

  setMode: (mode) => set({ mode }),

  setTextPrompt: (text) => set({ textPrompt: text }),

  setReferenceImage: (file, url) => set({ referenceImage: file, referenceImageUrl: url }),

  setConfThreshold: (v) => set({ confThreshold: v }),

  setIouThreshold: (v) => set({ iouThreshold: v }),

  setLoading: (isLoading, progress = 0, message = '') => set({ isLoading, loadingProgress: progress, loadingMessage: message }),

  setError: (error) => set({ error, isLoading: false }),

  setResult: (resultImage, detections, stats) => {
    const historyItem = {
      id: Date.now(),
      fileName: get().uploadedFile?.name || 'unknown',
      mode: get().mode,
      textPrompt: get().textPrompt,
      resultImage,
      detections,
      stats,
      timestamp: new Date().toISOString(),
    }
    const newHistory = [historyItem, ...get().history].slice(0, 10)
    saveHistory(newHistory)
    set({ resultImage, detections, stats, history: newHistory, isLoading: false, loadingProgress: 100 })
  },

  setModelStatus: (status) => set({ modelStatus: status }),

  loadFromHistory: (item) => set({
    resultImage: item.resultImage,
    detections: item.detections,
    stats: item.stats,
  }),

  reset: () => set({
    uploadedFile: null,
    uploadedFileUrl: null,
    fileType: null,
    resultImage: null,
    detections: [],
    stats: null,
    error: null,
    isLoading: false,
  }),
}))
