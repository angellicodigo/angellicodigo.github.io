## How to Add Your Own Photos

Adding new photos to the website involves three main steps:
1. Place image files in `images/`
2. Add metadata to `data/photos.json`
3. Add the photo tile to `index.html`

---

### Step 1: Prepare and Save Your Image Files

Images are organized into two folders under `images/`:

| Folder | Purpose | Recommended Specifications |
|---|---|---|
| `images/fulls/` | High-resolution photos displayed in the lightbox | Width: 1400px–2400px, JPEG format |
| `images/thumbs/` | Grid thumbnails displayed on the homepage | Width: 512px (maintain original aspect ratio), JPEG format |

#### Option A: Paired Photos (Before/After Slider)
If you have both a RAW (original) and an Edited version:
- Place edited photo in: `images/fulls/<photo-id>-edited.jpg`
- Place original/raw photo in: `images/fulls/<photo-id>-raw.jpg`
- Place thumbnail in: `images/thumbs/<photo-id>.jpg` (created from the edited version)

*Example filenames:* `photo-7-edited.jpg`, `photo-7-raw.jpg`, `photo-7.jpg`

#### Option B: Single Photo (No Comparison Slider)
If you only want to display a single photo without comparison:
- Place full photo in: `images/fulls/<photo-id>-edited.jpg` (or `images/fulls/<photo-id>.jpg`)
- Place thumbnail in: `images/thumbs/<photo-id>.jpg`

---

### Step 2: Add Photo Entry to `data/photos.json`

Open `data/photos.json` and add a new entry to the array.

#### Example for Paired Photo:
```json
{
  "id": "photo-7",
  "title": "Misty Mountain Sunrise",
  "date": "November 2026",
  "filename": "photo-7",
  "hasPair": true,
  "editedUrl": "images/fulls/photo-7-edited.jpg",
  "rawUrl": "images/fulls/photo-7-raw.jpg",
  "thumbUrl": "images/thumbs/photo-7.jpg",
  "aspectRatio": "3:2",
  "dimensions": {
    "width": 1400,
    "height": 933
  },
  "exif": {
    "camera": "Sony Alpha 7 IV",
    "model": "Sony Alpha 7 IV",
    "lens": "FE 24-70mm f/2.8 GM II",
    "focalLength": "35mm",
    "aperture": "f/2.8",
    "fNumber": "2.8",
    "shutterSpeed": "1/250s",
    "exposureTime": "1/250",
    "iso": "100",
    "isoSpeedRatings": 100
  }
}
```

#### Example for Single Photo (`hasPair: false`):
```json
{
  "id": "photo-7",
  "title": "City Sunset",
  "date": "November 2026",
  "filename": "photo-7",
  "hasPair": false,
  "editedUrl": "images/fulls/photo-7.jpg",
  "rawUrl": "",
  "thumbUrl": "images/thumbs/photo-7.jpg",
  "aspectRatio": "3:2",
  "dimensions": {
    "width": 1400,
    "height": 933
  },
  "exif": {
    "camera": "Leica Q2",
    "model": "Leica Q2",
    "lens": "Summilux 28mm f/1.7 ASPH",
    "focalLength": "28mm",
    "aperture": "f/5.6",
    "fNumber": "5.6",
    "shutterSpeed": "1/500s",
    "exposureTime": "1/500",
    "iso": "100",
    "isoSpeedRatings": 100
  }
}
```

> **Note on EXIF Data:** The real-time search bar indexes camera, model, lens, aperture, shutter speed, ISO, date, and title.

---

### Step 3: Add Gallery Item to `index.html`

Open `index.html` and locate `<div id="main">`. Add a new `<article class="thumb">` block inside `<div id="main">` (place it above `<div id="empty-state">...</div>`):

```html
<article class="thumb">
    <a href="images/fulls/photo-7-edited.jpg" class="image">
        <img src="images/thumbs/photo-7.jpg" alt="Misty Mountain Sunrise" loading="lazy" />
    </a>
    <p>November 2026</p>
</article>
```

---

### Step 4 (Optional): Update Offline Fallback Catalog

If you plan to view the website offline by opening `index.html` directly from your local file system (`file:///...`) where browser security restricts fetching local JSON files:
- Open `assets/js/main.js`
- Locate `const FALLBACK_PHOTOS = [...]` near line 19
- Add the same photo object there to ensure offline previews display all photos without a server.

---

### Step 5: Test Locally

Run a local HTTP server from the project root:

```bash
# Using Python
python -m http.server 8088

# Or using Node.js / npx
npx serve .
```

Open [http://localhost:8088](http://localhost:8088) in your web browser to check:
1. The new thumbnail appears in the gallery grid.
2. Clicking the photo opens the lightbox with correct EXIF tags and comparison slider.
3. Searching for your camera model, date, or tags displays the new photo.

---

### Step 6: Deploy Changes

Commit and push your changes to GitHub:

```bash
git add images/ data/photos.json index.html assets/js/main.js
git commit -m "Add new photo: photo-7"
git push origin main
```

GitHub Actions will automatically build and publish the updated site to GitHub Pages.

---

## Project Structure

```text
├── .github/workflows/deploy.yml   # Automatic GitHub Pages deployment
├── assets/
│   ├── css/                       # Compiled CSS files
│   ├── js/main.js                 # Vanilla ES6+ gallery & comparison engine
│   └── sass/                      # SCSS source stylesheets
├── data/
│   └── photos.json                # Photo catalog and EXIF metadata
├── images/
│   ├── fulls/                     # Full-resolution RAW and Edited photos
│   └── thumbs/                    # 512px gallery thumbnails
├── index.html                     # Main gallery page
├── package.json                   # Build dependencies (Dart Sass)
└── README.md                      # Documentation
```

## Development & Build Commands

- **Build CSS**: `npm run build:css` (compiles SCSS from `assets/sass/` to `assets/css/*.min.css`)
- **Watch CSS**: `npm run watch:css`
