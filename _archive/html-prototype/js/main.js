/* ============================================
   DAŽAI KIRPĖJAMS — Main JS
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Header scroll effect
  const header = document.querySelector('.header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  });

  // Mobile menu toggle
  const burger = document.querySelector('.burger');
  const navLinks = document.querySelector('.nav-links');

  if (burger) {
    burger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      burger.classList.toggle('active');
    });

    // Close menu on link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        burger.classList.remove('active');
      });
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Intersection Observer for scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // Cart button click feedback
  document.querySelectorAll('.product-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Find shade ID from parent product card's data-shade attribute
      const card = btn.closest('.product-card');
      const shadeId = card ? card.dataset.shade : null;
      if (shadeId && typeof Cart !== 'undefined') {
        Cart.addItem(shadeId, 1);
      }

      const original = btn.innerHTML;
      btn.innerHTML = '&#10003;';
      btn.style.background = 'var(--magenta)';
      btn.style.color = 'var(--white)';
      setTimeout(() => {
        btn.innerHTML = original;
        btn.style.background = '';
        btn.style.color = '';
      }, 1200);
    });
  });

  // Newsletter form — only block submission if no Formspree action configured
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      const action = newsletterForm.getAttribute('action');
      if (action && action.indexOf('formspree.io') !== -1 && action.indexOf('YOUR_FORM_ID') === -1) {
        // Formspree is configured — allow native form submission
        return;
      }
      // Fallback: block submission if Formspree is not yet configured
      e.preventDefault();
      const input = newsletterForm.querySelector('input[type="email"]');
      if (input && input.value.trim()) {
        input.value = '';
        input.placeholder = 'Ačiū! Užsiprenumeravote.';
        setTimeout(() => {
          input.placeholder = 'Jūsų el. paštas';
        }, 3000);
      }
    });
  }

  // B2B form — only block submission if no Formspree action configured
  const b2bForm = document.querySelector('.b2b-form');
  if (b2bForm) {
    b2bForm.addEventListener('submit', (e) => {
      const action = b2bForm.getAttribute('action');
      if (action && action.indexOf('formspree.io') !== -1 && action.indexOf('YOUR_FORM_ID') === -1) {
        // Formspree is configured — allow native form submission
        return;
      }
      // Fallback: block submission if Formspree is not yet configured
      e.preventDefault();
      const btn = b2bForm.querySelector('.btn');
      const originalText = btn.textContent;
      btn.textContent = 'Užklausa išsiųsta!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        b2bForm.reset();
      }, 3000);
    });
  }

  // Language switcher
  document.querySelectorAll('.nav-lang a').forEach(lang => {
    lang.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-lang a').forEach(l => l.classList.remove('active'));
      lang.classList.add('active');
    });
  });
});
