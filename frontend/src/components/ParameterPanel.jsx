import { SlidersHorizontal } from 'lucide-react'
import { useStore } from '../store/useStore'

function Slider({ label, value, min = 0, max = 1, step = 0.01, onChange }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <label className="text-xs text-slate-400">{label}</label>
        <span className="text-xs font-mono text-primary">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-bg-base rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3.5
          [&::-webkit-slider-thumb]:h-3.5
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-primary
          [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(16,185,129,0.5)]
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:transition-transform
          [&::-webkit-slider-thumb]:hover:scale-110
        "
        style={{ accentColor: '#10b981' }}
      />
    </div>
  )
}

export default function ParameterPanel() {
  const { confThreshold, iouThreshold, setConfThreshold, setIouThreshold } = useStore()

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <SlidersHorizontal size={13} className="text-slate-500" />
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">参数调节</label>
      </div>
      <div className="bg-bg-surface border border-border rounded-xl p-3.5 space-y-4">
        <Slider
          label="置信度阈值"
          value={confThreshold}
          min={0}
          max={1}
          step={0.01}
          onChange={setConfThreshold}
        />
        <Slider
          label="IoU 阈值"
          value={iouThreshold}
          min={0}
          max={1}
          step={0.01}
          onChange={setIouThreshold}
        />
      </div>
    </div>
  )
}
