# Current status

Blocked on PDF-saving issues

Chrome seems to freeze up when trying to render the PDF, memory overflow. Try on powerful workstation? Also exploring using pandoc with latex, or wkhtmltopdf, or weasyprint. The latter two at least seem to render some photos with the wrong orientation, unclear why the orientation is bad.

# Make a printable photo album

Supported in no way whatsoever!

## Dependencies

For this to work, you will need Python 3.7+, as well as these tools (check for
each one with `which TOOL_NAME`):

* `exiftool`
* `heif-convert` (install `libheif` if this is missing)
* `unzip`

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
    
### Resume serving without rebuilding the album

If you need to stop the server process and want to re-start it without starting
from scratch, you can do that easily (using the directory from before):

```
python3 -m http.server --directory DIRECTORY
```

### Load the album page

Navigate a browser to `http://localhost:8000`. Wait for it to finish rendering.
It's slow and clunky, because the auto-pagination logic involves some
trial-and-error. (We don't attempt to predict when a page will overflow, because
then we'd need to do a lot of math and it's less work just to use
trial-and-error with actual DOM updates. If anyone wants to make this better,
please feel free.)

### Edit your album

Edit the following files *in your album directory* (not the original copies in
the code repository) to get hot-reloaded changes to your album, which will also
persist after reloading the page.

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
  * To add temporary page captions (useful for finding a page in the browser
    with ctrl+f), add them following the word `break`, on the same line, e.g.
    `break: June vacation section`.
  * To omit a photo, just remove that photo's whole line from `pagination.txt`.
* Look up a photo's three-letter code by clicking on it (this will make the code
  appear in full-screen).
* Use `per_photo_styles.css` to make changes to individual photo stylings, or
  page stylings. This may be tricky if you aren't familiar with HTML+CSS. You
  can select a photo whose code is `abc` with `.photo.abc`, or if you've added a
  tag like `silly-dog-photo` you can select it with `.photo.silly-dog-photo`. If
  you want to make changes to the page that *contains* that photo, select
  `.page.abc` or `.page.silly-dog-photo`. Beware, these changes might not have the
  intended effects if you edit `pagination.txt` afterwards, since different photos
  may be grouped together on the same page after a pagination change. To ensure
  some consistency, use forced page breaks to block any automatic re-pagination
  for the enclosed list of photos.
  * One common layout edit you might want is to take a single photo and enlarge
    it, giving it its own row or column. Here's a simple way to do this:
    1. Enlarge the photo by giving it a larger *cross-axis size*. If the page
       has rows, give the photo a larger *height*. If it has columns, give the
       photo a larger width. Example:
       ```
       .photo.abc {
         height: 60%;  /* 60% of the available page height */
       }
       ```
    2. If the other photos on the page should shrink, edit their height first,
       like this:
       ```
       .page.abc .photo {
         height: 35%;
       }
       .photo.abc {
         height: 60% !important;
       }
       ```

### Direct in-browser editing

If you can't make quite the changes you want via `pagination.txt`,
`per_photo_styles.css`, and `sizing.json`, but you can get your desired results
by editing the DOM and/or styles in your browser, your best bet is probably to
get as close as possible using the methods above, then Save a copy of the album
somewhere *other* than the album directory using the browser's save function.
After that, you ought to be able to repeatedly load that new saved copy, edit it
in the browser, and re-save it (or save yet another copy).

### Save to PDF

If you used a low number of pixels per unit in `sizing.json`, edit this to be a
large enough number for printing. If your units are inches, you should set this
to the maximum DPI supported by your printer or printing service.

Remove page border and temporary captions by entering `togglePrintMode();` in
the browser's JS console. You can do this as many times as you like to switch
between editing mode and print mode.

Use your the "Save to PDF" function provided by your browser and/or OS (as a
printer option) to create a PDF. Make sure that the PDF is set to use a page
size that matche the dimensions you need to print to, as well as the dimensions
in `sizing.json`.
