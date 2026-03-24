import os
import tempfile

d = r'F:\temp'
os.makedirs(d, exist_ok=True)
print('exists:', os.path.exists(d))
print('writable:', os.access(d, os.W_OK))
print('isdir:', os.path.isdir(d))
