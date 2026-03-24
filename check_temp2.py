import os
import tempfile

temp = r'C:\Users\Alben\AppData\Local\Temp'
print('Is symlink/junction:', os.path.islink(temp))
print('Is dir:', os.path.isdir(temp))

# Try writing directly
test_file = os.path.join(temp, 'test_write_xyz.txt')
try:
    with open(test_file, 'w') as f:
        f.write('test')
    print('Direct write OK:', test_file)
    os.unlink(test_file)
    print('Direct write + unlink OK')
except Exception as e:
    print('Direct write failed:', e)

# Try with mkstemp
try:
    fd, p = tempfile.mkstemp(dir=temp)
    print('mkstemp with explicit dir OK:', p)
    os.close(fd)
    os.unlink(p)
    print('mkstemp cleanup OK')
except Exception as e:
    print('mkstemp failed:', e)
