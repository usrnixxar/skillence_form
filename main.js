/**
 * Skillence Academy - Main JavaScript
 * Institutional Admissions & Interactive Features
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // --- 1. STICKY HEADER & SCROLL BEHAVIOR ---
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
  handleScroll(); // Initial check

  // --- 2. ACTIVE SECTION SCROLLSPY ---
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

  // --- 3. MOBILE MENU TOGGLE ---
  const navToggleBtn = document.getElementById('nav-toggle-btn');
  const navMenu = document.getElementById('nav-menu');

  if (navToggleBtn && navMenu) {
    navToggleBtn.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      navToggleBtn.classList.toggle('open', isOpen);
      navToggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.classList.toggle('modal-open', isOpen);
    });

    // Close mobile menu on clicking any link
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        navToggleBtn.classList.remove('open');
        navToggleBtn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('modal-open');
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
        navToggleBtn.classList.remove('open');
        navToggleBtn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('modal-open');
      }
    });
  }

  // --- 4. ADMISSIONS ENQUIRY FORM VALIDATION & WHATSAPP GENERATOR ---
  const enquiryForm = document.getElementById('admissions-enquiry-form');
  const nameInput = document.getElementById('enquiry-name');
  const phoneInput = document.getElementById('enquiry-phone');
  const emailInput = document.getElementById('enquiry-email');
  const courseSelect = document.getElementById('enquiry-course');
  const cityInput = document.getElementById('enquiry-city');
  const formStatus = document.getElementById('form-status-msg');

  function clearErrors() {
    document.querySelectorAll('.field-error-msg').forEach(msg => {
      msg.classList.remove('visible');
      msg.textContent = '';
    });
    document.querySelectorAll('.form-control').forEach(input => {
      input.classList.remove('input-error');
    });
    if (formStatus) {
      formStatus.textContent = '';
      formStatus.className = 'form-helper-text';
    }
  }

  function showError(inputElement, errorElementId, message) {
    inputElement.classList.add('input-error');
    const errEl = document.getElementById(errorElementId);
    if (errEl) {
      errEl.textContent = message;
      errEl.classList.add('visible');
    }
  }

  // Clean phone number helper
  function validateIndianPhone(phone) {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    // Supports 10 digits, or +91 / 91 / 0 prefix followed by 10 digits starting with 6-9
    const regex = /^(?:\+?91|0)?[6789]\d{9}$/;
    return {
      isValid: regex.test(cleaned),
      cleaned: cleaned.replace(/^(?:\+?91|0)/, '')
    };
  }

  function validateEmail(email) {
    if (!email) return true; // Optional field
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
  }

  if (enquiryForm) {
    // Realtime error clearing on input
    [nameInput, phoneInput, emailInput, courseSelect, cityInput].forEach(field => {
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

    enquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      clearErrors();

      let hasError = false;
      let firstErrorField = null;

      const nameVal = nameInput.value.trim();
      const phoneVal = phoneInput.value.trim();
      const emailVal = emailInput ? emailInput.value.trim() : '';
      const courseVal = courseSelect.value;
      const cityVal = cityInput ? cityInput.value.trim() : '';

      // Validate Name
      if (!nameVal || nameVal.length < 2) {
        showError(nameInput, 'error-enquiry-name', 'Please enter your full name (minimum 2 characters).');
        hasError = true;
        if (!firstErrorField) firstErrorField = nameInput;
      }

      // Validate Phone Number
      const phoneCheck = validateIndianPhone(phoneVal);
      if (!phoneVal) {
        showError(phoneInput, 'error-enquiry-phone', 'Please enter your 10-digit mobile number.');
        hasError = true;
        if (!firstErrorField) firstErrorField = phoneInput;
      } else if (!phoneCheck.isValid) {
        showError(phoneInput, 'error-enquiry-phone', 'Please enter a valid 10-digit Indian phone number.');
        hasError = true;
        if (!firstErrorField) firstErrorField = phoneInput;
      }

      // Validate Course
      if (!courseVal) {
        showError(courseSelect, 'error-enquiry-course', 'Please select a course or "Help Me Choose".');
        hasError = true;
        if (!firstErrorField) firstErrorField = courseSelect;
      }

      // Validate Email if provided
      if (emailVal && !validateEmail(emailVal)) {
        showError(emailInput, 'error-enquiry-email', 'Please enter a valid email address.');
        hasError = true;
        if (!firstErrorField) firstErrorField = emailInput;
      }

      if (hasError) {
        if (firstErrorField) firstErrorField.focus();
        return;
      }

      // Construct formatted WhatsApp message
      let messageLines = [
        'Hello Skillence Academy,',
        'I would like to enquire about your courses.',
        `Name: ${nameVal}`,
        `Phone: ${phoneVal}`,
        `Course: ${courseVal}`
      ];

      if (emailVal) {
        messageLines.push(`Email: ${emailVal}`);
      }
      if (cityVal) {
        messageLines.push(`City / Area: ${cityVal}`);
      }

      messageLines.push('Please share the course details and available batch timings.');

      const fullMessage = messageLines.join('\n');
      const whatsappUrl = `https://wa.me/919060828274?text=${encodeURIComponent(fullMessage)}`;

      // Show friendly helper message
      if (formStatus) {
        formStatus.textContent = 'Redirecting to WhatsApp to send your enquiry message...';
        formStatus.style.color = '#F5C518';
      }

      // Optional Backend sync to /api/leads if server is running
      try {
        fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: nameVal,
            phone: phoneVal,
            course: courseVal,
            email: emailVal,
            city: cityVal,
            submittedAt: new Date().toISOString()
          })
        }).catch(() => {
          // Ignore if running without custom backend
        });
      } catch (err) {
        // Silent catch
      }

      // Open WhatsApp in new tab/window
      setTimeout(() => {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }, 300);
    });
  }

  // --- 5. COURSE ENQUIRE NOW BUTTONS (AUTO-SELECT & SMOOTH SCROLL) ---
  const courseEnquireBtns = document.querySelectorAll('.course-enquire-btn');

  courseEnquireBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const courseName = btn.getAttribute('data-course');
      
      if (courseSelect && courseName) {
        let matchOption = Array.from(courseSelect.options).find(opt => opt.value === courseName);
        if (matchOption) {
          courseSelect.value = courseName;
          courseSelect.classList.remove('input-error');
        }
      }

      // Scroll smoothly to enquiry form
      const formCard = document.querySelector('.hero-form-card');
      if (formCard) {
        formCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Subtle focus highlight
        formCard.style.boxShadow = '0 0 25px rgba(245, 197, 24, 0.7)';
        setTimeout(() => {
          formCard.style.boxShadow = '';
          if (nameInput) nameInput.focus();
        }, 800);
      }
    });
  });

  // --- 6. COURSE DETAILS MODAL DATA & FUNCTIONALITY ---
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

    modalEnquireBtn.setAttribute('data-course', data.title.split(' (')[0]);

    courseModal.classList.add('open');
    document.body.classList.add('modal-open');
    modalCloseBtn.focus();
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

  if (modalEnquireBtn) {
    modalEnquireBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const courseName = modalEnquireBtn.getAttribute('data-course');
      closeCourseModal();
      
      if (courseSelect && courseName) {
        let matchOption = Array.from(courseSelect.options).find(opt => opt.value.includes(courseName) || courseName.includes(opt.value));
        if (matchOption) {
          courseSelect.value = matchOption.value;
        }
      }

      const formCard = document.querySelector('.hero-form-card');
      if (formCard) {
        formCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          if (nameInput) nameInput.focus();
        }, 600);
      }
    });
  }

  // --- 7. CLASSROOM GALLERY LIGHTBOX ---
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightboxModal = document.getElementById('gallery-lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');

  function openLightbox(src, caption) {
    if (!lightboxModal || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxCaption.textContent = caption;
    lightboxModal.classList.add('open');
    document.body.classList.add('modal-open');
  }

  function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.classList.remove('open');
    document.body.classList.remove('modal-open');
  }

  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      const caption = item.querySelector('.gallery-caption h4');
      if (img) {
        openLightbox(img.src, caption ? caption.textContent : 'Classroom Environment');
      }
    });
  });

  if (lightboxCloseBtn) {
    lightboxCloseBtn.addEventListener('click', closeLightbox);
  }

  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal || e.target.classList.contains('lightbox-dialog')) {
        closeLightbox();
      }
    });
  }

  // Global Escape Key Listener for Modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCourseModal();
      closeLightbox();
    }
  });

  // --- 8. FREQUENTLY ASKED QUESTIONS (ACCORDION) ---
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    const content = item.querySelector('.faq-content');

    if (trigger && content) {
      trigger.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close all other items
        faqItems.forEach(otherItem => {
          otherItem.classList.remove('active');
          const otherTrigger = otherItem.querySelector('.faq-trigger');
          const otherContent = otherItem.querySelector('.faq-content');
          if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
          if (otherContent) otherContent.style.maxHeight = null;
        });

        // Toggle current item
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

  // Open first FAQ by default
  if (faqItems.length > 0) {
    const firstTrigger = faqItems[0].querySelector('.faq-trigger');
    if (firstTrigger) firstTrigger.click();
  }

  // --- 9. DYNAMIC COPYRIGHT YEAR ---
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});
