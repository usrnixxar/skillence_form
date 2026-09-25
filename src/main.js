/**
 * Skillence Academy - Main JavaScript
 * Institutional Admissions & Interactive Media Architecture
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ==========================================================================
  // 1. STICKY HEADER & SCROLL BEHAVIOR
  // ==========================================================================
  const header = document.getElementById('site-header');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  function handleScroll() {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // Scrollspy
  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -70% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));

  // ==========================================================================
  // 2. MOBILE MENU TOGGLE
  // ==========================================================================
  const navToggleBtn = document.getElementById('nav-toggle-btn');
  const navMenu = document.getElementById('nav-menu');

  if (navToggleBtn && navMenu) {
    navToggleBtn.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      navToggleBtn.classList.toggle('open', isOpen);
      navToggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.classList.toggle('modal-open', isOpen);
    });

    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        navToggleBtn.classList.remove('open');
        navToggleBtn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('modal-open');
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
        navToggleBtn.classList.remove('open');
        navToggleBtn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('modal-open');
      }
    });
  }

  // ==========================================================================
  // 3. COMMON FORM VALIDATION HELPERS
  // ==========================================================================
  function isValid10DigitPhone(phone) {
    return typeof phone === 'string' && /^[0-9]{10}$/.test(phone);
  }

  function setup10DigitPhoneInput(inputEl) {
    if (!inputEl) return;

    function sanitizeToDigits(val) {
      if (typeof val !== 'string') val = String(val || '');
      return val.replace(/\D/g, '').slice(0, 10);
    }

    inputEl.addEventListener('input', () => {
      const sanitized = sanitizeToDigits(inputEl.value);
      if (inputEl.value !== sanitized) {
        inputEl.value = sanitized;
      }
    });

    inputEl.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteText = (e.clipboardData || window.clipboardData)?.getData('text') || '';
      const digitsPasted = sanitizeToDigits(pasteText);
      const start = inputEl.selectionStart || 0;
      const end = inputEl.selectionEnd || 0;
      const current = inputEl.value;
      const combined = sanitizeToDigits(current.slice(0, start) + digitsPasted + current.slice(end));
      inputEl.value = combined;
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    });

    inputEl.addEventListener('keydown', (e) => {
      if (
        e.key === 'Backspace' ||
        e.key === 'Delete' ||
        e.key === 'Tab' ||
        e.key === 'Enter' ||
        e.key === 'Escape' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'Home' ||
        e.key === 'End' ||
        e.ctrlKey ||
        e.metaKey
      ) {
        return;
      }
      if (!/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        return;
      }
      const selLen = (inputEl.selectionEnd || 0) - (inputEl.selectionStart || 0);
      if (inputEl.value.length >= 10 && selLen === 0) {
        e.preventDefault();
      }
    });

    inputEl.addEventListener('change', () => {
      inputEl.value = sanitizeToDigits(inputEl.value);
    });

    inputEl.addEventListener('blur', () => {
      inputEl.value = sanitizeToDigits(inputEl.value);
    });
  }

  function validateEmail(email) {
    if (!email) return true;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
  }

  function showFieldError(inputEl, errorElId, message) {
    inputEl.classList.add('input-error');
    const errEl = document.getElementById(errorElId);
    if (errEl) {
      errEl.textContent = message;
      errEl.classList.add('visible');
    }
  }

  function clearFieldErrors(container) {
    container.querySelectorAll('.field-error-msg').forEach(msg => {
      msg.classList.remove('visible');
      msg.textContent = '';
    });
    container.querySelectorAll('.form-control').forEach(input => {
      input.classList.remove('input-error');
    });
  }

  // ==========================================================================
  // 4. SHARED ADMISSION ENQUIRY POPUP MODAL (CONNECT EVERY "ENQUIRY NOW" BUTTON)
  // ==========================================================================
  const admissionModal = document.getElementById('admission-enquiry-modal');
  const admissionCloseBtn = document.getElementById('admission-modal-close-btn');
  const popupForm = document.getElementById('popup-admission-form');
  const popupName = document.getElementById('popup-enquiry-name');
  const popupPhone = document.getElementById('popup-enquiry-phone');
  const popupEmail = document.getElementById('popup-enquiry-email');
  const popupCourse = document.getElementById('popup-enquiry-course');
  const popupMessage = document.getElementById('popup-enquiry-message');
  const popupSubmitBtn = document.getElementById('popup-submit-btn');
  const popupSuccessBox = document.getElementById('popup-form-success');
  const popupSuccessDesc = document.getElementById('popup-success-desc');
  const popupSuccessWhatsApp = document.getElementById('popup-success-whatsapp-link');
  const popupSuccessCloseBtn = document.getElementById('popup-success-close-btn');
  const popupErrorBox = document.getElementById('popup-form-error');
  const popupErrorDesc = document.getElementById('popup-error-desc');
  const popupRetryBtn = document.getElementById('popup-retry-btn');
  const popupErrorWhatsApp = document.getElementById('popup-error-whatsapp-link');

  let lastFocusedTrigger = null;

  function openAdmissionModal(preselectedCourse = '', triggerElement = null) {
    if (!admissionModal) return;

    if (triggerElement) {
      lastFocusedTrigger = triggerElement;
    }

    // Reset error messages and alerts
    clearFieldErrors(admissionModal);
    if (popupSuccessBox) popupSuccessBox.style.display = 'none';
    if (popupErrorBox) popupErrorBox.style.display = 'none';
    if (popupForm) popupForm.style.display = 'block';

    // Reset button state
    if (popupSubmitBtn) {
      popupSubmitBtn.disabled = false;
      const spinner = popupSubmitBtn.querySelector('.btn-spinner');
      const text = popupSubmitBtn.querySelector('.btn-text');
      if (spinner) spinner.style.display = 'none';
      if (text) text.textContent = 'Submit Enquiry';
    }

    // Handle course preselection
    if (popupCourse) {
      if (preselectedCourse) {
        let matched = Array.from(popupCourse.options).find(opt =>
          opt.value.toLowerCase() === preselectedCourse.toLowerCase() ||
          opt.value.toLowerCase().includes(preselectedCourse.toLowerCase()) ||
          preselectedCourse.toLowerCase().includes(opt.value.toLowerCase())
        );
        if (matched) {
          popupCourse.value = matched.value;
        } else {
          popupCourse.value = '';
        }
      } else {
        popupCourse.value = '';
      }
    }

    admissionModal.classList.add('open');
    document.body.classList.add('modal-open');

    // Focus first input
    setTimeout(() => {
      if (popupName && !popupName.value) {
        popupName.focus();
      } else if (popupPhone && !popupPhone.value) {
        popupPhone.focus();
      } else if (admissionCloseBtn) {
        admissionCloseBtn.focus();
      }
    }, 100);
  }

  function closeAdmissionModal() {
    if (!admissionModal) return;
    admissionModal.classList.remove('open');
    document.body.classList.remove('modal-open');

    if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === 'function') {
      lastFocusedTrigger.focus();
    }
  }

  if (admissionCloseBtn) {
    admissionCloseBtn.addEventListener('click', closeAdmissionModal);
  }

  if (popupSuccessCloseBtn) {
    popupSuccessCloseBtn.addEventListener('click', closeAdmissionModal);
  }

  if (admissionModal) {
    admissionModal.addEventListener('click', (e) => {
      if (e.target === admissionModal) {
        closeAdmissionModal();
      }
    });
  }

  // Realtime error clearing on input for popup form
  if (popupForm) {
    setup10DigitPhoneInput(popupPhone);

    [popupName, popupPhone, popupEmail, popupCourse, popupMessage].forEach(field => {
      if (!field) return;
      field.addEventListener('input', () => {
        field.classList.remove('input-error');
        const errEl = document.getElementById(`error-${field.id.replace('enquiry-', '')}`);
        if (errEl) errEl.classList.remove('visible');
      });
      field.addEventListener('change', () => {
        field.classList.remove('input-error');
        const errEl = document.getElementById(`error-${field.id.replace('enquiry-', '')}`);
        if (errEl) errEl.classList.remove('visible');
      });
    });

    popupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearFieldErrors(admissionModal);
      if (popupErrorBox) popupErrorBox.style.display = 'none';

      let hasError = false;
      let firstErrorField = null;

      const nameVal = popupName ? popupName.value.trim() : '';
      const phoneVal = (popupPhone ? popupPhone.value : '').replace(/\D/g, '').slice(0, 10);
      const emailVal = popupEmail ? popupEmail.value.trim() : '';
      const courseVal = popupCourse ? popupCourse.value : '';
      const msgVal = popupMessage ? popupMessage.value.trim() : '';

      // Validate Name
      if (!nameVal || nameVal.length < 2) {
        showFieldError(popupName, 'error-popup-name', 'Please enter your full name (minimum 2 characters).');
        hasError = true;
        if (!firstErrorField) firstErrorField = popupName;
      }

      // Validate Mobile Number (Exactly 10 digits required)
      if (!isValid10DigitPhone(phoneVal)) {
        showFieldError(popupPhone, 'error-popup-phone', 'Please enter a valid 10-digit mobile number.');
        hasError = true;
        if (!firstErrorField) firstErrorField = popupPhone;
      }

      // Validate Course
      if (!courseVal) {
        showFieldError(popupCourse, 'error-popup-course', 'Please select a course.');
        hasError = true;
        if (!firstErrorField) firstErrorField = popupCourse;
      }

      // Validate Email (if provided)
      if (emailVal && !validateEmail(emailVal)) {
        showFieldError(popupEmail, 'error-popup-email', 'Please enter a valid email address.');
        hasError = true;
        if (!firstErrorField) firstErrorField = popupEmail;
      }

      if (hasError) {
        if (firstErrorField) firstErrorField.focus();
        return;
      }

      // Show Loading State
      if (popupSubmitBtn) {
        popupSubmitBtn.disabled = true;
        const spinner = popupSubmitBtn.querySelector('.btn-spinner');
        const text = popupSubmitBtn.querySelector('.btn-text');
        if (spinner) spinner.style.display = 'inline-block';
        if (text) text.textContent = 'Submitting Enquiry...';
      }

      const leadPayload = {
        name: nameVal,
        phone: phoneVal,
        email: emailVal,
        course: courseVal,
        message: msgVal,
        submittedAt: new Date().toISOString()
      };

      // Construct WhatsApp fallback link
      const waLines = [
        'Hello Skillence Academy,',
        'I would like to enquire about admission:',
        `Name: ${nameVal}`,
        `Phone: ${phoneVal}`,
        `Course: ${courseVal}`
      ];
      if (emailVal) waLines.push(`Email: ${emailVal}`);
      if (msgVal) waLines.push(`Message: ${msgVal}`);
      waLines.push('Please share course syllabus and upcoming batch details.');
      const waUrl = `https://wa.me/919060828274?text=${encodeURIComponent(waLines.join('\n'))}`;

      try {
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadPayload)
        });

        if (response.ok) {
          const resData = await response.json().catch(() => ({ success: true }));
          if (resData.success) {
            // CONFIRMED SUCCESS STATE
            popupForm.style.display = 'none';
            if (popupSuccessBox) {
              popupSuccessBox.style.display = 'block';
              if (popupSuccessDesc) {
                popupSuccessDesc.textContent = `Thank you, ${nameVal}! Your admission enquiry for "${courseVal}" has been saved. Our admissions team will contact you shortly on ${phoneVal}.`;
              }
              if (popupSuccessWhatsApp) {
                popupSuccessWhatsApp.href = waUrl;
              }
            }
            // Clear form for future use
            popupForm.reset();
            return;
          }
        }
        throw new Error('Server returned non-success response');
      } catch (err) {
        // ERROR STATE - PRESERVE FORM DETAILS
        console.warn('Enquiry submission offline or failed:', err);
        if (popupSubmitBtn) {
          popupSubmitBtn.disabled = false;
          const spinner = popupSubmitBtn.querySelector('.btn-spinner');
          const text = popupSubmitBtn.querySelector('.btn-text');
          if (spinner) spinner.style.display = 'none';
          if (text) text.textContent = 'Submit Enquiry';
        }

        if (popupErrorBox) {
          popupErrorBox.style.display = 'block';
          if (popupErrorDesc) {
            popupErrorDesc.textContent = `Unable to reach local admissions server. Your entered details have been preserved! You can retry or submit directly via WhatsApp.`;
          }
          if (popupErrorWhatsApp) {
            popupErrorWhatsApp.href = waUrl;
          }
          if (popupRetryBtn) {
            popupRetryBtn.onclick = () => {
              popupForm.requestSubmit();
            };
          }
        }
      }
    });
  }

  // CONNECT EVERY "ENQUIRY NOW" BUTTON TO THE SHARED ADMISSION FORM POPUP
  function connectAllEnquiryButtons() {
    // 1. All elements with btn-open-enquiry-modal
    // 2. All elements with course-enquire-btn
    // 3. Desktop nav Enquire Now (.nav-cta)
    // 4. Mobile sticky bottom bar Enquire tab (.btn-enquire-tab)
    // 5. Course details modal enquire button (#modal-enquire-btn)
    const selectors = [
      '.btn-open-enquiry-modal',
      '.course-enquire-btn',
      '.nav-cta',
      '.btn-enquire-tab',
      '#modal-enquire-btn'
    ];

    const enquiryElements = document.querySelectorAll(selectors.join(','));

    enquiryElements.forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const courseName = el.getAttribute('data-course') || '';
        
        // If course details modal is open, close it first
        const courseModal = document.getElementById('course-details-modal');
        if (courseModal && courseModal.classList.contains('open')) {
          courseModal.classList.remove('open');
        }

        // If mobile nav is open, close it
        if (navMenu && navMenu.classList.contains('open')) {
          navMenu.classList.remove('open');
          if (navToggleBtn) {
            navToggleBtn.classList.remove('open');
            navToggleBtn.setAttribute('aria-expanded', 'false');
          }
        }

        openAdmissionModal(courseName, el);
      });
    });
  }

  connectAllEnquiryButtons();

  // ==========================================================================
  // 5. HERO INLINE ADMISSION FORM (ALSO SYNCED WITH /api/leads)
  // ==========================================================================
  const heroForm = document.getElementById('admissions-enquiry-form');
  const heroName = document.getElementById('enquiry-name');
  const heroPhone = document.getElementById('enquiry-phone');
  const heroEmail = document.getElementById('enquiry-email');
  const heroCourse = document.getElementById('enquiry-course');
  const heroMsg = document.getElementById('enquiry-message');
  const heroSubmitBtn = document.getElementById('btn-submit-enquiry');
  const heroSuccessBox = document.getElementById('hero-form-success');
  const heroSuccessDesc = document.getElementById('hero-success-desc');
  const heroSuccessWhatsApp = document.getElementById('hero-success-whatsapp-link');
  const heroErrorBox = document.getElementById('hero-form-error');

  if (heroForm) {
    setup10DigitPhoneInput(heroPhone);

    [heroName, heroPhone, heroEmail, heroCourse, heroMsg].forEach(field => {
      if (!field) return;
      field.addEventListener('input', () => {
        field.classList.remove('input-error');
        const errEl = document.getElementById(`error-${field.id}`);
        if (errEl) errEl.classList.remove('visible');
      });
      field.addEventListener('change', () => {
        field.classList.remove('input-error');
        const errEl = document.getElementById(`error-${field.id}`);
        if (errEl) errEl.classList.remove('visible');
      });
    });

    heroForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearFieldErrors(heroForm.parentElement);
      if (heroErrorBox) heroErrorBox.style.display = 'none';

      let hasError = false;
      let firstErrorField = null;

      const nameVal = heroName ? heroName.value.trim() : '';
      const phoneVal = (heroPhone ? heroPhone.value : '').replace(/\D/g, '').slice(0, 10);
      const emailVal = heroEmail ? heroEmail.value.trim() : '';
      const courseVal = heroCourse ? heroCourse.value : '';
      const msgVal = heroMsg ? heroMsg.value.trim() : '';

      if (!nameVal || nameVal.length < 2) {
        showFieldError(heroName, 'error-enquiry-name', 'Please enter your full name (minimum 2 characters).');
        hasError = true;
        if (!firstErrorField) firstErrorField = heroName;
      }

      // Validate Mobile Number (Exactly 10 digits required)
      if (!isValid10DigitPhone(phoneVal)) {
        showFieldError(heroPhone, 'error-enquiry-phone', 'Please enter a valid 10-digit mobile number.');
        hasError = true;
        if (!firstErrorField) firstErrorField = heroPhone;
      }

      if (!courseVal) {
        showFieldError(heroCourse, 'error-enquiry-course', 'Please select a course.');
        hasError = true;
        if (!firstErrorField) firstErrorField = heroCourse;
      }

      if (emailVal && !validateEmail(emailVal)) {
        showFieldError(heroEmail, 'error-enquiry-email', 'Please enter a valid email address.');
        hasError = true;
        if (!firstErrorField) firstErrorField = heroEmail;
      }

      if (hasError) {
        if (firstErrorField) firstErrorField.focus();
        return;
      }

      if (heroSubmitBtn) {
        heroSubmitBtn.disabled = true;
        const spinner = heroSubmitBtn.querySelector('.btn-spinner');
        const text = heroSubmitBtn.querySelector('.btn-text');
        if (spinner) spinner.style.display = 'inline-block';
        if (text) text.textContent = 'Submitting Enquiry...';
      }

      const waLines = [
        'Hello Skillence Academy,',
        'I would like to enquire about admission:',
        `Name: ${nameVal}`,
        `Phone: ${phoneVal}`,
        `Course: ${courseVal}`
      ];
      if (emailVal) waLines.push(`Email: ${emailVal}`);
      if (msgVal) waLines.push(`Message: ${msgVal}`);
      waLines.push('Please share course syllabus and available batch timings.');
      const waUrl = `https://wa.me/919060828274?text=${encodeURIComponent(waLines.join('\n'))}`;

      try {
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: nameVal,
            phone: phoneVal,
            email: emailVal,
            course: courseVal,
            message: msgVal,
            submittedAt: new Date().toISOString()
          })
        });

        if (response.ok) {
          const resData = await response.json().catch(() => ({ success: true }));
          if (resData.success) {
            heroForm.style.display = 'none';
            if (heroSuccessBox) {
              heroSuccessBox.style.display = 'block';
              if (heroSuccessDesc) {
                heroSuccessDesc.textContent = `Thank you, ${nameVal}! Your admission enquiry for "${courseVal}" has been saved. Our admissions team will contact you shortly on ${phoneVal}.`;
              }
              if (heroSuccessWhatsApp) {
                heroSuccessWhatsApp.href = waUrl;
              }
            }
            heroForm.reset();
            return;
          }
        }
        throw new Error('Server returned non-success response');
      } catch (err) {
        console.warn('Hero form submission failed:', err);
        if (heroSubmitBtn) {
          heroSubmitBtn.disabled = false;
          const spinner = heroSubmitBtn.querySelector('.btn-spinner');
          const text = heroSubmitBtn.querySelector('.btn-text');
          if (spinner) spinner.style.display = 'none';
          if (text) text.textContent = 'Submit Enquiry';
        }
        if (heroErrorBox) {
          heroErrorBox.style.display = 'block';
        }
      }
    });
  }

  // ==========================================================================
  // 6. MEDIA PLAYLIST & SHOWCASE CONTROLLER (AI PRODUCTIVE, AI VIDEOS, SAMPLE PROJECTS)
  // ==========================================================================
  // Default embedded manifest (ensures offline and instant availability)
  const defaultManifest = {
    aiProductive: [
      { src: 'ai productive/bag.mp4', filename: 'bag.mp4', title: 'Bag Commercial Reel' },
      { src: 'ai productive/MULTI CAM 2.mp4', filename: 'MULTI CAM 2.mp4', title: 'Multi Cam Podcast 2' },
      { src: 'ai productive/multi cam.mp4', filename: 'multi cam.mp4', title: 'Multi Cam Studio Interview' },
      { src: 'ai productive/Neuropathy solo podcaset.mp4', filename: 'Neuropathy solo podcaset.mp4', title: 'Neuropathy Solo Podcast' },
      { src: 'ai productive/ugc style 2.mp4', filename: 'ugc style 2.mp4', title: 'UGC Style Reel 2' },
      { src: 'ai productive/ugc style.mp4', filename: 'ugc style.mp4', title: 'UGC Style Product Video' }
    ],
    aiVideos: [
      { src: 'ai videos/bheem part 1.mp4', filename: 'bheem part 1.mp4', title: 'Bheem Part 1 Animation' },
      { src: 'ai videos/video editing kahan sikhe.mp4', filename: 'video editing kahan sikhe.mp4', title: 'Video Editing Career Guide' }
    ],
    sampleProjects: [
      {
        type: 'image',
        src: 'assets/student_work/paint_assignment_1.png',
        title: 'MS Paint Precision Art',
        category: 'ADCA+ Fundamental Assignment',
        desc: 'Mouse control and precision color drawing assignment completed by beginner students during computer fundamentals module.'
      },
      {
        type: 'image',
        src: 'assets/student_work/video_color_grading.png',
        title: 'LOG to Rec.709 Color Grade',
        category: 'Video Editing Assignment',
        desc: 'Practical video project demonstrating raw camera footage normalization, Lumetri color scopes, and creative look styling.'
      },
      {
        type: 'image',
        src: 'assets/student_work/web_project_taskapp.jpg',
        title: 'Responsive Interface Build',
        category: 'Web Fundamentals Assignment',
        desc: 'Clean HTML & CSS web layout practice demonstrating modern responsive design and component styling principles.'
      },
      {
        type: 'image',
        src: 'assets/student_work/log_vs_rec709.jpg',
        title: 'Rec.709 LUT Comparison',
        category: 'Video Editing Color Grade',
        desc: 'Direct side-by-side comparison of flat LOG footage vs converted Rec.709 balanced color contrast.'
      },
      {
        type: 'image',
        src: 'assets/student_work/paint_assignment_2.png',
        title: 'Taj Mahal Digital Illustration',
        category: 'ADCA+ Creative Assignment',
        desc: 'Detailed monochrome illustration of the Taj Mahal drawn completely inside MS Paint.'
      }
    ]
  };

  let mediaManifest = defaultManifest;

  // Video Player Modal Elements
  const videoModal = document.getElementById('video-player-modal');
  const videoModalCloseBtn = document.getElementById('video-modal-close-btn');
  const videoModalTitle = document.getElementById('modal-video-title');
  const videoModalCategory = document.getElementById('modal-video-category');
  const modalVideo = document.getElementById('modal-video-element');

  // Lightbox Modal Elements (for Sample Projects & Classroom Photos)
  const lightboxModal = document.getElementById('gallery-lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');

  // Helper: Fisher-Yates Shuffle with immediate-repeat prevention
  function createShuffledIndices(length, lastIndex = -1) {
    const indices = Array.from({ length }, (_, i) => i);
    for (let i = length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    // Avoid immediate repeat if more than 1 item
    if (length > 1 && lastIndex >= 0 && indices[0] === lastIndex) {
      const swapWith = Math.floor(Math.random() * (length - 1)) + 1;
      [indices[0], indices[swapWith]] = [indices[swapWith], indices[0]];
    }
    return indices;
  }

  // --- Card Video Controller Class ---
  class PortraitVideoController {
    constructor(config) {
      Object.assign(this, config);
      this.cardEl = document.getElementById(config.cardId);
      this.frameEl = document.getElementById(config.frameId);
      this.titleEl = document.getElementById(config.titleId);
      this.counterEl = document.getElementById(config.counterId);
      this.unblockBtn = document.getElementById(config.unblockId);
      this.videoA = this.frameEl?.querySelector('.video-layer-a');
      this.videoB = this.frameEl?.querySelector('.video-layer-b');
      this.activeLayer = 'a';
      this.playlist = [];
      this.shuffledIndices = [];
      this.currentShufflePos = 0;
      this.isVisibleInViewport = false;
      this.isPlaying = false;
      this.loading = false;
      this.loadToken = 0;
      this.suspendedTime = 0;
      this.initEvents();
    }
    setPlaylist(list) {
      if (!list?.length) return;
      this.releasePreview();
      this.playlist = list;
      this.shuffledIndices = createShuffledIndices(list.length);
      this.currentShufflePos = 0;
      this.updateLabels();
      this.resumePreview();
    }
    getCurrentItem() { return this.playlist[this.shuffledIndices[this.currentShufflePos]]; }
    getActiveVideo() { return this.activeLayer === 'a' ? this.videoA : this.videoB; }
    getInactiveVideo() { return this.activeLayer === 'a' ? this.videoB : this.videoA; }
    updateLabels() {
      const item = this.getCurrentItem();
      if (!item) return;
      if (this.titleEl) this.titleEl.textContent = item.title;
      if (this.counterEl) this.counterEl.textContent = `${this.shuffledIndices[this.currentShufflePos] + 1} / ${this.playlist.length}`;
      if (item.poster) this.getActiveVideo().poster = item.poster;
    }
    initEvents() {
      if (!this.frameEl) return;
      [this.videoA, this.videoB].forEach(video => {
        if (!video) return;
        video.preload = 'none';
        video.muted = true;
        video.playsInline = true;
        video.addEventListener('ended', () => {
          if (video === this.getActiveVideo()) this.advanceToNext();
        });
        video.addEventListener('error', () => {
          this.loading = false;
          if (this.unblockBtn) this.unblockBtn.style.display = 'flex';
        });
      });
      this.frameEl.addEventListener('click', () => this.openInModal());
      this.frameEl.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.openInModal();
        }
      });
      this.unblockBtn?.addEventListener('click', event => {
        event.stopPropagation();
        this.resumePreview();
      });
    }
    loadCurrentVideo(animate = false) {
      const item = this.getCurrentItem();
      if (!item || !this.isVisibleInViewport || document.hidden || isAnyModalOpen()) return;
      const oldVideo = this.getActiveVideo();
      const video = animate ? this.getInactiveVideo() : oldVideo;
      if (!video) return;
      const token = ++this.loadToken;
      this.loading = true;
      video.preload = 'auto';
      video.poster = item.poster || '';
      video.oncanplay = () => {
        if (token !== this.loadToken) return;
        video.oncanplay = null;
        this.loading = false;
        if (animate) {
          video.classList.add('active');
          oldVideo.classList.remove('active');
          this.activeLayer = this.activeLayer === 'a' ? 'b' : 'a';
          oldVideo.pause();
          oldVideo.removeAttribute('src');
          oldVideo.load();
        }
        if (this.suspendedTime > 0 && this.suspendedTime < video.duration) video.currentTime = this.suspendedTime;
        this.suspendedTime = 0;
        this.playActive();
      };
      video.src = encodeURI(item.previewSrc || item.src);
      video.load();
    }
    playActive() {
      if (!this.isVisibleInViewport || document.hidden || isAnyModalOpen()) return;
      const video = this.getActiveVideo();
      if (!video?.getAttribute('src')) return;
      video.play().then(() => {
        // A modal/scroll may have happened while play() was pending.
        if (!this.isVisibleInViewport || document.hidden || isAnyModalOpen()) { video.pause(); return; }
        this.isPlaying = true;
        if (this.unblockBtn) this.unblockBtn.style.display = 'none';
      }).catch(error => {
        if (error.name !== 'AbortError' && this.unblockBtn) this.unblockBtn.style.display = 'flex';
      });
    }
    advanceToNext() {
      if (!this.playlist.length) return;
      const last = this.shuffledIndices[this.currentShufflePos];
      this.currentShufflePos++;
      if (this.currentShufflePos >= this.shuffledIndices.length) {
        this.shuffledIndices = createShuffledIndices(this.playlist.length, last);
        this.currentShufflePos = 0;
      }
      this.suspendedTime = 0;
      this.updateLabels();
      if (this.isVisibleInViewport && !document.hidden && !isAnyModalOpen()) this.loadCurrentVideo(true);
      else this.releasePreview();
    }
    pausePreview() {
      [this.videoA, this.videoB].forEach(video => video?.pause());
      this.isPlaying = false;
    }
    releasePreview() {
      this.suspendedTime = this.getActiveVideo()?.currentTime || 0;
      this.loadToken++;
      this.loading = false;
      [this.videoA, this.videoB].forEach(video => {
        if (!video) return;
        video.oncanplay = null;
        video.pause();
        if (video.hasAttribute('src')) { video.removeAttribute('src'); video.load(); }
        video.preload = 'none';
      });
      this.isPlaying = false;
    }
    resumePreview() {
      if (!this.isVisibleInViewport || document.hidden || isAnyModalOpen()) return;
      if (!this.getActiveVideo()?.getAttribute('src')) {
        if (!this.loading) this.loadCurrentVideo();
      } else if (!this.loading) this.playActive();
    }
    openInModal() {
      const item = this.getCurrentItem();
      if (!item || !videoModal || !modalVideo) return;
      // Stop both card downloads so bandwidth is available for the selected video.
      productiveController.releasePreview();
      videosController.releasePreview();
      if (videoModalTitle) videoModalTitle.textContent = item.title;
      if (videoModalCategory) videoModalCategory.textContent = this.displayCategory;
      modalVideo.poster = item.poster || '';
      modalVideo.preload = 'auto';
      modalVideo.src = encodeURI(item.src);
      modalVideo.muted = false;
      modalVideo.volume = 1;
      lastFocusedTrigger = this.frameEl;
      videoModal.classList.add('open');
      document.body.classList.add('modal-open');
      // Start the complete video at the beginning, independently of its short preview.
      modalVideo.play().catch(error => {
        if (error.name === 'NotAllowedError' && videoModal.classList.contains('open')) {
          modalVideo.muted = true;
          modalVideo.play().catch(() => {});
        }
      });
      videoModalCloseBtn?.focus();
    }
  }

  // --- Sample Projects Rotating Gallery Controller ---
  class SampleProjectsController {
    constructor(config) {
      this.frameId = config.frameId;
      this.titleId = config.titleId;
      this.categoryId = config.categoryId;
      this.counterId = config.counterId;
      this.descId = config.descId;
      this.prevBtnId = config.prevBtnId;
      this.nextBtnId = config.nextBtnId;

      this.frameEl = document.getElementById(this.frameId);
      this.titleEl = document.getElementById(this.titleId);
      this.categoryEl = document.getElementById(this.categoryId);
      this.counterEl = document.getElementById(this.counterId);
      this.descEl = document.getElementById(this.descId);
      this.prevBtn = document.getElementById(this.prevBtnId);
      this.nextBtn = document.getElementById(this.nextBtnId);

      this.imgA = this.frameEl ? this.frameEl.querySelector('.img-layer-a') : null;
      this.imgB = this.frameEl ? this.frameEl.querySelector('.img-layer-b') : null;

      this.activeLayer = 'a';
      this.items = [];
      this.currentIndex = 0;
      this.rotateTimer = null;
      this.intervalMs = 4800;

      this.initEvents();
    }

    setItems(items) {
      if (!items || items.length === 0) return;
      this.items = items;
      this.currentIndex = 0;
      this.updateView(false);
      this.startRotation();
    }

    getCurrentItem() {
      if (this.items.length === 0) return null;
      return this.items[this.currentIndex];
    }

    getActiveImg() {
      return this.activeLayer === 'a' ? this.imgA : this.imgB;
    }

    getInactiveImg() {
      return this.activeLayer === 'a' ? this.imgB : this.imgA;
    }

    initEvents() {
      if (!this.frameEl) return;

      if (this.prevBtn) {
        this.prevBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.step(-1);
        });
      }

      if (this.nextBtn) {
        this.nextBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.step(1);
        });
      }

      this.frameEl.addEventListener('click', () => {
        this.openLightbox();
      });

      this.frameEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openLightbox();
        }
      });
    }

    step(direction) {
      if (this.items.length === 0) return;
      this.currentIndex = (this.currentIndex + direction + this.items.length) % this.items.length;
      this.updateView(true);
      this.restartRotation();
    }

    startRotation() {
      this.stopRotation();
      this.rotateTimer = setInterval(() => {
        if (!document.hidden && !isAnyModalOpen()) {
          this.step(1);
        }
      }, this.intervalMs);
    }

    stopRotation() {
      if (this.rotateTimer) {
        clearInterval(this.rotateTimer);
        this.rotateTimer = null;
      }
    }

    restartRotation() {
      this.stopRotation();
      this.startRotation();
    }

    updateView(animate = true) {
      const item = this.getCurrentItem();
      if (!item) return;

      const active = this.getActiveImg();
      const inactive = this.getInactiveImg();

      if (this.titleEl) this.titleEl.textContent = item.title;
      if (this.categoryEl) this.categoryEl.textContent = item.category;
      if (this.descEl) this.descEl.textContent = item.desc;
      if (this.counterEl) this.counterEl.textContent = `${this.currentIndex + 1} / ${this.items.length}`;

      if (animate && active && inactive) {
        inactive.src = item.src;
        inactive.alt = item.title;
        inactive.onload = () => {
          inactive.classList.add('active');
          active.classList.remove('active');
          this.activeLayer = this.activeLayer === 'a' ? 'b' : 'a';
        };
      } else if (active) {
        active.src = item.src;
        active.alt = item.title;
        active.classList.add('active');
      }
    }

    openLightbox() {
      const item = this.getCurrentItem();
      if (!item || !lightboxModal || !lightboxImg) return;

      lastFocusedTrigger = this.frameEl;
      lightboxImg.src = item.src;
      lightboxImg.alt = item.title;
      if (lightboxCaption) {
        lightboxCaption.innerHTML = `<strong>${item.category}</strong> — ${item.title}`;
      }

      lightboxModal.classList.add('open');
      document.body.classList.add('modal-open');
      if (lightboxCloseBtn) lightboxCloseBtn.focus();
    }
  }

  // Check if any modal is currently active
  function isAnyModalOpen() {
    return (
      (admissionModal && admissionModal.classList.contains('open')) ||
      (videoModal && videoModal.classList.contains('open')) ||
      (lightboxModal && lightboxModal.classList.contains('open')) ||
      (document.getElementById('course-details-modal') && document.getElementById('course-details-modal').classList.contains('open'))
    );
  }

  // Instantiate Controllers
  const productiveController = new PortraitVideoController({
    cardId: 'card-ai-productive',
    frameId: 'frame-ai-productive',
    titleId: 'title-ai-productive',
    counterId: 'counter-ai-productive',
    unblockId: 'unblock-ai-productive',
    playlistKey: 'aiProductive',
    displayCategory: 'AI Productive Reel'
  });

  const videosController = new PortraitVideoController({
    cardId: 'card-ai-videos',
    frameId: 'frame-ai-videos',
    titleId: 'title-ai-videos',
    counterId: 'counter-ai-videos',
    unblockId: 'unblock-ai-videos',
    playlistKey: 'aiVideos',
    displayCategory: 'AI Videos Showcase'
  });

  const sampleProjectsController = new SampleProjectsController({
    frameId: 'frame-sample-projects',
    titleId: 'title-sample-projects',
    categoryId: 'cat-sample-projects',
    counterId: 'counter-sample-projects',
    descId: 'desc-sample-projects',
    prevBtnId: 'gallery-prev-btn',
    nextBtnId: 'gallery-next-btn'
  });

  // The production build embeds optimized URLs; initialize once to avoid duplicate downloads.
  const applyManifest = data => {
    mediaManifest = data;
    productiveController.setPlaylist(data.aiProductive);
    videosController.setPlaylist(data.aiVideos);
    sampleProjectsController.setItems(data.sampleProjects);
  };
  const embeddedManifest = document.getElementById('media-manifest');
  if (embeddedManifest) {
    applyManifest(JSON.parse(embeddedManifest.textContent));
  } else {
    fetch('media-manifest.json').then(response => {
      if (!response.ok) throw new Error('Unable to load media');
      return response.json();
    }).then(applyManifest).catch(() => applyManifest(defaultManifest));
  }

  // --- Close Video Modal Handler ---
  function closeVideoModal() {
    if (!videoModal || !modalVideo) return;
    modalVideo.pause();
    modalVideo.removeAttribute('src');
    modalVideo.load();

    videoModal.classList.remove('open');
    document.body.classList.remove('modal-open');

    if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === 'function') {
      lastFocusedTrigger.focus();
    }

    // Resume eligible visible previews
    productiveController.resumePreview();
    videosController.resumePreview();
  }

  if (videoModalCloseBtn) {
    videoModalCloseBtn.addEventListener('click', closeVideoModal);
  }

  if (videoModal) {
    videoModal.addEventListener('click', (e) => {
      if (e.target === videoModal) {
        closeVideoModal();
      }
    });
  }

  // --- Close Lightbox Modal Handler ---
  function closeLightboxModal() {
    if (!lightboxModal) return;
    lightboxModal.classList.remove('open');
    document.body.classList.remove('modal-open');

    if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === 'function') {
      lastFocusedTrigger.focus();
    }
  }

  if (lightboxCloseBtn) {
    lightboxCloseBtn.addEventListener('click', closeLightboxModal);
  }

  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal || e.target.classList.contains('lightbox-dialog')) {
        closeLightboxModal();
      }
    });
  }

  // --- Classroom Gallery Items Lightbox ---
  const galleryItems = document.querySelectorAll('.gallery-item');
  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      const caption = item.querySelector('.gallery-caption h4');
      if (img && lightboxModal && lightboxImg) {
        lastFocusedTrigger = item;
        lightboxImg.src = img.src;
        lightboxImg.alt = caption ? caption.textContent : 'Classroom Environment';
        if (lightboxCaption) {
          lightboxCaption.textContent = caption ? caption.textContent : 'Classroom Environment';
        }
        lightboxModal.classList.add('open');
        document.body.classList.add('modal-open');
        if (lightboxCloseBtn) lightboxCloseBtn.focus();
      }
    });
  });

  // --- Global Escape Key Listener ---
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (admissionModal && admissionModal.classList.contains('open')) {
        closeAdmissionModal();
      }
      if (videoModal && videoModal.classList.contains('open')) {
        closeVideoModal();
      }
      if (lightboxModal && lightboxModal.classList.contains('open')) {
        closeLightboxModal();
      }
      const courseModal = document.getElementById('course-details-modal');
      if (courseModal && courseModal.classList.contains('open')) {
        courseModal.classList.remove('open');
        document.body.classList.remove('modal-open');
      }
    }
  });

  // --- Viewport & Visibility Observers for Performance & Battery ---
  const mediaCardsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.target.id === 'card-ai-productive') {
        productiveController.isVisibleInViewport = entry.isIntersecting;
        if (entry.isIntersecting) {
          productiveController.resumePreview();
        } else {
          productiveController.releasePreview();
        }
      } else if (entry.target.id === 'card-ai-videos') {
        videosController.isVisibleInViewport = entry.isIntersecting;
        if (entry.isIntersecting) {
          videosController.resumePreview();
        } else {
          videosController.releasePreview();
        }
      }
    });
  }, { threshold: 0.15 });

  const cardProd = document.getElementById('card-ai-productive');
  const cardVid = document.getElementById('card-ai-videos');
  if (cardProd) mediaCardsObserver.observe(cardProd);
  if (cardVid) mediaCardsObserver.observe(cardVid);

  // Tab Visibility Change: pause offscreen / inactive previews
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      productiveController.releasePreview();
      videosController.releasePreview();
      if (modalVideo && !modalVideo.paused) {
        modalVideo.pause();
      }
    } else {
      productiveController.resumePreview();
      videosController.resumePreview();
    }
  });

  // ==========================================================================
  // 7. COURSE DETAILS MODAL DATA & FUNCTIONALITY
  // ==========================================================================
  const courseDetailsData = {
    adca: {
      title: 'ADCA+ with AI (Advanced Diploma in Computer Applications)',
      duration: '6 Months',
      badge: 'FREE AI Training Included',
      description: 'Develop practical computer skills for everyday office work, document creation, design, and digital productivity.',
      topics: [
        'Computer Fundamentals & Operating Systems',
        'MS Paint (Drawing & Mouse Control Mastery)',
        'MS Word (Official Documents, Tables & Layouts)',
        'MS Excel (Formulas, Functions & Data Worksheets)',
        'MS PowerPoint (Professional Presentations)',
        'Hindi & English Fast Touch Typing',
        'Adobe Photoshop (Photo Editing & Poster Making)',
        'CorelDRAW (Vector Logos & Vector Design)',
        'Adobe PageMaker (Desktop Publishing & Printing)',
        'Canva (Digital Posters & Social Media Graphics)',
        'Basic HTML & CSS (Web Page Structure & Styling)',
        'AI-Assisted Productivity (ChatGPT, Claude & Canva AI)'
      ],
      tools: 'Word, Excel, PowerPoint, Photoshop, CorelDRAW, PageMaker, Canva, HTML5, CSS3, ChatGPT, Claude'
    },
    tally: {
      title: 'Tally with GST (Professional Business Accounting)',
      duration: '3 Months + 1 Month Practical Training',
      badge: 'FREE AI Training Included',
      description: 'Learn accounting workflows and practise working with business transactions in Tally.',
      topics: [
        'Accounting Fundamentals & Financial Concepts',
        'Company Creation & Configuration in TallyPrime',
        'Chart of Accounts: Ledgers & Accounting Groups',
        'Accounting Voucher Entries (Receipt, Payment, Journal)',
        'Sales & Purchase Transactions with E-Way Billing',
        'Inventory Management, Stock Items & Units of Measure',
        'GST Entries (CGST, SGST, IGST) & Tax Invoicing',
        'Financial Reports (Balance Sheet, Profit & Loss, Trial Balance)',
        'Bank Reconciliation Statements (BRS)',
        'Practical Accounting Assignments with Real Business Data'
      ],
      tools: 'TallyPrime, Tally.ERP 9, Microsoft Excel for Accounting'
    },
    video: {
      title: 'Video Editing (Social Media & Commercial Projects)',
      duration: '8 Months',
      badge: 'FREE AI Training Included',
      description: 'Build video editing skills for social media, promotional content, and creative projects.',
      topics: [
        'Video Editing Fundamentals, Sequence & Aspect Ratios',
        'Adobe Premiere Pro Workspace & Timeline Workflows',
        'Cuts, Transitions, Pacing & Storytelling',
        'Audio Editing, Sound Effects, Beats & Voice Enhancement',
        'Color Correction (LOG to Rec.709) & Color Grading',
        'Adobe After Effects Basics: Keyframing & Lower Thirds',
        'Motion Graphics & Animated Titles',
        'Viral Reels & Short-form Social Media Content',
        'AI-Assisted Creative Workflows (Claude, Higgsfield, Prompting)',
        'Real Portfolio Projects & Commercial Video Exports'
      ],
      tools: 'Adobe Premiere Pro, Adobe After Effects, Claude AI, Higgsfield AI'
    },
    csc: {
      title: 'CSC Advance (Digital Services & Documentation Work)',
      duration: '1 Year',
      badge: 'FREE AI Training Included',
      description: 'Develop practical skills for common online services, documentation, and digital service work.',
      topics: [
        'Online Government & Public Service Portal Workflows',
        'Document Scanning, Resizing & Professional Printing',
        'High-Impact Resume & Biodata Creation',
        'PDF Tools (Merging, Splitting, Compression & Conversion)',
        'PAN Card Application & Correction Procedures',
        'Voter ID Card Online Services & Registrations',
        'Online Examination & Job Application Form Filling',
        'Digital Documentation & Customer Service Handling',
        'Digital Service Business Setup & Day-to-Day Operations'
      ],
      tools: 'Online Portals, Epson/Canon Scanning Software, Adobe Acrobat, MS Office'
    }
  };

  const courseModal = document.getElementById('course-details-modal');
  const modalTitle = document.getElementById('modal-course-title');
  const modalDuration = document.getElementById('modal-course-duration');
  const modalDesc = document.getElementById('modal-course-desc');
  const modalTopicsList = document.getElementById('modal-course-topics');
  const modalToolsText = document.getElementById('modal-course-tools');
  const modalEnquireBtn = document.getElementById('modal-enquire-btn');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  function openCourseModal(courseKey) {
    const data = courseDetailsData[courseKey];
    if (!data || !courseModal) return;

    modalTitle.textContent = data.title;
    modalDuration.textContent = `Duration: ${data.duration}`;
    modalDesc.textContent = data.description;
    modalToolsText.textContent = data.tools;

    modalTopicsList.innerHTML = '';
    data.topics.forEach(topic => {
      const li = document.createElement('li');
      li.innerHTML = `<span style="color: #F5C518; margin-right: 6px;">✓</span> ${topic}`;
      modalTopicsList.appendChild(li);
    });

    const shortCourseName = data.title.split(' (')[0];
    modalEnquireBtn.setAttribute('data-course', shortCourseName);

    courseModal.classList.add('open');
    document.body.classList.add('modal-open');
    if (modalCloseBtn) modalCloseBtn.focus();
  }

  function closeCourseModal() {
    if (!courseModal) return;
    courseModal.classList.remove('open');
    document.body.classList.remove('modal-open');
  }

  document.querySelectorAll('.course-details-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const courseKey = btn.getAttribute('data-course-id');
      openCourseModal(courseKey);
    });
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeCourseModal);
  }

  if (courseModal) {
    courseModal.addEventListener('click', (e) => {
      if (e.target === courseModal) closeCourseModal();
    });
  }

  // ==========================================================================
  // 8. FREQUENTLY ASKED QUESTIONS (ACCORDION)
  // ==========================================================================
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    const content = item.querySelector('.faq-content');

    if (trigger && content) {
      trigger.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        faqItems.forEach(otherItem => {
          otherItem.classList.remove('active');
          const otherTrigger = otherItem.querySelector('.faq-trigger');
          const otherContent = otherItem.querySelector('.faq-content');
          if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
          if (otherContent) otherContent.style.maxHeight = null;
        });

        if (!isActive) {
          item.classList.add('active');
          trigger.setAttribute('aria-expanded', 'true');
          content.style.maxHeight = content.scrollHeight + 'px';
        } else {
          item.classList.remove('active');
          trigger.setAttribute('aria-expanded', 'false');
          content.style.maxHeight = null;
        }
      });
    }
  });

  if (faqItems.length > 0) {
    const firstTrigger = faqItems[0].querySelector('.faq-trigger');
    if (firstTrigger) firstTrigger.click();
  }

  // ==========================================================================
  // 9. DYNAMIC COPYRIGHT YEAR
  // ==========================================================================
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});
