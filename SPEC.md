# YOLOE Vision Platform — 项目规格说明书

## 1. Concept & Vision

一个现代化的**开放词汇目标检测平台**，用户可以通过文本提示、图像参考或无提示（内部词表）三种方式，对上传的图片或视频进行实时目标检测和实例分割。界面简洁专业，检测结果直观高效，带有科技感与实用感。

## 2. Design Language

- **Aesthetic**: 深色科技风格，灵感来自现代 AI 平台（Gradio + Roboflow 混合风格）
- **Color Palette**:
  - Background: `#0f1117`
  - Surface: `#1a1d27`
  - Border: `#2a2d3a`
  - Primary: `#10b981` (翠绿色)
  - Accent: `#3b82f6` (蓝色)
  - Text Primary: `#f1f5f9`
  - Text Secondary: `#94a3b8`
  - Danger: `#ef4444`
- **Typography**: Inter（正文），JetBrains Mono（代码/标签）
- **Motion**: 淡入 + 微滑（300ms ease-out），检测结果用计数动画
- **Icons**: Lucide React

## 3. Layout & Structure

```
┌─────────────────────────────────────────────────────┐
│  Header: Logo + 项目名 + 模型状态指示灯             │
├─────────────────────────────────────────────────────┤
│  [上传区]            │  [结果展示区]                 │
│  - 图片/视频上传     │  - 检测前后对比 / 重叠显示    │
│  - 拖拽上传          │  - 分割遮罩可视化              │
│  - 粘贴上传          │  - 标签列表                    │
│  ───────────────    │                               │
│  [检测模式选择]      │                               │
│  ○ 文本提示          │                               │
│  ○ 图像参考提示      │                               │
│  ○ 无提示(内部词表)  │                               │
│  ───────────────    │                               │
│  [文本输入框]        │                               │
│  [参考图上传]        │                               │
│  [执行检测按钮]      │                               │
│  ───────────────    │                               │
│  [参数调节]          │                               │
│  - 置信度阈值        │                               │
│  - IoU阈值           │                               │
│  [历史记录]          │                               │
└─────────────────────────────────────────────────────┘
```

## 4. Features & Interactions

### 4.1 媒体上传
- 支持拖拽上传、点击上传、剪贴板粘贴（Ctrl+V）
- 支持格式：jpg、png、webp、mp4、avi、mov
- 上传后即时预览，带文件名和尺寸信息
- 视频提取第一帧作为封面

### 4.2 检测模式
- **文本提示模式**：输入如"person, car, traffic light"，CLIP 语义检测
- **图像参考模式**：上传参考图，检测视觉相似的物体（如 logo、特定部件）
- **无提示模式**：使用内置 1200+ 类别词表自动检测

### 4.3 执行检测
- 进度条动画（模拟真实推理感）
- 检测完成后：
  - 边界框 + 类别标签叠加在原图上
  - 分割遮罩（半透明彩色）
  - 右侧显示检测到的物体列表（类别 + 置信度 + 数量统计）
  - 悬停高亮对应框

### 4.4 结果展示
- 切换视图：叠加层 / 仅遮罩 / 仅框 / 原图
- 点击检测框 → 高亮并显示详情
- 导出结果为图片（含标注）

### 4.5 参数调节
- 置信度阈值滑块（0.0 ~ 1.0，默认 0.25）
- IoU 阈值滑块（0.0 ~ 1.0，默认 0.45）
- 遮罩透明度调节

### 4.6 历史记录
- 最近 10 次检测记录（sessionStorage）
- 点击回溯查看历史结果

## 5. Component Inventory

| 组件 | 描述 | 状态 |
|------|------|------|
| `UploadZone` | 拖拽上传区 | idle / dragging / uploaded / error |
| `ModeSelector` | 检测模式切换 | text / visual / none |
| `TextPromptInput` | 文本输入框 | enabled / disabled |
| `ReferenceImageUpload` | 参考图上传 | visible / hidden |
| `ParameterPanel` | 参数面板 | 置信度/IoU滑块 |
| `ResultPanel` | 结果展示 | empty / loading / showing |
| `DetectionOverlay` | 画布叠加层 | 框+标签+遮罩 |
| `DetectionList` | 检测结果列表 | 类别计数统计 |
| `HistoryDrawer` | 历史记录抽屉 | open / closed |
| `Header` | 导航栏 | 含状态灯 |

## 6. Technical Approach

### 前端
- **Framework**: React 18 + Vite
- **UI**: Tailwind CSS + shadcn/ui 组件
- **状态**: Zustand
- **HTTP**: Axios
- **Canvas**: 原生 Canvas API 绘制标注

### 后端
- **Framework**: FastAPI (Python 3.10+)
- **ML Runtime**: Ultralytics YOLOE (yoloe-26s-seg.pt)
- **文件处理**: aiofiles 流式读写
- **CORS**: 允许前端 localhost 开发

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/detect/image` | 图片检测（支持 text_prompt / image_prompt / none）|
| POST | `/api/detect/video` | 视频检测（返回关键帧标注图）|
| GET | `/api/health` | 健康检查 + 模型加载状态 |
| GET | `/api/classes` | 获取内置类别列表 |
| GET | `/api/history` | 获取检测历史 |

### Request/Response 示例

**POST /api/detect/image**

```json
// Request (multipart/form-data)
{
  "file": <image_file>,
  "mode": "text",          // "text" | "visual" | "none"
  "text_prompt": "person, dog, car",
  "reference_image": <file>, // 仅 mode=visual 时
  "conf_threshold": 0.25,
  "iou_threshold": 0.45
}

// Response
{
  "success": true,
  "result_image": "<base64>",
  "detections": [
    {
      "class_id": 1,
      "class_name": "person",
      "confidence": 0.94,
      "bbox": [x1, y1, x2, y2],
      "segmentation": [[x1,y1,x2,y2,...]],
      "mask": "<base64_png>"
    }
  ],
  "stats": {
    "total_objects": 5,
    "classes": {"person": 3, "dog": 2},
    "inference_time_ms": 127
  }
}
```

### 数据流
```
用户上传图片
    ↓
前端 POST /api/detect/image
    ↓
后端: YOLOE 推理 + 标注渲染
    ↓
返回 base64 结果图 + 检测数据
    ↓
前端渲染叠加层 + 统计列表
```

## 7. 项目结构

```
yoloe-vision/
├── backend/
│   ├── main.py              # FastAPI 入口
│   ├── model.py             # YOLOE 模型封装
│   ├── schemas.py            # Pydantic 模型
│   ├── detector.py           # 检测逻辑
│   ├── renderer.py           # 标注渲染
│   ├── requirements.txt
│   └── uploads/              # 临时上传目录
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadZone.jsx
│   │   │   ├── ModeSelector.jsx
│   │   │   ├── TextPromptInput.jsx
│   │   │   ├── ParameterPanel.jsx
│   │   │   ├── ResultPanel.jsx
│   │   │   ├── DetectionOverlay.jsx
│   │   │   ├── DetectionList.jsx
│   │   │   └── Header.jsx
│   │   ├── store/
│   │   │   └── useStore.js
│   │   ├── api/
│   │   │   └── client.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── SPEC.md
└── README.md
```
