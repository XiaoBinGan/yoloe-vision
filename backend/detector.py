import time
import numpy as np
from ultralytics import YOLO
from PIL import Image
import io
import base64

# 内置词表 (从 LVIS + Objects365 精选1200+类别中抽样常见类别)
BUILTIN_CLASSES = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
    "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat",
    "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack",
    "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball",
    "kite", "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket",
    "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
    "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake",
    "chair", "couch", "potted plant", "bed", "dining table", "toilet", "tv", "laptop",
    "mouse", "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink",
    "refrigerator", "book", "clock", "vase", "scissors", "teddy bear", "hair drier",
    "toothbrush", "banner", "blanket", "bridge", "road", "building", "building facade",
    "crosswalk", "door", "fence", "hill", "house", "ladder", "mountain", "mud", "path",
    "pillar", "plant", "platform", "pole", "post", "railing", "river", "road", "rock",
    "stairs", "street light", "tree", "trunk", "wall", "window", "wood", "zombie",
    "ball", "balloon", "beach", "bear", "bed", "bee", "belt", "bench", "bicycle helmet",
    "bird house", "boat", "bookcase", "bottle", "bottle opener", "bread", "briefcase",
    "bucket", "candle", "candy", "car alarm", "casette player", "cd", "chainsaw", "chair",
    "chalk", "chess board", "clock", "clothing", "coffee maker", "comb", "computer box",
    "computer keyboard", "computer mouse", "computer monitor", "cooler", "couch",
    "crown", "crutch", "curtain", "cushion", "deer", "desk", "detergent", "doll",
    "door handle", "drill", "drum", "earphone", "earring", "eraser", "eyeglasses",
    "fan", "faucet", "fax", "fish", "flashlight", "floor", "flower", "folder", "footwear",
    "fork", "frisbee", "game controller", "glass", "glove", "goggles", "grass", "gravel",
    "guitar", "gun", "hair", "hammer", "hand", "handbag", "handlebar", "hat", "head",
    "headphone", "helicopter", "helmet", "high heels", "hockey stick", "hoodie",
    "horse", "hot tub", "ice", "ice cream", "instrument", "jacket", "jeans", "jewelry",
    "kettle", "kitchen", "knife", "knife block", "ladle", "lamp", "lantern", "laptop",
    "laser", "leaf", "leather", "leg", "letter", "light", "lighter", "lipstick",
    "living room", "lock", "magazine", "magnet", "mailbox", "makeup", "map", "marker",
    "matches", "microphone", "mirror", "mitten", "mop", "mouse pad", "mouth", "muffin",
    "music", "nail", "name tag", "napkin", "net", "newspaper", "notebook", "object",
    "ornament", "outfit", "package", "painting", "pan", "paper", "paper towel",
    "parachute", "party", "pen", "pencil", "perfume", "person", "pet", "phone",
    "photo", "piano", "pillow", "pizza cutter", "plate", "pliers", "plunger", "pole",
    "pool", "popcorn", "poster", "pot", "potato", "printer", "projector", "pumpkin",
    "puppet", "purse", "quilt", "rabbit", "rack", "radio", "raincoat", "rat", "razor",
    "remote", "rice", "ring", "river", "road", "robot", "rock", "rope", "rug",
    "ruler", "sack", "saddle", "sandbox", "saw", "saxophone", "scale", "scissors",
    "scoreboard", "scraper", "screen", "screw", "screwdriver", "seal", "seat",
    "server", "shampoo", "shark", "sharpie", "shears", "sheet", "shelf", "shell",
    "shirt", "shoe", "shopping bag", "shopping cart", "shovel", "shower", "shower curtain",
    "sign", "sink", "skate", "skateboard", "ski", "skirt", "skull", "sled", "slice",
    "slipper", "smoke", "snake", "snow", "snowboard", "sock", "sofa bed", "speaker",
    "sponge", "spoon", "sport", "spray bottle", "square", "squirrel", "stadium",
    "stamp", "stand", "star", "steak", "step", "sticker", "stockings", "stool",
    "stopwatch", "stove", "straw", "street", "stroller", "studio", "submarine",
    "suit", "suitcase", "sun", "sunglasses", "sunhat", "surveillance", "sweater",
    "swimsuit", "syringe", "table", "tablecloth", "tablet", "tackle", "tag", "tailor",
    "tank", "tape", "tea", "telephone", "telescope", "television", "tennis ball",
    "test tube", "thermometer", "thermos", "thread", "tire", "toaster", "toilet paper",
    "tongue", "tool", "toothbrush", "toothpaste", "towel", "toy", "toy car", "toy plane",
    "toy train", "toy truck", "toyboat", "track", "train", "trash", "tray", "tree",
    "tricycle", "tripod", "trophy", "truck", "tube", "tuna", "tunnel", "turkey",
    "turtle", "tv", "umbrella", "urine", "usb", "utensil", "vacuum", "vase", "vegetable",
    "vehicle", "vest", "video camera", "video game", "violin", "wallet", "walnut",
    "wardrobe", "watch", "water", "water bottle", "watercraft", "weapon", "webcam",
    "weighing scale", "weight", "wheel", "wheelchair", "whistle", "wicker", "window",
    "window blind", "windshield", "wine", "wine glass", "wing", "wire", "wireless",
    "wooden", "workout", "worm", "wrench", "x-ray", "yarn", "zebra", "zipper", "zone"
]


class YOLOEDetector:
    def __init__(self, model_name="yoloe-26s-seg.pt", device="cpu"):
        self.model_name = model_name
        self.device = device
        self.model = None
        self._loaded = False

    def load(self):
        if self._loaded:
            return
        print(f"[YOLOE] 加载模型 {self.model_name}，设备: {self.device}")
        self.model = YOLO(self.model_name)
        self.model.to(self.device)
        self._loaded = True
        print(f"[YOLOE] 模型加载完成!")

    def detect(self, image_bytes: bytes, mode: str = "none",
               text_prompt: str = None, reference_image: bytes = None,
               conf_threshold: float = 0.25, iou_threshold: float = 0.45):
        self.load()
        start_time = time.time()

        # 读取图片
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_array = np.array(img)

        # 确定 prompt
        prompt = None
        if mode == "text" and text_prompt:
            prompt = text_prompt
        elif mode == "none":
            # 使用内置词表
            prompt = ", ".join(BUILTIN_CLASSES[:80])

        # 执行推理
        if prompt:
            results = self.model.predict(
                img_array,
                prompts=prompt,
                conf=conf_threshold,
                iou=iou_threshold,
                verbose=False,
                device=self.device
            )
        else:
            results = self.model.predict(
                img_array,
                conf=conf_threshold,
                iou=iou_threshold,
                verbose=False,
                device=self.device
            )

        result = results[0]
        inference_time = (time.time() - start_time) * 1000

        # 解析检测结果
        detections = []
        class_counts = {}

        if result.boxes is not None:
            boxes_data = result.boxes.xyxy.cpu().numpy()
            confs = result.boxes.conf.cpu().numpy()
            class_ids = result.boxes.cls.cpu().numpy().astype(int)
            names = result.names

            for i in range(len(boxes_data)):
                cls_id = int(class_ids[i])
                cls_name = names[cls_id]
                class_counts[cls_name] = class_counts.get(cls_name, 0) + 1

                detection = {
                    "class_id": cls_id,
                    "class_name": cls_name,
                    "confidence": float(confs[i]),
                    "bbox": boxes_data[i].tolist(),
                    "segmentation": []
                }

                # 分割掩码
                if result.masks is not None:
                    mask_data = result.masks.xy[i]
                    if len(mask_data) > 0:
                        detection["segmentation"] = mask_data.tolist()

                detections.append(detection)

        return {
            "detections": detections,
            "class_counts": class_counts,
            "inference_time_ms": round(inference_time, 2)
        }
