/**
 * Photography Portfolio Modernization
 * Vanilla ES6+ Comparison Lightbox & Gallery Engine
 *
 * Originally authored zero-dependency module:
 * - Pointer Events (pointerdown, pointermove, pointerup, pointercancel, setPointerCapture)
 * - Draggable split comparison slider with clip-path
 * - ORIGINAL (RAW) vs EDITED visual badges
 * - Single-photo fallback
 * - Keyboard navigation (ArrowLeft, ArrowRight, Escape)
 * - EXIF metadata display
 * - Real-time search filtering & empty-state management
 */

(function () {
  'use strict';

  // 1. Embedded fallback photo catalog (guarantees zero-dependency offline & static preview)
  const FALLBACK_PHOTOS = [
    {
      id: 'photo-1',
      date: 'October 2026',
      filename: 'photo-1',
      hasPair: true,
      editedUrl: 'images/fulls/photo-1-edited.jpg',
      rawUrl: 'images/fulls/photo-1-raw.jpg',
      thumbUrl: 'images/thumbs/photo-1.jpg',
      aspectRatio: '3:2',
      dimensions: { width: 1400, height: 933 },
      exif: {
        camera: 'Sony Alpha 7 IV',
        model: 'Sony Alpha 7 IV',
        lens: 'FE 24-70mm f/2.8 GM II',
        focalLength: '45mm',
        aperture: 'f/4.0',
        fNumber: '4.0',
        shutterSpeed: '1/160s',
        exposureTime: '1/160',
        iso: '100',
        isoSpeedRatings: 100
      }
    },
    {
      id: 'photo-2',
      date: 'September 2026',
      filename: 'photo-2',
      hasPair: true,
      editedUrl: 'images/fulls/photo-2-edited.jpg',
      rawUrl: 'images/fulls/photo-2-raw.jpg',
      thumbUrl: 'images/thumbs/photo-2.jpg',
      aspectRatio: '3:2',
      dimensions: { width: 1400, height: 935 },
      exif: {
        camera: 'Leica Q2',
        model: 'Leica Q2',
        lens: 'Summilux 28mm f/1.7 ASPH',
        focalLength: '28mm',
        aperture: 'f/5.6',
        fNumber: '5.6',
        shutterSpeed: '1/500s',
        exposureTime: '1/500',
        iso: '100',
        isoSpeedRatings: 100
      }
    },
    {
      id: 'photo-3',
      date: 'August 2026',
      filename: 'photo-3',
      hasPair: true,
      editedUrl: 'images/fulls/photo-3-edited.jpg',
      rawUrl: 'images/fulls/photo-3-raw.jpg',
      thumbUrl: 'images/thumbs/photo-3.jpg',
      aspectRatio: '3:2',
      dimensions: { width: 1400, height: 931 },
      exif: {
        camera: 'Canon EOS R5',
        model: 'Canon EOS R5',
        lens: 'RF 24-105mm f/4L IS USM',
        focalLength: '35mm',
        aperture: 'f/8.0',
        fNumber: '8.0',
        shutterSpeed: '1/250s',
        exposureTime: '1/250',
        iso: '100',
        isoSpeedRatings: 100
      }
    },
    {
      id: 'photo-4',
      date: 'July 2026',
      filename: 'photo-4',
      hasPair: true,
      editedUrl: 'images/fulls/photo-4-edited.jpg',
      rawUrl: 'images/fulls/photo-4-raw.jpg',
      thumbUrl: 'images/thumbs/photo-4.jpg',
      aspectRatio: '4:5',
      dimensions: { width: 1400, height: 1750 },
      exif: {
        camera: 'Fujifilm GFX 100S',
        model: 'Fujifilm GFX 100S',
        lens: 'GF 110mm f/2 R LM WR',
        focalLength: '110mm',
        aperture: 'f/2.0',
        fNumber: '2.0',
        shutterSpeed: '1/200s',
        exposureTime: '1/200',
        iso: '160',
        isoSpeedRatings: 160
      }
    },
    {
      id: 'photo-5',
      date: 'June 2026',
      filename: 'photo-5',
      hasPair: true,
      editedUrl: 'images/fulls/photo-5-edited.jpg',
      rawUrl: 'images/fulls/photo-5-raw.jpg',
      thumbUrl: 'images/thumbs/photo-5.jpg',
      aspectRatio: '2:3',
      dimensions: { width: 1400, height: 2100 },
      exif: {
        camera: 'Sony Alpha 7S III',
        model: 'Sony Alpha 7S III',
        lens: 'FE 35mm f/1.4 GM',
        focalLength: '35mm',
        aperture: 'f/1.4',
        fNumber: '1.4',
        shutterSpeed: '1/60s',
        exposureTime: '1/60',
        iso: '1600',
        isoSpeedRatings: 1600
      }
    },
    {
      id: 'photo-6',
      date: 'May 2026',
      filename: 'photo-6',
      hasPair: false,
      editedUrl: 'images/fulls/photo-6-edited.jpg',
      thumbUrl: 'images/thumbs/photo-6.jpg',
      aspectRatio: '2:3',
      dimensions: { width: 1400, height: 2100 },
      exif: {
        camera: 'Hasselblad X2D 100C',
        model: 'Hasselblad X2D 100C',
        lens: 'XCD 55mm f/2.5 V',
        focalLength: '55mm',
        aperture: 'f/8.0',
        fNumber: '8.0',
        shutterSpeed: '1/640s',
        exposureTime: '1/640',
        iso: '64',
        isoSpeedRatings: 64
      }
    }
  ];

  let photoCatalog = [...FALLBACK_PHOTOS];
  let currentPhoto = null;
  let isDragging = false;
  let activePointerId = null;
  let currentSplitPct = 50;
  let isSliderActive = false;

  // DOM Elements
  let lightboxEl = null;
  let closeBtn = null;
  let prevBtn = null;
  let nextBtn = null;
  let sliderContainer = null;
  let rawLayer = null;
  let rawImg = null;
  let editedLayer = null;
  let editedImg = null;
  let dividerHandle = null;
  let badgeRaw = null;
  let badgeEdited = null;
  let exifContainer = null;
  let sliderToggleBtn = null;
  let sliderToggleText = null;

  // 2. Remove is-preload on page load
  window.addEventListener('load', () => {
    window.setTimeout(() => {
      document.body.classList.remove('is-preload');
    }, 100);
  });

  // Fit comparison slider container precisely to the image aspect ratio
  function fitSliderToPhoto(photo) {
    if (!sliderContainer || !photo) return;
    const maxW = Math.min(window.innerWidth * 0.85, 1200);
    const maxH = Math.min(window.innerHeight * 0.78, 800);

    let w = photo.dimensions?.width;
    let h = photo.dimensions?.height;

    if (!w || !h) {
      if (editedImg && editedImg.naturalWidth && editedImg.naturalHeight) {
        w = editedImg.naturalWidth;
        h = editedImg.naturalHeight;
      } else {
        w = 1400;
        h = 933;
      }
    }

    const photoRatio = w / h;
    const availRatio = maxW / maxH;

    let fitW, fitH;
    if (photoRatio > availRatio) {
      fitW = maxW;
      fitH = maxW / photoRatio;
    } else {
      fitH = maxH;
      fitW = maxH * photoRatio;
    }

    sliderContainer.style.width = `${Math.round(fitW)}px`;
    sliderContainer.style.height = `${Math.round(fitH)}px`;
    sliderContainer.style.aspectRatio = `${w} / ${h}`;
  }

  // Toggle slider active state
  function setSliderActive(active) {
    isSliderActive = !!active;
    if (dividerHandle) {
      dividerHandle.style.left = '50%';
      dividerHandle.setAttribute('aria-valuenow', '50');
    }
    if (isSliderActive) {
      if (sliderToggleBtn) {
        sliderToggleBtn.classList.add('active');
        if (sliderToggleText) sliderToggleText.textContent = 'Hide Slider';
      }
      if (sliderContainer) {
        sliderContainer.classList.remove('slider-hidden');
      }
      if (rawLayer) rawLayer.style.display = '';
      if (dividerHandle) dividerHandle.style.display = '';
      if (badgeRaw) badgeRaw.style.display = '';
      if (badgeEdited) badgeEdited.style.display = '';
      setSplit(50);
    } else {
      if (sliderToggleBtn) {
        sliderToggleBtn.classList.remove('active');
        if (sliderToggleText) sliderToggleText.textContent = 'Use Slider';
      }
      if (sliderContainer) {
        sliderContainer.classList.add('slider-hidden');
      }
      if (rawLayer) rawLayer.style.display = 'none';
      if (dividerHandle) dividerHandle.style.display = 'none';
      if (badgeRaw) badgeRaw.style.display = 'none';
      if (badgeEdited) badgeEdited.style.display = 'none';
      if (editedLayer) editedLayer.style.clipPath = 'none';
    }
  }

  function toggleSlider() {
    setSliderActive(!isSliderActive);
  }

  // Window resize keeps slider container matched to photo area
  window.addEventListener('resize', () => {
    if (isLightboxOpen() && currentPhoto) {
      fitSliderToPhoto(currentPhoto);
    }
  });

  // 3. Initialize Lightbox DOM
  function createLightboxDOM() {
    let existing = document.querySelector('.lightbox, .comparison-lightbox, #lightbox');
    if (existing) {
      lightboxEl = existing;
    } else {
      lightboxEl = document.createElement('div');
      lightboxEl.id = 'lightbox';
      lightboxEl.className = 'lightbox comparison-lightbox';
      lightboxEl.setAttribute('role', 'dialog');
      lightboxEl.setAttribute('aria-modal', 'true');
      lightboxEl.setAttribute('aria-label', 'Photo comparison view');
      lightboxEl.style.display = 'none';

      lightboxEl.innerHTML = `
        <button type="button" class="slider-toggle-btn" id="slider-toggle-btn" aria-label="Use or hide slider">
          <i class="fa fa-sliders-h" aria-hidden="true"></i>
          <span class="slider-toggle-text">Use Slider</span>
        </button>
        <button type="button" class="lightbox-close closer" aria-label="Close" title="Close (Esc)">✕</button>
        <button type="button" class="nav-previous lightbox-prev" aria-label="Previous photo" title="Previous (Left Arrow)">‹</button>
        <button type="button" class="nav-next lightbox-next" aria-label="Next photo" title="Next (Right Arrow)">›</button>

        <div class="comparison-slider slider-container slider-hidden" data-slider>
          <div class="layer-raw layer-bottom">
            <img alt="Original RAW photo" />
            <span class="slider-badge badge-raw">ORIGINAL (RAW)</span>
          </div>
          <div class="layer-edited layer-top clip-layer">
            <img alt="Edited photo" />
            <span class="slider-badge badge-edited">EDITED</span>
          </div>
          <div class="slider-divider slider-handle divider-handle drag-handle" style="left: 50%;" role="slider" aria-label="Comparison split position" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" tabindex="0"></div>
        </div>

        <div class="lightbox-exif exif-container exif-data photo-exif" aria-label="EXIF metadata"></div>
      `;

      document.body.appendChild(lightboxEl);
    }

    sliderToggleBtn = lightboxEl.querySelector('.slider-toggle-btn, #slider-toggle-btn');
    sliderToggleText = lightboxEl.querySelector('.slider-toggle-text');
    closeBtn = lightboxEl.querySelector('.lightbox-close, .closer, button.close, [aria-label="Close"]');
    prevBtn = lightboxEl.querySelector('.nav-previous, .lightbox-prev');
    nextBtn = lightboxEl.querySelector('.nav-next, .lightbox-next');
    sliderContainer = lightboxEl.querySelector('.comparison-slider, .slider-container');
    rawLayer = lightboxEl.querySelector('.layer-raw, .layer-bottom');
    rawImg = rawLayer ? rawLayer.querySelector('img') : null;
    editedLayer = lightboxEl.querySelector('.layer-edited, .layer-top, .clip-layer');
    editedImg = editedLayer ? editedLayer.querySelector('img') : null;
    dividerHandle = lightboxEl.querySelector('.slider-divider, .slider-handle, .divider-handle, .drag-handle');
    badgeRaw = lightboxEl.querySelector('.badge-raw');
    badgeEdited = lightboxEl.querySelector('.badge-edited');
    exifContainer = lightboxEl.querySelector('.lightbox-exif, .exif-container, .exif-data, .photo-exif');

    if (dividerHandle) {
      dividerHandle.style.left = '50%';
    }

    if (sliderToggleBtn) {
      sliderToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSlider();
      });
    }

    initPointerEvents();
    initControls();
  }

  // 4. Split position manipulation
  function setSplit(pct) {
    currentSplitPct = pct;
    const clampedPct = Math.max(0, Math.min(100, pct));
    if (dividerHandle) {
      dividerHandle.style.left = `${clampedPct}%`;
      dividerHandle.setAttribute('aria-valuenow', Math.round(clampedPct).toString());
    }
    // Edited layer sits on top; clip from right so left portion shows edited.
    if (editedLayer) {
      if (isSliderActive) {
        editedLayer.style.clipPath = `inset(0 ${100 - clampedPct}% 0 0)`;
      } else {
        editedLayer.style.clipPath = 'none';
      }
    }
  }

  function updateSplitFromClientX(clientX) {
    if (!sliderContainer) return;
    const rect = sliderContainer.getBoundingClientRect();
    if (rect.width <= 0) return;
    let pct = ((clientX - rect.left) / rect.width) * 100;
    pct = Math.max(0, Math.min(100, pct));
    setSplit(pct);
  }

  // 5. Pointer Events handling
  function initPointerEvents() {
    if (!dividerHandle || !sliderContainer) return;

    function onPointerDown(e) {
      if (!isSliderActive && currentPhoto && currentPhoto.hasPair) {
        setSliderActive(true);
      }
      isDragging = true;
      activePointerId = e.pointerId;
      if (dividerHandle.setPointerCapture && e.pointerId !== undefined) {
        try {
          dividerHandle.setPointerCapture(e.pointerId);
        } catch (_) {}
      }
      updateSplitFromClientX(e.clientX);
    }

    dividerHandle.addEventListener('pointerdown', onPointerDown);

    // Window move listener tracks even when pointer moves outside element bounds
    window.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      updateSplitFromClientX(e.clientX);
    });

    dividerHandle.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      updateSplitFromClientX(e.clientX);
    });

    function endDrag() {
      if (!isDragging) return;
      isDragging = false;
      if (dividerHandle.releasePointerCapture && activePointerId !== null) {
        try {
          dividerHandle.releasePointerCapture(activePointerId);
        } catch (_) {}
      }
      activePointerId = null;
    }

    window.addEventListener('pointerup', endDrag);
    dividerHandle.addEventListener('pointerup', endDrag);

    window.addEventListener('pointercancel', endDrag);
    dividerHandle.addEventListener('pointercancel', endDrag);
  }

  // 6. Navigation & Lightbox Controls
  function isLightboxOpen() {
    return lightboxEl && (
      lightboxEl.classList.contains('active') ||
      lightboxEl.classList.contains('visible') ||
      lightboxEl.style.display !== 'none'
    );
  }

  function openLightbox() {
    if (!lightboxEl) return;
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      try { document.activeElement.blur(); } catch (_) {}
    }
    lightboxEl.style.display = 'flex';
    lightboxEl.classList.add('active', 'visible');
    document.body.classList.add('lightbox-open');
  }

  function closeLightbox() {
    if (!lightboxEl) return;
    isDragging = false;
    lightboxEl.classList.remove('active', 'visible');
    lightboxEl.style.display = 'none';
    document.body.classList.remove('lightbox-open');
    if (dividerHandle) {
      dividerHandle.style.left = '50%';
      dividerHandle.setAttribute('aria-valuenow', '50');
    }
  }

  function getActivePhotos() {
    const thumbs = Array.from(document.querySelectorAll('#main article.thumb'));
    const visibleThumbs = thumbs.filter(thumb => {
      return window.getComputedStyle(thumb).display !== 'none' && !thumb.classList.contains('hidden');
    });

    if (visibleThumbs.length > 0) {
      return visibleThumbs
        .map(thumb => photoCatalog.find(p => p.id === thumb.dataset.photoId))
        .filter(Boolean);
    }
    return photoCatalog;
  }

  function navigateNext() {
    const activeList = getActivePhotos();
    if (activeList.length === 0) return;
    const currentIndex = activeList.findIndex(p => p.id === currentPhoto?.id);
    const nextIndex = (currentIndex + 1) % activeList.length;
    currentPhoto = activeList[nextIndex];
    renderLightboxPhoto(currentPhoto);
  }

  function navigatePrev() {
    const activeList = getActivePhotos();
    if (activeList.length === 0) return;
    const currentIndex = activeList.findIndex(p => p.id === currentPhoto?.id);
    const prevIndex = (currentIndex - 1 + activeList.length) % activeList.length;
    currentPhoto = activeList[prevIndex];
    renderLightboxPhoto(currentPhoto);
  }

  function initControls() {
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeLightbox();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigatePrev();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateNext();
      });
    }

    // Close on backdrop click (outside slider & controls)
    lightboxEl.addEventListener('click', (e) => {
      if (e.target === lightboxEl) {
        closeLightbox();
      }
    });

    // Global keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (!isLightboxOpen()) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigatePrev();
      }
    });
  }

  // 7. Render photo into lightbox
  function renderLightboxPhoto(photo) {
    if (!photo) return;
    currentPhoto = photo;

    if (!lightboxEl) {
      createLightboxDOM();
    }

    // Exact sizing to fit photo aspect ratio so slider cannot leave photo area
    fitSliderToPhoto(photo);

    // Update EXIF metadata
    if (exifContainer) {
      const exif = photo.exif || {};
      const items = [];

      if (exif.camera || exif.model) {
        items.push(`<span class="exif-item exif-camera"><i class="fa fa-camera" aria-hidden="true"></i> ${exif.camera || exif.model}</span>`);
      }
      if (exif.aperture || exif.fNumber) {
        const ap = exif.aperture || `f/${exif.fNumber}`;
        items.push(`<span class="exif-item exif-aperture">${ap}</span>`);
      }
      if (exif.shutterSpeed || exif.exposureTime) {
        const ss = exif.shutterSpeed || `${exif.exposureTime}s`;
        items.push(`<span class="exif-item exif-shutter">${ss}</span>`);
      }
      if (exif.iso || exif.isoSpeedRatings) {
        const isoVal = exif.iso || exif.isoSpeedRatings;
        items.push(`<span class="exif-item exif-iso">ISO ${isoVal}</span>`);
      }
      if (photo.date) {
        items.push(`<span class="exif-item exif-date"><i class="fa fa-calendar-alt" aria-hidden="true"></i> ${photo.date}</span>`);
      }

      exifContainer.innerHTML = items.join('');
    }

    // Single-photo fallback vs Paired comparison
    const hasPair = photo.hasPair === true && !!photo.rawUrl && !!photo.editedUrl;

    if (!hasPair) {
      // Single photo view (no paired version exists)
      if (sliderToggleBtn) sliderToggleBtn.style.display = 'none';
      const singleUrl = photo.editedUrl || photo.rawUrl || photo.url || '';
      if (rawImg) {
        rawImg.src = singleUrl;
        rawImg.alt = 'Photograph';
      }
      if (editedImg) {
        editedImg.src = singleUrl;
        editedImg.alt = 'Photograph';
        editedImg.onload = () => {
          if (currentPhoto === photo) fitSliderToPhoto(photo);
        };
      }
      setSliderActive(false);
    } else {
      // Comparison view available; defaults to the edited version
      if (sliderToggleBtn) sliderToggleBtn.style.display = 'inline-flex';
      if (rawImg) {
        rawImg.src = photo.rawUrl;
        rawImg.alt = 'Original RAW photo';
      }
      if (editedImg) {
        editedImg.src = photo.editedUrl;
        editedImg.alt = 'Edited photo';
        editedImg.onload = () => {
          if (currentPhoto === photo) fitSliderToPhoto(photo);
        };
      }
      setSliderActive(false);
    }
  }

  // Expose renderLightboxPhoto, setSliderActive, and photoCatalog on window for automated verification
  window.renderLightboxPhoto = renderLightboxPhoto;
  window.setSliderActive = setSliderActive;
  window.toggleSlider = toggleSlider;
  window.fitSliderToPhoto = fitSliderToPhoto;
  window.photoCatalog = photoCatalog;

  // 8. Gallery Grid Event Binding
  function bindGalleryEvents() {
    const thumbs = Array.from(document.querySelectorAll('#main article.thumb'));
    thumbs.forEach((thumb, index) => {
      // Attach photo-id
      const photo = photoCatalog[index] || photoCatalog.find(p => {
        const img = thumb.querySelector('img');
        return img && img.src.includes(p.filename);
      }) || photoCatalog[index];

      if (photo) {
        thumb.dataset.photoId = photo.id;
      }

      function handleOpen(e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        const pId = thumb.dataset.photoId;
        const matched = photoCatalog.find(p => p.id === pId) || photo;
        if (matched) {
          renderLightboxPhoto(matched);
          openLightbox();
        }
      }

      const link = thumb.querySelector('a');
      if (link) {
        link.addEventListener('click', handleOpen);
      }

      thumb.addEventListener('click', handleOpen);
    });

    // Delegated click handler on document to guarantee any thumb / anchor click is prevented and handled
    if (!window.__delegatedClickBound) {
      window.__delegatedClickBound = true;
      document.addEventListener('click', (e) => {
        const thumb = e.target.closest('#main article.thumb');
        if (thumb) {
          e.preventDefault();
          const pId = thumb.dataset.photoId;
          const matched = photoCatalog.find(p => p.id === pId) || photoCatalog[0];
          if (matched) {
            renderLightboxPhoto(matched);
            openLightbox();
          }
        }
      });
    }
  }

  // 9. Real-Time Search Filtering
  function initSearch() {
    const searchInput = document.getElementById('photo-search');
    const emptyState = document.getElementById('empty-state');

    function filterPhotos(query) {
      const q = (query || '').trim().toLowerCase();
      let matchCount = 0;
      const thumbs = Array.from(document.querySelectorAll('#main article.thumb'));

      thumbs.forEach((thumb, index) => {
        const photoId = thumb.dataset.photoId;
        const photo = (photoId ? photoCatalog.find(p => p.id === photoId) : null)
          || photoCatalog[index]
          || photoCatalog.find(p => {
               const img = thumb.querySelector('img');
               return img && img.src.includes(p.filename);
             });
        if (!photo) return;

        if (!q) {
          thumb.style.display = '';
          thumb.classList.remove('hidden');
          matchCount++;
          return;
        }

        const dateMatch = (photo.date || '').toLowerCase().includes(q);
        const fileMatch = (photo.filename || '').toLowerCase().includes(q);
        const pText = (thumb.querySelector('p')?.textContent || '').toLowerCase().includes(q);
        const exif = photo.exif || {};
        const cameraMatch = (exif.camera || '').toLowerCase().includes(q);
        const modelMatch = (exif.model || '').toLowerCase().includes(q);
        const lensMatch = (exif.lens || '').toLowerCase().includes(q);
        const apertureMatch = (exif.aperture || '').toLowerCase().includes(q) || (exif.fNumber || '').toString().toLowerCase().includes(q);
        const shutterMatch = (exif.shutterSpeed || '').toLowerCase().includes(q) || (exif.exposureTime || '').toLowerCase().includes(q);
        const isoMatch = (exif.iso || '').toString().toLowerCase().includes(q) || (exif.isoSpeedRatings || '').toString().toLowerCase().includes(q);

        const matches = dateMatch || fileMatch || pText || cameraMatch || modelMatch || lensMatch || apertureMatch || shutterMatch || isoMatch;

        if (matches) {
          thumb.style.display = '';
          thumb.classList.remove('hidden');
          matchCount++;
        } else {
          thumb.style.display = 'none';
          thumb.classList.add('hidden');
        }
      });

      if (emptyState) {
        if (matchCount === 0 && q) {
          emptyState.style.display = 'block';
          emptyState.classList.remove('hidden');
        } else {
          emptyState.style.display = 'none';
          emptyState.classList.add('hidden');
        }
      }
    }

    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
        }
      });
      searchInput.addEventListener('input', (e) => filterPhotos(e.target.value));
      searchInput.addEventListener('keyup', (e) => filterPhotos(e.target.value));
      searchInput.addEventListener('change', (e) => filterPhotos(e.target.value));
    }
  }

  // 10. Catalog Hydration
  async function loadPhotoCatalog() {
    try {
      const response = await fetch('data/photos.json');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          photoCatalog = data;
          window.photoCatalog = photoCatalog;
        }
      }
    } catch (_) {
      // Local preview / offline fallback to embedded catalog
      photoCatalog = [...FALLBACK_PHOTOS];
      window.photoCatalog = photoCatalog;
    }
  }

  function preloadImages() {
    photoCatalog.forEach(photo => {
      if (photo.rawUrl) {
        const r = new Image();
        r.src = photo.rawUrl;
      }
      if (photo.editedUrl) {
        const e = new Image();
        e.src = photo.editedUrl;
      }
    });
  }

  // 11. Application Bootstrap (synchronous initial binding followed by async hydration)
  async function bootstrap() {
    createLightboxDOM();
    bindGalleryEvents();
    initSearch();
    await loadPhotoCatalog();
    bindGalleryEvents();
    preloadImages();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

})();
