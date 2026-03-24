"""
Mock/YOLOE 后端 — 当 ultralytics 不可用时使用
直接运行: python mock_main.py
"""
import random
import time
import base64
from io import BytesIO
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image, ImageDraw
import uuid
import os

app = FastAPI(title="YOLOE Mock API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_methods=["*"])

CLASSES = ["person", "car", "bicycle", "dog", "cat", "phone", "laptop", "book", "chair", "cup",
           "bottle", "bag", "traffic light", "stop sign", "tree", "building", "sky", "grass"]

PALETTE = [(255,87,34),(34,198,115),(59,130,246),(245,158,11),(168,85,247),(236,72,153),
           (20,184,166),(249,115,22),(124,58,237),(14,165,233),(34,197,94),(239,68,68)]

def generate_detections(w, h, count=8):
    detections = []
    for i in range(count):
        x1 = random.randint(10, w - 200)
        y1 = random.randint(10, h - 200)
        x2 = x1 + random.randint(80, 300)
        y2 = y1 + random.randint(80, 300)
        x2 = min(x2, w - 1)
        y2 = min(y2, h - 1)
        cls = random.choice(CLASSES)
        detections.append({
            "class_id": CLASSES.index(cls),
            "class_name": cls,
            "confidence": round(random.uniform(0.3, 0.98), 3),
            "bbox": [float(x1), float(y1), float(x2), float(y2)],
            "segmentation": []
        })
    return detections

def draw_mock_boxes(image_bytes, detections):
    img = Image.open(BytesIO(image_bytes)).convert("RGB")
    draw = ImageDraw.Draw(img)
    w, h = img.size
    class_counts = {}
    for i, det in enumerate(detections):
        x1, y1, x2, y2 = [int(v) for v in det["bbox"]]
        color = PALETTE[i % len(PALETTE)]
        r, g, b = color
        draw.rectangle([x1, y1, x2, y2], outline=color, width=2)
        label = f"{det['class_name']} {det['confidence']:.2f}"
        draw.rectangle([x1, max(0, y1-20), x1+len(label)*8, y1], fill=color)
        draw.text((x1+3, max(0, y1-17)), label, fill=(255,255,255))
        cls_name = det["class_name"]
        class_counts[cls_name] = class_counts.get(cls_name, 0) + 1
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return base64.b64encode(buf.read()).decode(), class_counts

@app.get("/api/health")
async def health():
    return {"status": "ok", "model_loaded": False, "model_name": "mock", "device": "mock"}

@app.get("/api/classes")
async def get_classes():
    return {"classes": CLASSES, "count": len(CLASSES)}

@app.post("/api/detect/image")
async def detect_image(
    file: UploadFile = File(...),
    mode: str = Form(default="none"),
    text_prompt: str = Form(default=None),
    conf_threshold: float = Form(default=0.25),
    iou_threshold: float = Form(default=0.45),
):
    image_bytes = await file.read()
    try:
        img = Image.open(BytesIO(image_bytes))
        w, h = img.size
    except:
        raise HTTPException(status_code=400, detail="Invalid image file")

    start = time.time()
    count = random.randint(3, 12)
    detections = generate_detections(w, h, count)
    time.sleep(random.uniform(0.3, 0.8))  # 模拟推理时间
    result_b64, class_counts = draw_mock_boxes(image_bytes, detections)

    return {
        "success": True,
        "result_image": result_b64,
        "detections": detections,
        "stats": {
            "total_objects": len(detections),
            "classes": class_counts,
            "inference_time_ms": round((time.time()-start)*1000, 1)
        }
    }

@app.post("/api/detect/video")
async def detect_video(
    file: UploadFile = File(...),
    mode: str = Form(default="none"),
    text_prompt: str = Form(default=None),
    conf_threshold: float = Form(default=0.25),
    iou_threshold: float = Form(default=0.45),
):
    return await detect_image(file, mode, text_prompt, conf_threshold, iou_threshold)

if __name__ == "__main__":
    import uvicorn
    print("🚀 Mock YOLOE API running at http://localhost:8000")
    print("⚠️  运行在模拟模式（非真实 YOLOE 检测）")
    uvicorn.run("mock_main:app", host="0.0.0.0", port=8000, reload=False)
