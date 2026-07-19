import re
from urllib.parse import unquote
import os

with open('c:/Users/user/Documents/antrizy/rendered_index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find image urls
urls = re.findall(r'https://static\.wixstatic\.com/media/([a-zA-Z0-9_\-\.\~]+(?:%20[a-zA-Z0-9_\-\.\~]+)*)', content)
print('Total wix media urls found:', len(urls))
print('Unique wix media urls:', len(set(urls)))

for u in list(set(urls))[:10]:
    print(' -', u)

css_links = re.findall(r'<link[^>]*rel=[\"\'\s]*stylesheet[\"\'\s]*[^>]*href=[\"\'\s]*([^\"\'>\s]+)[\"\'\s]*', content)
print('\nCSS links:', len(css_links))
for c in css_links:
    print(' -', c)

scripts = re.findall(r'<script[^>]*src=[\"\'\s]*([^\"\'>\s]+)[\"\'\s]*', content)
print('\nScripts:', len(scripts))
for s in scripts[:5]:
    print(' -', s)

# check how images map
import glob
images = glob.glob('c:/Users/user/Documents/antrizy/images/*')
images_basenames = [os.path.basename(img) for img in images]
print('\nTotal images downloaded:', len(images_basenames))
print('Sample downloaded images:', images_basenames[:10])
