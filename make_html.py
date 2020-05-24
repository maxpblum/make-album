import collections
import json
import argparse
import re


# Gets the substring after the first instance of first and before the next
# instance of second.
def get_substring_between(full, first, second):
    return template.split(first)[1].split(second)[0]
class Template(object):
    def __init__(self, template_filename):
        with open(template_filename, 'r') as f:
            template = f.read()

        start_of_content = template.find('<!-- for_each')
        self.pre_content = template[:start_of_content]

        end_of_content = template.rfind('<!-- end_for -->')
        self.post_content = template[end_of_content + len('<!-- end_for -->'):]

        self.image_template = get_substring_between(template,
                                                    '<!-- for_each_image -->',
                                                    '<!-- end_for -->')
        self.line_template = get_substring_between(template,
                                                    '<!-- for_each_line -->',
                                                    '<!-- end_for -->')
        self.page_template = get_substring_between(template,
                                                   '<!-- for_each_page -->',
                                                   '<!-- end_for -->')

    def fill(self, pages):
        filled_pages = []
        for page in pages:
            filled_lines = []
            for line in page['lines']:
                filled_images = []
                for image in line['images']:
                    new_filled_image = self.image_template.replace(
                        'image_code',
                        image['code']).replace('image_filename',
                                               image['filename'])
                    filled_images.append(new_filled_image)
                filled_images_string = ''.join(filled_images)
                new_filled_line = self.line_template.replace(
                    'line_content', filled_images_string)
                filled_lines.append(new_filled_line)
            filled_lines_string = ''.join(filled_lines)
            new_filled_page = self.page_template.replace(
                'page_content', filled_lines_string).replace(
                    'page_code', page['code']).replace('page_class',
                                                       'page-with-rows')
            filled_pages.append(new_filled_page)
        return '{}{}{}'.format(self.pre_content, ''.join(filled_pages),
                               self.post_content)

def build_pages(sorted_images):
    pages = []
    current_page = None
    current_line = None
    for image in sorted_images:
        if current_line is not None and len(current_line['images']) >= 2:
            current_page['lines'].append(current_line)
            current_line = None
        if current_line is None:
            current_line = {'images': []}

        if current_page is not None and len(current_page['lines']) >= 2:
            pages.append(current_page)
            current_page = None
        if current_page is None:
            current_page = {'code': 'p{}'.format(len(pages) + 1), 'lines': []}

        current_line['images'].append({'code': image['code'], 'filename': image['image_file']})

    if current_line is not None and len(current_line['images']) > 0:
        current_page['lines'].append(current_line)
        
    if current_page is not None and len(current_page['lines']) > 0:
        pages.append(current_page)

    return pages


parser = argparse.ArgumentParser(
    description='Turn sorted photo metadata list into simple HTML for styling.'
)
parser.add_argument(
    '-d',
    '--directory',
    required=True,
    type=str,
    nargs=1,
    help='directory in which to find files (omit closing slash)')
args = parser.parse_args()

with open('photo_album_template.html', 'r') as f:
    template = f.read()

with open('{}/sorted_photos.json'.format(args.directory[0]), 'r') as f:
    metadata = json.load(f)

pages = build_pages(metadata)
template = Template('photo_album_template.html')

with open('{}/album.html'.format(args.directory[0]), 'w') as f:
    f.write(template.fill(pages))
