import collections
import json
import argparse
import re


class Sizing(object):
    def __init__(
            self,
            width_units,
            height_units,
            margin_units,
            space_between_photos_units,
            pixels_per_unit,
            rows_per_page,
            columns_per_page,
            photos_per_page,
    ):
        self.photos_per_page = photos_per_page

        units_to_pixels = lambda units: units * pixels_per_unit

        page_margin = units_to_pixels(margin_units)
        # gap = Space between photos.
        gap = units_to_pixels(space_between_photos_units)
        self.photo_padding = (gap / 2.0)
        # Achieve desired page padding by accounting for photo padding.
        self.page_padding = page_margin - (gap / 2.0)

        self.page_width = units_to_pixels(width_units)
        self.page_height = units_to_pixels(height_units)

        self.row_height = 1.0 * (self.page_height -
                                 (2 * self.page_padding)) / rows_per_page
        self.column_width = 1.0 * (self.page_width -
                                   (2 * self.page_padding)) / columns_per_page


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
        self.page_template = get_substring_between(template,
                                                   '<!-- for_each_page -->',
                                                   '<!-- end_for -->')

    def fill(self, sizing, images):
        filled_images = []
        for image in images:
            new_filled_image = (
                self.image_template  #
                .replace('image_code', image['code'])  #
                .replace('image_filename', image['filename']))

            filled_images.append(new_filled_image)
        filled_images_string = ''.join(filled_images)
        return ('{}{}{}'.format(self.pre_content, filled_images_string,
                                self.post_content)  #
                .replace('page_height', '{}'.format(sizing.page_height))  #
                .replace('page_width', '{}'.format(sizing.page_width))  #
                .replace('page_padding', '{}'.format(sizing.page_padding))  #
                .replace('row_height', '{}'.format(sizing.row_height))  #
                .replace('column_width', '{}'.format(sizing.column_width))  #
                .replace('photo_padding', '{}'.format(sizing.photo_padding))  #
                )


def build_images(sizing, sorted_images):
    images = []
    for image in sorted_images:
        images.append({'code': image['code'], 'filename': image['image_file']})
    return images


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

sizing = Sizing(
    width_units=12,
    height_units=12,
    margin_units=0.5,
    space_between_photos_units=0.25,
    pixels_per_unit=300,
    rows_per_page=3,
    columns_per_page=3,
    photos_per_page=5,
)

with open('photo_album_template.html', 'r') as f:
    template = f.read()

with open('{}/sorted_photos.json'.format(args.directory[0]), 'r') as f:
    metadata = json.load(f)

images = build_images(sizing, metadata)
template = Template('photo_album_template.html')

with open('{}/album.html'.format(args.directory[0]), 'w') as f:
    f.write(template.fill(sizing, images))
