from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime

class DetectionResponse(BaseModel):
    id: str
    timestamp: str
    detections: List[dict]
    confidence_threshold: float
    duration_ms: float

class HealthResponse(BaseModel):
    status: str
    version: str
    dependencies: Dict[str, str]
    yolo_status: Optional[str]

class Stats(BaseModel):
    last_updated: str
    total_detections: int
    avg_fps: float

def serialize_numpy(obj: Any) -> Any:
    """将 numpy 类型转换为原生 Python 类型用于序列化"""
    import numpy as np
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, (np.integer, np.int64, np.int32)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32)):
        return float(obj)
    elif isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, dict):
        return {k: serialize_numpy(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [serialize_numpy(item) for item in obj]
    return obj
