import { useState, useRef } from 'react'
import { Image, X } from 'lucide-react'
import { useStore } from '../store/useStore'

export default function TextPromptInput() {
  const { mode, textPrompt, setTextPrompt, referenceImage, referenceImageUrl, setReferenceImage } = useStore()
  const inputRef = useRef()

  if (mode === 'none') return null

  if (mode === 'text') {
    return (
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          文本提示词 <span className="text-slate-600 normal-case">(用逗号分隔)</span>
        </label>
        <textarea
          ref={inputRef}
          value={textPrompt}
          onChange={(e) => setTextPrompt(e.target.value)}
          placeholder="例如: person, car, traffic light, dog, backpack"
          rows={3}
          className="w-full bg-bg-base border border-border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 resize-none transition-colors font-mono"
        />
        <div className="flex flex-wrap gap-1.5">
          {['person, car, dog', 'traffic light, stop sign', 'laptop, phone, book', 'food, pizza, burger'].map((phrase) => (
            <button
              key={phrase}
              onClick={() => setTextPrompt(phrase)}
              className="text-[11px] px-2 py-0.5 rounded-md bg-bg-card border border-border text-slate-400 hover:text-primary hover:border-primary/40 transition-colors font-mono"
            >
              {phrase}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (mode === 'visual') {
    const handleRefFile = (e) => {
      const file = e.target.files[0]
      if (file) {
        const url = URL.createObjectURL(file)
        setReferenceImage(file, url)
      }
    }

    return (
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">参考图像</label>
        {referenceImageUrl ? (
          <div className="relative rounded-xl overflow-hidden border border-border">
            <img src={referenceImageUrl} alt="参考图" className="w-full h-28 object-cover bg-bg-base" />
            <button
              onClick={() => setReferenceImage(null, null)}
              className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-black/80 rounded-md transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center gap-2 p-5 border border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-bg-surface/30 transition-all">
            <Image size={20} className="text-slate-500" />
            <span className="text-xs text-slate-500">点击上传参考图</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleRefFile} />
          </label>
        )}
        <p className="text-[11px] text-slate-600">将检测与参考图视觉相似的物体</p>
      </div>
>
    )
  }

  return null
}
