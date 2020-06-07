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
