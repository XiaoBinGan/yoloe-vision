import { useState } from 'react'
import { Eye, Download, Layers, Box, Image as ImageIcon } from 'lucide-react'
import { useStore } from '../store/useStore'

const PALETTE = [
  '#ff5722', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7',
  '#ec4899', '#14b8a6', '#f97316', '#7c3aed', '#0ea5e9',
  '#22c55e', '#ef4444', '#a16207', '#06b6d4', '#d946ef',
]

function StatCard({ label, value, color }) {
  return (
    <div className="bg-bg-surface border border-border rounded-xl p-3 text-center">
      <p className="text-xl font-bold font-mono" style={{ color }}>{value}</p>
      <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}

export default function ResultPanel() {
  const { resultImage, detections, stats, isLoading, loadingProgress, loadingMessage } = useStore()
  const [viewMode, setViewMode] = useState('overlay') // overlay | mask | box | original

  const handleDownload = () => {
    if (!resultImage) return
    const link = document.createElement('a')
    link.href = `data:image/jpeg;base64,${resultImage}`
    link.download = `yoloe_detection_${Date.now()}.jpg`
    link.click()
  }

  if (isLoading) {
    return (
      <div className="bg-bg-surface border border-border rounded-xl p-8 flex flex-col items-center justify-center min-h-80 gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <div
            className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent"
            style={{
              animation: 'spin 1s linear infinite',
              transform: 'rotate(0deg)',
            }}
          />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-200">AI 正在检测中...</p>
          <p className="text-xs text-slate-500 mt-1">{loadingMessage || '模型推理中'}</p>
        </div>
        <div className="w-48 h-1.5 bg-bg-base rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!resultImage) {
    return (
      <div className="bg-bg-surface border border-border rounded-xl p-8 flex flex-col items-center justify-center min-h-80 gap-3 text-center">
        <div className="w-14 h-14 rounded-full bg-bg-card flex items-center justify-center">
          <Eye size={24} className="text-slate-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-400">等待检测结果</p>
          <p className="text-xs text-slate-600 mt-1">上传图片并选择模式后开始检测</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="检测数量" value={stats.total_objects} color="#10b981" />
          <StatCard label="类别数" value={Object.keys(stats.classes).length} color="#3b82f6" />
          <StatCard label="推理耗时" value={`${stats.inference_time_ms}ms`} color="#f59e0b" />
        </div>
      )}

      {/* 图片展示区 */}
      <div className="bg-bg-surface border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className="text-xs text-slate-400">检测结果</span>
          <div className="flex gap-1">
            {[
              { id: 'overlay', icon: Layers, label: '叠加' },
              { id: 'original', icon: ImageIcon, label: '原图' },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-colors ${
                  viewMode === id ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon size={11} /> {label}
              </button>
            ))}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-slate-500 hover:text-primary transition-colors"
            >
              <Download size={11} /> 导出
            </button>
          </div>
        </div>

        <div className="relative bg-bg-base" style={{ maxHeight: '480px' }}>
          {viewMode === 'overlay' ? (
            <img
              src={`data:image/jpeg;base64,${resultImage}`}
              alt="检测结果"
              className="w-full object-contain"
              style={{ maxHeight: '480px' }}
            />
          ) : (
            <div className="flex items-center justify-center min-h-48 text-slate-600 text-sm gap-2">
              <ImageIcon size={16} />
              原图模式（显示上传原始图片）
            </div>
          )}
        </div>
      </div>

      {/* 类别统计 */}
      {stats && Object.keys(stats.classes).length > 0 && (
        <div className="bg-bg-surface border border-border rounded-xl p-3">
          <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
            <Box size={12} /> 检测类别统计
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(stats.classes).map(([cls, count], i) => (
              <span
                key={cls}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border"
                style={{
                  borderColor: PALETTE[i % PALETTE.length] + '40',
                  color: PALETTE[i % PALETTE.length],
                  backgroundColor: PALETTE[i % PALETTE.length] + '10',
                }}
              >
                <span className="font-mono font-bold">{count}</span>
                <span>{cls}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 检测列表 */}
      {detections && detections.length > 0 && (
        <details className="bg-bg-surface border border-border rounded-xl">
          <summary className="px-3 py-2 text-xs text-slate-400 cursor-pointer hover:text-slate-300">
            详细列表 ({detections.length} 项)
          </summary>
          <div className="border-t border-border max-h-48 overflow-y-auto">
            {detections.map((det, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 border-b border-border/50 last:border-0">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                />
                <span className="text-xs text-slate-300 font-medium flex-1">{det.class_name}</span>
                <span className="text-xs font-mono text-slate-500">{det.confidence.toFixed(3)}</span>
                <span className="text-[10px] text-slate-600 font-mono">
                  [{det.bbox.slice(0, 2).map(v => Math.round(v)).join(',')}]
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
