import { useState, useRef, useCallback } from 'react'
import { Upload, Image, Video, X, AlertCircle } from 'lucide-react'
import { useStore } from '../store/useStore'

export default function UploadZone() {
  const { uploadedFile, uploadedFileUrl, fileType, setUploadedFile, reset } = useStore()
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef()

  const validateFile = (file) => {
    const imageExts = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const videoExts = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo', 'video/webm']
    if (imageExts.includes(file.type)) return 'image'
    if (videoExts.includes(file.type)) return 'video'
    // 尝试通过扩展名判断
    const ext = file.name.split('.').pop().toLowerCase()
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext)) return 'image'
    if (['mp4', 'avi', 'mov', 'webm', 'mkv'].includes(ext)) return 'video'
    return null
  }

  const handleFile = useCallback((file) => {
    setError('')
    const type = validateFile(file)
    if (!type) {
      setError('不支持的文件格式，请上传图片或视频')
      return
    }
    const url = URL.createObjectURL(file)
    setUploadedFile(file, url, type)
  }, [setUploadedFile])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback(() => setIsDragging(false), [])

  const onPaste = useCallback((e) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file) handleFile(file)
      }
    }
  }, [handleFile])

  const onInputChange = (e) => {
    const file = e.target.files[0]
    if (file) handleFile(file)
  }

  if (uploadedFile && uploadedFileUrl) {
    return (
      <div className="bg-bg-surface border border-border rounded-xl overflow-hidden">
        <div className="relative">
          {fileType === 'image' ? (
            <img src={uploadedFileUrl} alt="预览" className="w-full max-h-72 object-contain bg-bg-base" />
          ) : (
            <video src={uploadedFileUrl} className="w-full max-h-72 object-contain bg-bg-base" controls />
          )}
          <button
            onClick={reset}
            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-3 border-t border-border">
          <p className="text-sm text-slate-300 truncate font-mono">{uploadedFile.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {fileType === 'image' ? '🖼️ 图片' : '🎬 视频'} · {(uploadedFile.size / 1024).toFixed(1)} KB
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`
        border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
        ${isDragging ? 'drag-active' : 'border-border hover:border-border-light hover:bg-bg-surface/50'}
      `}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onPaste={onPaste}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept="image/*,video/*" className="hidden" onChange={onInputChange} />

      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Upload size={22} className="text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-200">拖拽上传 · 点击选择 · Ctrl+V 粘贴</p>
          <p className="text-xs text-slate-500 mt-1">支持 JPG、PNG、WebP、MP4、AVI、 MOV</p>
        </div>
        <div className="flex gap-4 mt-1">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Image size={13} /> 图片
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Video size={13} /> 视频
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center justify-center gap-1.5 text-danger text-xs">
          <AlertCircle size={13} /> {error}
        </div>
      )}
    </div>
  )
}
