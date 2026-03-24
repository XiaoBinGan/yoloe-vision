import os
d = r'F:\QClaw\temp'
os.makedirs(d, exist_ok=True)
print('exists:', os.path.exists(d))
print('writable:', os.access(d, os.W_OK))
print('isdir:', os.path.isdir(d))
print('listdir:', os.listdir(d))
