import { Type, Image, List } from 'lucide-react'
import { useStore } from '../store/useStore'

const modes = [
  {
    id: 'none',
    label: '无提示',
    sublabel: '内部词表',
    icon: List,
    desc: '使用内置 1200+ 类别自动检测',
  },
  {
    id: 'text',
    label: '文本提示',
    sublabel: 'Text Prompt',
    icon: Type,
    desc: '输入类别名称，语义检测任意物体',
  },
  {
    id: 'visual',
    label: '图像参考',
    sublabel: 'Visual Prompt',
    icon: Image,
    desc: '上传参考图，检测相似物体',
  },
]

export default function ModeSelector() {
  const { mode, setMode } = useStore()

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">检测模式</label>
      <div className="grid grid-cols-3 gap-2">
        {modes.map(({ id, label, sublabel, icon: Icon, desc }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`
              relative p-3 rounded-xl border text-left transition-all group
              ${mode === id
                ? 'border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(16,185,129,0.3)]'
                : 'border-border bg-bg-surface hover:border-border-light hover:bg-bg-hover'
              }
            `}
          >
            {mode === id && (
              <div className="absolute -top-px -right-px w-2.5 h-2.5 bg-primary rounded-bl-lg rounded-tr-xl" />
            )}
            <Icon size={15} className={`mb-1.5 ${mode === id ? 'text-primary' : 'text-slate-500 group-hover:text-slate-300'}`} />
            <p className={`text-xs font-semibold ${mode === id ? 'text-primary' : 'text-slate-200'}`}>{label}</p>
            <p className="text-[10px] text-slate-500 font-mono">{sublabel}</p>
            <p className="text-[10px] text-slate-600 mt-1 leading-tight hidden group-hover:block">{desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
