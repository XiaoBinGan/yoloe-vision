import { useEffect, useRef } from 'react'
import { Zap, Clock, AlertCircle, ChevronRight } from 'lucide-react'
import Header from './components/Header'
import UploadZone from './components/UploadZone'
import ModeSelector from './components/ModeSelector'
import TextPromptInput from './components/TextPromptInput'
import ParameterPanel from './components/ParameterPanel'
import ResultPanel from './components/ResultPanel'
import { useStore } from './store/useStore'
import { healthCheck, detectImage, detectVideo } from './api/client'

const MODE_LABELS = { none: '无提示', text: '文本提示', visual: '图像参考' }

export default function App() {
  const {
    uploadedFile, fileType, mode, textPrompt, referenceImage,
    confThreshold, iouThreshold, isLoading, error, setLoading, setError, setResult,
    setModelStatus, history, loadFromHistory,
  } = useStore()

  // 健康检查
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await healthCheck()
        setModelStatus(res.data.model_loaded ? 'online' : 'checking')
      } catch {
        setModelStatus('offline')
      }
    }
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [setModelStatus])

  const handleDetect = async () => {
    if (!uploadedFile) {
      setError('请先上传图片或视频')
      return
    }
    if (mode === 'text' && !textPrompt.trim()) {
      setError('文本提示模式需要输入提示词')
      return
    }

    setLoading(true, 10, '正在准备数据...')

    const formData = new FormData()
    formData.append('file', uploadedFile)
    formData.append('mode', mode)
    formData.append('conf_threshold', confThreshold)
    formData.append('iou_threshold', iouThreshold)
    if (mode === 'text') {
      formData.append('text_prompt', textPrompt)
    }
    if (mode === 'visual' && referenceImage) {
      formData.append('reference_image', referenceImage)
    }

    try {
      setLoading(true, 30, '正在发送图片到服务器...')
      const apiCall = fileType === 'video' ? detectVideo : detectImage
      const res = await apiCall(formData)

      setLoading(true, 80, '正在渲染检测结果...')

      if (res.data.success) {
        setTimeout(() => {
          setResult(res.data.result_image, res.data.detections, res.data.stats)
        }, 200)
      } else {
        setError(res.data.error || '检测失败，请重试')
      }
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || err.message || '网络错误，请检查后端服务')
    }
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* 左侧控制面板 */}
          <div className="lg:col-span-2 space-y-4">

            {/* 上传区 */}
            <UploadZone />

            {/* 检测模式 */}
            <ModeSelector />

            {/* 提示输入 */}
            <TextPromptInput />

            {/* 参数调节 */}
            <ParameterPanel />

            {/* 检测按钮 */}
            <button
              onClick={handleDetect}
              disabled={isLoading || !uploadedFile}
              className={`
                w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2
                transition-all disabled:opacity-40 disabled:cursor-not-allowed
                ${!uploadedFile || isLoading
                  ? 'bg-bg-card text-slate-500 border border-border'
                  : 'bg-primary hover:bg-primary-light text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-[0.98]'
                }
              `}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  检测中...
                </>
              ) : (
                <>
                  <Zap size={16} />
                  开始检测
                </>
              )}
            </button>

            {/* 错误提示 */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* 历史记录 */}
            {history.length > 0 && (
              <div className="bg-bg-surface border border-border rounded-xl overflow-hidden">
                <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
                  <Clock size={12} className="text-slate-500" />
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">历史记录</label>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-bg-hover transition-colors border-b border-border/30 last:border-0 text-left"
                    >
                      <img
                        src={`data:image/jpeg;base64,${item.resultImage}`}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover bg-bg-base flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-200 truncate">{item.fileName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            {MODE_LABELS[item.mode]}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {item.stats?.total_objects || 0} 个对象
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={13} className="text-slate-600" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 右侧结果区 */}
          <div className="lg:col-span-3">
            <ResultPanel />
          </div>

        </div>
      </main>

      {/* 底部信息 */}
      <footer className="border-t border-border mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs text-slate-600">
          <span>Powered by <span className="text-primary">YOLOE-26</span> · Ultralytics</span>
          <span>开放词汇实时目标检测 & 实例分割</span>
        </div>
      </footer>
    </div>
  )
}
