import json
import subprocess
import argparse
import random
import shutil
import http.server
import socketserver

TIME_KEYS = ('FileAccessDate', 'FileModifyDate', 'CreateDate',
             'DateTimeOriginal')


def build_exifs(directory):
    print('Building exifs for directory {}'.format(directory))
    exifs = json.loads(
        subprocess.check_output(
            ['(cd \'{}\' && exiftool * -j)'.format(directory)], shell=True))
    print('Built exifs, {} records'.format(len(exifs)))
    return exifs


def load_json_file(name):
    with open(name, 'r') as f:
        return json.load(f)


def get_key_from_name(name):
    name = name.replace('.', '_')
    if name.endswith('_mov'):
        return name.replace('_mov', '_heic')
    return name


def min_creation_date_from_exif(exif_obj):
    return min(exif_obj[k] for k in TIME_KEYS if k in exif_obj)


def build_min_dates(exifs):
    dates = {}
    for exif in exifs:
        exif_key = get_key_from_name(exif['SourceFile'])
        min_in_current_exif = min_creation_date_from_exif(exif)
        min_from_existing_dates = dates.get(exif_key, min_in_current_exif)
        dates[exif_key] = min(min_in_current_exif, min_from_existing_dates)
    return dates


def convert(exif, directory):
    orig_name = exif['SourceFile']
    if orig_name.endswith('.mov'):
        print(
            'Not converting {} because it is a secondary file for an .heic file'
            .format(orig_name))
        return None
    if not orig_name.endswith('.heic'):
        print('Not converting {} because it does not need to be converted'.
              format(orig_name))
        return orig_name
    new_name = get_key_from_name(orig_name) + '.jpg'
    subprocess.run([
        '(cd \'{}\' && heif-convert \'{}\' -q 100 \'{}\')'.format(
            directory, orig_name, new_name)
    ],
                   shell=True,
                   check=True)
    print('Created {} from {}'.format(new_name, orig_name))
    return new_name


def convert_all(exifs, directory):
    print('Converting .heic to .jpg')
    for exif in exifs:
        convert(exif, directory)


def unzip(zipfile, directory):
    print('Unzipping {} into directory {}'.format(zipfile, directory))
    subprocess.run(['unzip \'{}\' -d \'{}\''.format(zipfile, directory)],
                   shell=True,
                   check=True)
    print('Finished unzipping')
    return


def contains_code(code, photos):
    for p in photos:
        if p['code'] == code:
            return True
    return False


def get_sorted_photo_data(exifs, dates):
    photos = []
    for exif in exifs:
        orig_name = exif['SourceFile']
        if orig_name.endswith('.mov'):
            continue
        name_key = get_key_from_name(orig_name)
        new_img_obj = {}
        new_img_obj['image_file'] = (
            '{}.jpg'.format(name_key)
            if get_key_from_name(orig_name).endswith('_heic') else orig_name)
        if 'ImageWidth' in exif and 'ImageHeight' in exif:
            new_img_obj['aspect'] = exif['ImageWidth'] * 1.0 / exif['ImageHeight']
        new_img_obj['date'] = dates[name_key]
        new_img_obj['code'] = get_random_letters(
            3, lambda x: contains_code(x, photos))
        photos.append(new_img_obj)
    return sorted(photos, key=lambda p: p['date'])


def output_sorted_photo_data(data, filename, directory):
    with open('{}/{}'.format(directory, filename), 'w') as f:
        json.dump(data, f)


def output_default_pagination(data, filename, directory):
    with open('{}/{}'.format(directory, filename), 'w') as f:
        f.write('\n'.join(obj['code'] for obj in data))


def get_random_letters(n, should_reject=(lambda x: False)):
    candidate = ''
    while True:
        letters = []
        for _ in range(n):
            letters.append(random.choice('abcdefghijklmnopqrstuvwxyz'))
        candidate = ''.join(letters)
        if not should_reject(candidate):
            return candidate


def create_data_dir(zipfile, directory):
    unzip(zipfile, directory)
    exifs = build_exifs(directory)
    convert_all(exifs, directory)
    dates = build_min_dates(exifs)
    sorted_photo_data = get_sorted_photo_data(exifs, dates)
    output_sorted_photo_data(sorted_photo_data, 'sorted_photo_data.json', directory)
    output_default_pagination(sorted_photo_data, 'pagination.txt', directory)


def copy_default_files(directory):
    for filename in [
            'hotReload.mjs',
            'main.mjs',
            'sizing.json',
            'static_styles.css',
            'index.html',
            'per_photo_styles.css',
            'domUtil.mjs',
            'render.mjs',
            'progress.mjs',
    ]:
        shutil.copyfile(filename, '{}/{}'.format(directory, filename))


def serve_album(directory):
    PORT = 8000

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=directory, **kwargs)

    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("serving at port", PORT)
        try:
            httpd.serve_forever()
        except Exception:
            httpd.shutdown()
            raise Exception


def get_parsed_args():
    parser = argparse.ArgumentParser(
        description=
        'Process a zipped photo album into browser-compatible formats with a metadata list for further processing'
    )
    parser.add_argument(
        '-d',
        '--directory',
        required=True,
        type=str,
        nargs=1,
        help='directory in which to expand files (omit closing slash)')
    parser.add_argument(
        '-z',
        '--zipfile',
        required=False,
        type=str,
        nargs=1,
        help='zip file containing the album')

    return parser.parse_args()


if __name__ == '__main__':
    args = get_parsed_args()
    create_data_dir(args.zipfile[0], args.directory[0])
    copy_default_files(args.directory[0])
    serve_album(args.directory[0])
