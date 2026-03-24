import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
})

// 健康检查
export const healthCheck = () => api.get('/health')

// 获取内置类别
export const getClasses = () => api.get('/classes')

// 图片检测
export const detectImage = (formData) => api.post('/detect/image', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 120000,
})

// 视频检测
export const detectVideo = (formData) => api.post('/detect/video', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 120000,
})

export default api
