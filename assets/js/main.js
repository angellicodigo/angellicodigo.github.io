/**
 * Photography Portfolio Modernization
 * Vanilla ES6+ Gallery & Comparison Engine
 *
 * Single Source of Truth: data/photos.json
 * - Each object in data/photos.json generates a gallery tile automatically
 * - Cloudinary photos: url, thumbUrl (optional; auto-resized if omitted), camera, lens, focal length, aperture, shutter speed, iso, date
 * - YouTube videos: video (or url), thumbUrl (optional; auto-generated if omitted)
 */

(function () {
  'use strict';

  let photoCatalog = [];
  let galleryItems = [];
  let currentItem = null;
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
  let videoContainer = null;
  let videoFrame = null;

  // Extract YouTube ID from standard, short, or embed URLs
  function getYouTubeId(url) {
    if (!url || typeof url !== 'string') return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    return match ? match[1] : null;
  }

  // Rewrite Cloudinary URL to thumbnail transformation (c_scale,w_600)
  function getCloudinaryThumbUrl(url, width = 600) {
    if (!url || typeof url !== 'string') return url;
    if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
      if (!url.match(/\/image\/upload\/[a-z0-9_,]+\//)) {
        return url.replace('/image/upload/', `/image/upload/c_scale,w_${width}/`);
      }
    }
    return url;
  }

  // Sizing slider container to photo aspect ratio
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

  window.addEventListener('resize', () => {
    if (isLightboxOpen() && currentItem && !currentItem.isVideo) {
      fitSliderToPhoto(currentItem);
    }
  });

  // Initialize Lightbox DOM
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
      lightboxEl.setAttribute('aria-label', 'Gallery view');
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

        <div class="lightbox-video-container" id="lightbox-video-container" style="display: none;">
          <iframe id="lightbox-video-frame" src="" allowfullscreen allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
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
    videoContainer = lightboxEl.querySelector('.lightbox-video-container, #lightbox-video-container');
    videoFrame = lightboxEl.querySelector('#lightbox-video-frame');

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

  // Split manipulation
  function setSplit(pct) {
    currentSplitPct = pct;
    const clampedPct = Math.max(0, Math.min(100, pct));
    if (dividerHandle) {
      dividerHandle.style.left = `${clampedPct}%`;
      dividerHandle.setAttribute('aria-valuenow', Math.round(clampedPct).toString());
    }
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

  function initPointerEvents() {
    if (!dividerHandle || !sliderContainer) return;

    function onPointerDown(e) {
      if (!isSliderActive && currentItem && currentItem.hasPair) {
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
    if (videoFrame) {
      videoFrame.src = '';
    }
    if (videoContainer) {
      videoContainer.style.display = 'none';
      videoContainer.classList.remove('active');
    }
  }

  function getActiveItems() {
    return galleryItems.filter(item => {
      if (!item.thumbEl) return true;
      const style = window.getComputedStyle(item.thumbEl);
      return style.display !== 'none' && !item.thumbEl.classList.contains('hidden');
    });
  }

  function navigateNext() {
    const activeList = getActiveItems();
    if (activeList.length === 0) return;
    const currentIndex = activeList.findIndex(item => item.index === currentItem?.index);
    const nextIndex = (currentIndex + 1) % activeList.length;
    renderLightboxItem(activeList[nextIndex]);
  }

  function navigatePrev() {
    const activeList = getActiveItems();
    if (activeList.length === 0) return;
    const currentIndex = activeList.findIndex(item => item.index === currentItem?.index);
    const prevIndex = (currentIndex - 1 + activeList.length) % activeList.length;
    renderLightboxItem(activeList[prevIndex]);
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

    lightboxEl.addEventListener('click', (e) => {
      if (e.target === lightboxEl) {
        closeLightbox();
      }
    });

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

  // Render item (photo or YouTube video) into lightbox
  function renderLightboxItem(item) {
    if (!item) return;
    currentItem = item;

    if (!lightboxEl) {
      createLightboxDOM();
    }

    // Handle YouTube Video
    if (item.isVideo) {
      if (sliderContainer) sliderContainer.style.display = 'none';
      if (sliderToggleBtn) sliderToggleBtn.style.display = 'none';
      setSliderActive(false);

      if (exifContainer) {
        exifContainer.style.display = 'none';
        exifContainer.innerHTML = '';
      }

      if (videoContainer && videoFrame) {
        videoContainer.style.display = 'flex';
        videoContainer.classList.add('active');
        // Do not autoplay video on open
        videoFrame.src = `https://www.youtube.com/embed/${item.youtubeId}?autoplay=0&rel=0`;
      }
      return;
    }

    // Handle Photograph
    if (videoContainer) {
      videoContainer.style.display = 'none';
      videoContainer.classList.remove('active');
    }
    if (videoFrame) {
      videoFrame.src = '';
    }

    if (sliderContainer) {
      sliderContainer.style.display = '';
    }

    fitSliderToPhoto(item);

    const singleUrl = item.editedUrl || item.rawUrl || item.url || '';
    const hasPair = item.hasPair === true && !!item.rawUrl && !!item.editedUrl;

    if (!hasPair) {
      if (sliderToggleBtn) sliderToggleBtn.style.display = 'none';
      if (rawImg) {
        rawImg.src = singleUrl;
        rawImg.alt = 'Photograph';
      }
      if (editedImg) {
        editedImg.src = singleUrl;
        editedImg.alt = 'Photograph';
        editedImg.onload = () => {
          if (currentItem === item) fitSliderToPhoto(item);
        };
      }
      setSliderActive(false);
    } else {
      if (sliderToggleBtn) sliderToggleBtn.style.display = 'inline-flex';
      if (rawImg) {
        rawImg.src = item.rawUrl;
        rawImg.alt = 'Original RAW photo';
      }
      if (editedImg) {
        editedImg.src = item.editedUrl;
        editedImg.alt = 'Edited photo';
        editedImg.onload = () => {
          if (currentItem === item) fitSliderToPhoto(item);
        };
      }
      setSliderActive(false);
    }

    // Render bottom black bar EXIF metadata:
    // camera, lens, focal length, aperture, shutter speed, iso, date
    // focal length, aperture, shutter speed have NO text prefix; ISO has ISO prefix
    if (exifContainer) {
      const camera = item.camera || (item.exif && (item.exif.camera || item.exif.model)) || '';
      const lens = item.lens || (item.exif && item.exif.lens) || '';
      const focalLength = item['focal length'] || item.focalLength || item['focal_length'] || (item.exif && (item.exif['focal length'] || item.exif.focalLength)) || '';
      const aperture = item.aperture || (item.exif && (item.exif.aperture || item.exif.fNumber)) || '';
      const shutterSpeed = item['shutter speed'] || item.shutterSpeed || item['shutter_speed'] || (item.exif && (item.exif['shutter speed'] || item.exif.shutterSpeed || item.exif.exposureTime)) || '';
      const iso = item.iso || (item.exif && (item.exif.iso || item.exif.isoSpeedRatings)) || '';
      const date = item.date || (item.exif && item.exif.date) || '';

      const items = [];

      // 1. Camera
      if (camera) {
        items.push(`<span class="exif-item exif-camera"><i class="fa fa-camera" aria-hidden="true"></i> ${camera}</span>`);
      }

      // 2. Lens
      if (lens) {
        items.push(`<span class="exif-item exif-lens">${lens}</span>`);
      }

      // 3. Focal Length (no text prefix)
      if (focalLength) {
        const flText = String(focalLength).trim().replace(/^focal\s*length\s*:?\s*/i, '');
        items.push(`<span class="exif-item exif-focal">${flText}</span>`);
      }

      // 4. Aperture (no text prefix)
      if (aperture) {
        let apText = String(aperture).trim().replace(/^aperture\s*:?\s*/i, '');
        if (!apText.startsWith('f/') && !isNaN(Number(apText))) {
          apText = `f/${apText}`;
        }
        items.push(`<span class="exif-item exif-aperture">${apText}</span>`);
      }

      // 5. Shutter Speed (no text prefix)
      if (shutterSpeed) {
        const ssText = String(shutterSpeed).trim().replace(/^shutter\s*speed\s*:?\s*/i, '');
        items.push(`<span class="exif-item exif-shutter">${ssText}</span>`);
      }

      // 6. ISO (with ISO prefix)
      if (iso) {
        const isoStr = String(iso).trim();
        const isoText = isoStr.toUpperCase().startsWith('ISO') ? isoStr : `ISO ${isoStr}`;
        items.push(`<span class="exif-item exif-iso">${isoText}</span>`);
      }

      // 7. Date
      if (date) {
        items.push(`<span class="exif-item exif-date"><i class="fa fa-calendar-alt" aria-hidden="true"></i> ${date}</span>`);
      }

      if (items.length > 0) {
        exifContainer.style.display = 'flex';
        exifContainer.innerHTML = items.join('');
      } else {
        exifContainer.style.display = 'none';
        exifContainer.innerHTML = '';
      }
    }
  }

  const renderLightboxPhoto = renderLightboxItem;

  // Render gallery from photoCatalog into #main
  function renderGallery() {
    const mainEl = document.getElementById('main');
    if (!mainEl) return;

    // Remove any existing thumb elements (preserve empty-state)
    const existingThumbs = mainEl.querySelectorAll('article.thumb');
    existingThumbs.forEach(el => el.remove());

    const emptyState = document.getElementById('empty-state');

    galleryItems = photoCatalog.map((entry, index) => {
      const videoUrl = entry.video || entry.videoUrl || (getYouTubeId(entry.url) ? entry.url : null);
      const ytId = getYouTubeId(videoUrl);
      const isVideo = !!ytId;

      const fullUrl = isVideo ? videoUrl : (entry.url || entry.imageUrl || entry.photo || '');
      let thumbUrl = entry.thumbUrl || entry.thumb || '';

      if (!thumbUrl) {
        if (isVideo) {
          thumbUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
        } else if (fullUrl) {
          thumbUrl = getCloudinaryThumbUrl(fullUrl, 600);
        }
      }

      const dateText = entry.date || '';

      const article = document.createElement('article');
      article.className = 'thumb';
      article.dataset.index = index;

      article.innerHTML = `
        <a href="${fullUrl}" class="image">
          <img src="${thumbUrl}" alt="" loading="lazy" />
        </a>
      `;

      if (emptyState) {
        mainEl.insertBefore(article, emptyState);
      } else {
        mainEl.appendChild(article);
      }

      const itemData = {
        index,
        thumbEl: article,
        isVideo,
        youtubeId: ytId,
        url: fullUrl,
        thumbUrl,
        ...entry
      };

      function handleOpen(e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        renderLightboxItem(itemData);
        openLightbox();
      }

      article.addEventListener('click', handleOpen);
      const link = article.querySelector('a');
      if (link) {
        link.addEventListener('click', handleOpen);
      }

      return itemData;
    });

    // Reveal page once gallery is populated
    window.setTimeout(() => {
      document.body.classList.remove('is-preload');
    }, 100);
  }

  // Load photos.json
  async function loadPhotoCatalog() {
    try {
      const response = await fetch('data/photos.json');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          photoCatalog = data;
          window.photoCatalog = photoCatalog;
          renderGallery();
        }
      }
    } catch (_) {
      // In case fetch is blocked (e.g. offline file://), remove preload
      document.body.classList.remove('is-preload');
    }
  }

  function initSearch() {
    const searchInput = document.getElementById('photo-search');
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
        }
      });
    }
  }

  // Preload non-video images
  function preloadImages() {
    galleryItems.forEach(item => {
      if (!item.isVideo && item.url) {
        const img = new Image();
        img.src = item.url;
      }
    });
  }

  // Expose on window for testing and verification
  window.renderLightboxPhoto = renderLightboxPhoto;
  window.renderLightboxItem = renderLightboxItem;
  window.renderGallery = renderGallery;
  window.setSliderActive = setSliderActive;
  window.toggleSlider = toggleSlider;
  window.fitSliderToPhoto = fitSliderToPhoto;
  window.photoCatalog = photoCatalog;
  window.getYouTubeId = getYouTubeId;
  window.getCloudinaryThumbUrl = getCloudinaryThumbUrl;

  async function bootstrap() {
    createLightboxDOM();
    initSearch();
    await loadPhotoCatalog();
    preloadImages();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

})();
