import os
import uuid
import shutil
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from schemas import DetectionResponse, HealthResponse, Stats
from detector import YOLOEDetector, BUILTIN_CLASSES
from renderer import render_detection_results, render_blank_result

# 临时文件目录
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# 全局检测器
detector = YOLOEDetector(model_name="yoloe-26s-seg.pt", device="cpu")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时预加载模型
    print("🚀 启动 YOLOE Vision Platform...")
    detector.load()
    print("✅ 模型已就绪")
    yield
    print("👋 关闭服务...")


app = FastAPI(
    title="YOLOE Vision Platform API",
    version="1.0.0",
    description="基于 YOLOE-26 的开放词汇目标检测平台",
    lifespan=lifespan
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_class=JSONResponse)
async def health_check():
    return JSONResponse({
        "status": "ok",
        "model_loaded": detector._loaded,
        "model_name": detector.model_name,
        "device": detector.device
    })


@app.get("/api/classes")
async def get_classes():
    return {
        "classes": BUILTIN_CLASSES,
        "count": len(BUILTIN_CLASSES)
    }


@app.post("/api/detect/image", response_model=DetectionResponse)
async def detect_image(
    file: UploadFile = File(...),
    mode: str = Form(default="none"),
    text_prompt: str = Form(default=None),
    reference_image: UploadFile = File(default=None),
    conf_threshold: float = Form(default=0.25),
    iou_threshold: float = Form(default=0.45),
):
    try:
        # 读取上传的图片
        image_bytes = await file.read()

        # 参数校验
        if mode == "text" and not text_prompt:
            raise HTTPException(status_code=400, detail="文本提示模式需要提供 text_prompt")

        ref_bytes = None
        if mode == "visual" and reference_image:
            ref_bytes = await reference_image.read()

        # 执行检测
        result = detector.detect(
            image_bytes=image_bytes,
            mode=mode,
            text_prompt=text_prompt,
            reference_image=ref_bytes,
            conf_threshold=conf_threshold,
            iou_threshold=iou_threshold
        )

        # 渲染结果图
        if result["detections"]:
            result_image_b64 = render_detection_results(
                image_bytes=image_bytes,
                detections=result["detections"],
                show_mask=True,
                show_box=True,
                show_label=True,
                mask_alpha=0.35
            )
        else:
            result_image_b64 = render_blank_result(image_bytes)

        stats = Stats(
            total_detections=len(result["detections"]),
            classes=result["class_counts"],
            inference_time_ms=result["inference_time_ms"],
            last_updated=datetime.now(),
            avg_fps=10.0
        )

        return DetectionResponse(
            success=True,
            result_image=result_image_b64,
            detections=result["detections"],
            stats=stats
        )

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        return DetectionResponse(
            success=False,
            detections=[],
            error=str(e)
        )


@app.post("/api/detect/video", response_model=DetectionResponse)
async def detect_video(
    file: UploadFile = File(...),
    mode: str = Form(default="none"),
    text_prompt: str = Form(default=None),
    conf_threshold: float = Form(default=0.25),
    iou_threshold: float = Form(default=0.45),
):
    """视频检测：取第一帧进行检测，返回关键帧标注图"""
    try:
        # 保存视频文件
        suffix = Path(file.filename).suffix.lower()
        video_path = UPLOAD_DIR / f"{uuid.uuid4().hex}{suffix}"

        with open(video_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        # 用 OpenCV 提取第一帧
        import cv2
        cap = cv2.VideoCapture(str(video_path))
        ret, frame = cap.read()
        cap.release()

        if not ret:
            raise HTTPException(status_code=400, detail="无法读取视频")

        # 将帧转为 bytes
        _, buf = cv2.imencode('.jpg', frame)
        frame_bytes = buf.tobytes()

        # 删除临时文件
        os.remove(video_path)

        # 执行检测
        result = detector.detect(
            image_bytes=frame_bytes,
            mode=mode,
            text_prompt=text_prompt,
            conf_threshold=conf_threshold,
            iou_threshold=iou_threshold
        )

        # 渲染结果图
        if result["detections"]:
            result_image_b64 = render_detection_results(
                image_bytes=frame_bytes,
                detections=result["detections"],
                show_mask=True,
                show_box=True,
                show_label=True,
                mask_alpha=0.35
            )
        else:
            result_image_b64 = render_blank_result(frame_bytes)

        stats = Stats(
            total_objects=len(result["detections"]),
            classes=result["class_counts"],
            inference_time_ms=result["inference_time_ms"]
        )

        return DetectionResponse(
            success=True,
            result_image=result_image_b64,
            detections=result["detections"],
            stats=stats
        )

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        return DetectionResponse(
            success=False,
            detections=[],
            stats=Stats(total_objects=0, classes={}, inference_time_ms=0),
            error=str(e)
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
