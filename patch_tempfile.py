import os

# Create temp dir in user's local appdata (which is writable)
temp_base = os.path.join(os.environ['USERPROFILE'], 'AppData', 'Local', 'Temp2')
os.makedirs(temp_base, exist_ok=True)

# Write a temp fix for tempfile
import sys
tempfile_fix = '''
import tempfile as _tf
_orig_gettempdir = _tf.gettempdir

def _patched_gettempdir():
    import os
    d = os.path.join(os.environ.get('USERPROFILE', ''), 'AppData', 'Local', 'Temp2')
    if os.path.isdir(d) and os.access(d, os.W_OK):
        return d
    return _orig_gettempdir()

_tf.gettempdir = _patched_gettempdir
'''

# Write a sitecustomize to patch tempfile at startup
import site
site_packages = site.getsitepackages()
if not site_packages:
    site_packages = [os.path.join(sys.prefix, 'Lib', 'site-packages')]

for sp in site_packages:
    sc_path = os.path.join(sp, 'sitecustomize.py')
    try:
        with open(sc_path, 'w') as f:
            f.write(tempfile_fix)
        print('Patched tempfile in:', sp)
        print('sitecustomize.py written to:', sc_path)
        break
    except Exception as e:
        print('Failed to write to', sp, ':', e)
        continue

# Test the patch
_tf = __import__('tempfile')
print('tempdir after patch:', _tf.gettempdir())
