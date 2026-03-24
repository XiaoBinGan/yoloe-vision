import { Activity, Wifi, WifiOff } from 'lucide-react'
import { useStore } from '../store/useStore'

export default function Header() {
  const { modelStatus } = useStore()

  const statusConfig = {
    checking: { label: '检测中', color: '#f59e0b', icon: Activity },
    online: { label: '在线', color: '#10b981', icon: Wifi },
    offline: { label: '离线', color: '#ef4444', icon: WifiOff },
  }

  const { label, color, icon: Icon } = statusConfig[modelStatus] || statusConfig.checking

  return (
    <header className="sticky top-0 z-50 bg-bg-base/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-sm">Y</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-bg-base" style={{ backgroundColor: color }} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 leading-tight">YOLOE Vision</h1>
            <p className="text-[10px] text-slate-500 leading-tight">开放词汇目标检测平台</p>
          </div>
        </div>

        {/* 中间标题 */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
          <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-mono border border-primary/20">
            YOLOE-26
          </span>
          <span>实时 · 零样本 · 开放词汇</span>
        </div>

        {/* 模型状态 */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center gap-1.5">
            {modelStatus === 'checking' && (
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
            )}
            {modelStatus === 'online' && (
              <div className="relative w-1.5 h-1.5">
                <div className="absolute inset-0 rounded-full animate-ping opacity-75" style={{ backgroundColor: color, animationDuration: '2s' }} />
                <div className="relative w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              </div>
            )}
            <Icon size={12} style={{ color }} />
            <span className="text-xs font-medium" style={{ color }}>{label}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
