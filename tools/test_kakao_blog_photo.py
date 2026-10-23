import sys, unittest
from pathlib import Path
from urllib.parse import quote
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
from kakao_place_photo import photo_url

class PhotoAllowlistTests(unittest.TestCase):
    def preview(self,source):
        return '<meta property="og:image" content="https://img1.kakaocdn.net/cthumb/local/C800x400.q50/?fname='+quote(source,safe='')+'">'
    def test_blog_and_kakao_images(self):
        for source in ['https://postfiles.pstatic.net/album/photo.JPEG?type=w773','https://blogfiles.pstatic.net/album/photo.png','http://t1.kakaocdn.net/mystore/PHOTO','https://images.example.com/photos/1']:
            self.assertIsNotNone(photo_url(self.preview(source)))
        self.assertIsNotNone(photo_url('<meta property="og:image" content="https://images.example.com/photo.jpg">'))
        self.assertIsNone(photo_url('<meta property="og:image" content="https://staticmap.kakao.com/map">'))
    def test_unrelated_and_spoofed_hosts_rejected(self):
        for source in ['http://127.0.0.1/photo.jpg','http://10.0.0.1/photo.jpg','https://localhost/photo.jpg','https://host.internal/photo.jpg','javascript:alert(1)','https://user:password@postfiles.pstatic.net/photo.jpg','https://postfiles.pstatic.net:444/photo.jpg']:
            self.assertIsNone(photo_url(self.preview(source)))

if __name__=='__main__':unittest.main()
