import os
import tempfile
import sys

# Check the junction target
temp = r'C:\Users\Alben\AppData\Local\Temp'
print('isjunction:', os.path.islink(temp))
print('exists:', os.path.exists(temp))
print('realpath:', os.path.realpath(temp))

# Try mkstemp with explicit dir
try:
    fd, p = tempfile.mkstemp(dir=temp)
    print('mkstemp OK:', p)
    os.close(fd)
    os.unlink(p)
    print('cleanup OK')
except Exception as e:
    print('mkstemp failed:', e)
    sys.exit(1)
