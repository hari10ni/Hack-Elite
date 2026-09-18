import unittest
import sys
import os
import zipfile
import io

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.app.utils.zip_handler import SafeZipHandler

class TestSecurityZip(unittest.TestCase):
    def test_zip_slip_rejection(self):
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            zf.writestr("../../etc/passwd", "root:x:0:0")
            zf.writestr("safe_module.py", "print('hello')")
        
        extracted, warnings = SafeZipHandler.extract_zip_bytes(buf.getvalue())
        self.assertNotIn("../../etc/passwd", extracted)
        self.assertIn("safe_module.py", extracted)
        self.assertTrue(any("Skipped unsafe path" in w for w in warnings))

if __name__ == "__main__":
    unittest.main()
