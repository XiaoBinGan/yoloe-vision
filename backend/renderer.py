import io
import base64
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import random


# 颜色调色板
PALETTE = [
    (255, 87, 34),   # 橙红
    (34, 198, 115),  # 翠绿
    (59, 130, 246),  # 蓝
    (245, 158, 11),  # 琥珀
    (168, 85, 247),  # 紫
    (236, 72, 153),  # 粉红
    (20, 184, 166),  # 青绿
    (249, 115, 22),  # 深橙
    (124, 58, 237),  # 靛蓝
    (14, 165, 233),  # 天蓝
    (34, 197, 94),   # 亮绿
    (239, 68, 68),   # 红
    (161, 98, 7),    # 棕色
    (6, 182, 212),   # 青色
    (217, 70, 239),  # 品红
]

COLOR_MAP = {}  # 类别 → 颜色


def get_color(class_name: str) -> tuple:
    if class_name not in COLOR_MAP:
        COLOR_MAP[class_name] = PALETTE[len(COLOR_MAP) % len(PALETTE)]
    return COLOR_MAP[class_name]


def hex_to_rgba(hex_str: str, alpha: int = 180):
    h = hex_str.lstrip('#')
    r, g, b = tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
    return (r, g, b, alpha)


def render_detection_results(image_bytes: bytes, detections: list,
                             show_mask: bool = True,
                             show_box: bool = True,
                             show_label: bool = True,
                             mask_alpha: float = 0.35,
                             box_thickness: int = 2,
                             font_size: int = 14) -> str:
    """
    将检测结果渲染到图片上，返回 base64 编码的结果图片。
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    draw = ImageDraw.Draw(img, 'RGBA')

    # 尝试加载中文字体，失败则用默认字体
    try:
        font_path = "C:/Windows/Fonts/msyh.ttc"  # 微软雅黑
        font = ImageFont.truetype(font_path, font_size)
        font_small = ImageFont.truetype(font_path, font_size - 2)
    except Exception:
        font = ImageFont.load_default()
        font_small = font

    W, H = img.size

    for det in detections:
        color = get_color(det["class_name"])
        bbox = det["bbox"]  # [x1, y1, x2, y2]
        x1, y1, x2, y2 = [int(v) for v in bbox]

        # 限制在图片范围内
        x1 = max(0, min(x1, W - 1))
        y1 = max(0, min(y1, H - 1))
        x2 = max(0, min(x2, W - 1))
        y2 = max(0, min(y2, H - 1))

        # 绘制分割遮罩
        if show_mask and det.get("segmentation") and len(det["segmentation"]) > 2:
            try:
                mask_points = [(int(px), int(py)) for px, py in det["segmentation"]]
                # 创建一个带透明度的遮罩层
                overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
                mask_draw = ImageDraw.Draw(overlay)
                r, g, b = color
                alpha = int(255 * mask_alpha)
                mask_draw.polygon(mask_points, fill=(r, g, b, alpha), outline=None)
                img = Image.alpha_composite(img, overlay)
                draw = ImageDraw.Draw(img, 'RGBA')
            except Exception:
                pass

        # 绘制边界框
        if show_box:
            r, g, b = color
            for offset in range(box_thickness):
                draw.rectangle(
                    [x1 + offset, y1 + offset, x2 - offset, y2 - offset],
                    outline=(r, g, b, 255),
                    width=1
                )

        # 绘制标签
        if show_label:
            label = f"{det['class_name']} {det['confidence']:.2f}"
            r, g, b = color
            # 标签背景
            label_w, label_h = draw.textbbox((0, 0), label, font=font)[2:]
            label_x = x1
            label_y = max(0, y1 - label_h - 6)

            draw.rectangle(
                [label_x, label_y, label_x + label_w + 6, label_y + label_h + 4],
                fill=(r, g, b, 220)
            )
            draw.text((label_x + 3, label_y + 2), label, font=font, fill=(255, 255, 255, 255))

    # 转回 RGB（去掉 alpha 通道）用于 base64 编码
    result_img = img.convert("RGB")
    buf = io.BytesIO()
    result_img.save(buf, format="JPEG", quality=92)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")


def render_blank_result(image_bytes: bytes) -> str:
    """直接返回原图（用于无检测结果时）"""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=92)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")
