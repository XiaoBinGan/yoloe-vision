# YOLOE Vision Platform

一个基于 YOLOE(You Only Look Once Early-exit) 的实时视觉检测平台。

## 功能特性

- 🚀 实时物体检测与分割
- 🎯 多等级早退机制，提升推理速度
- 📊 实时性能监控 (FPS, 延迟)
- 📸 图像/视频上传检测
- 🎨 可视化检测结果渲染

## 技术栈

- **后端**: FastAPI (Python 3.12+)
- **前端**: React + JavaScript
- **模型**: YOLOE-26S-Seg

## 快速开始

### 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 运行服务

```bash
cd backend
python main.py
```

服务将在 `http://localhost:8000` 启动。

### 访问测试页面

打开 `http://localhost:8000/test` 进行 API 测试。

## API 文档

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 项目结构

```
yoloe-vision/
├── backend/           # FastAPI 后端
│   ├── main.py       # 主应用入口
│   ├── detector.py   # YOLOE 检测逻辑
│   ├── renderer.py   # 结果渲染
│   ├── schemas.py    # Pydantic 模型
│   └── yoloe-26x-seg.pt  # 预训练模型
├── frontend/          # React 前端
└── uploads/          # 上传文件存储
```

## 许可证

MIT License
