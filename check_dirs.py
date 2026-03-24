import os

dirs = [
    r'C:\Users\Alben\AppData\Local\Temp',
    r'C:\Windows\Temp',
    r'F:\temp',
    r'F:\tmp',
    r'F:\QClaw\temp'
]

for d in dirs:
    exists = os.path.exists(d)
    writable = os.access(d, os.W_OK) if exists else 'N/A'
    print(f"{d}  exists={exists}  writable={writable}")
