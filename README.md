# Make a printable photo album

Supported in no way whatsoever!

## Instructions

### Get photo album as a .zip file

If your photo album is from Google Photos, there should be a button for this.

Your album can contain `.jpg` files, `.png` files, `.heic` files with paired `.mov` files (sometimes
used for photos with "motion" turned on), or `.gif` files (but why?). No other
file types have been tested.

### Run the main script

Tell the script where your zipfile is, and pick a directory for the album (this should not
already exist).

```
python3 process_photo_data.py -z ZIPFILE_NAME -d DIRECTORY
```

Here's what this script does:

* Creates the directory
* Expands your zip file into it
* Uses `exiftool` to collect all photo metadata
* Converts all `.heic`/`.mov` pairs into still-image `.jpg` files
* Generates a JSON array of metadata necessary for rendering your photos, sorted
  by photo creation date (best guess based on exif data), and copies this into
  your destination folder
* Generates the default `pagination.txt` in your destination folder, containing
  (for now) the three-letter reference codes of your sorted photos, delineated
  with newlines.
* Copies other album webpage assets into your destination folder
* Starts a simple static HTTP server in your destination folder
  * **NOTE: This server is not safe for public use. Do not attempt to serve it
    to external traffic this way.**

### Load the album page

Navigate a browser to `http://localhost:8000`. Wait for it to finish rendering.
It's slow and clunky, because the auto-pagination logic involves some
trial-and-error. (We don't attempt to predict when a page will overflow, because
then we'd need to do a lot of math and it's less work just to use
trial-and-error with actual DOM updates. If anyone wants to make this better,
please feel free.)

### Edit your album

* Use `sizing.json` to change the page size in `units` (e.g. inches, cm, mm), the
  number of pixels per unit (maybe a lower number is better for fast rendering
  while you play with the layout? Then you can make it higher before saving to
  PDF?), the spacing between photos units, and the desired number of rows (when a
  page is laid out in rows) or columns (when a page is laid out in columns) per
  page. Photo size will be maximized for that number of rows or columns.
* Use `pagination.txt` to change the order of your photos, how they are grouped
  into pages, and whether a page is laid out in rows or columns.
  * You can tag a photo with a reference name so you can recognize it more
    easily. If the photo's code is `abc`, add a space after that code and then
    your reference name, e.g. `abc silly-dog-photo`. Then, the photo `img` tag's full
    classname will be `photo abc silly-dog-photo`.
  * Force a page break by adding the word `break` on its own line. By default,
    as many photos as possible will be added to a given page until it overflows,
    and the page will be laid out in either rows or columns, whichever fits more
    photos.
  * Force a page to use rows or columns by adding the word `rows` or `columns`
    on its own line. This might not work as intended in all cases, so the best
    supported way to do this is to add a `break` on one line, then `rows` or
    `columns` on the next line. (`break` should be skipped for the very first page.)
