# Make a printable photo album

Supported in no way whatsoever!

## Instructions

### Get photo album as a .zip file

If your photo album is from Google Photos, there should be a button for this.

Your album can contain .jpg files, .png files, .heic files with paired .mov files (sometimes
used for photos with "motion" turned on), or .gif files (but why?). No other
file types have been tested.

### 
```
python3 process_photo_data.py <<photo album zip file (should exist)>> -d <<photo album directory (should not exist)>>
python3 make_html.py <<photo album directory>>
google-chrome <<photo album directory>>/album.html
```
