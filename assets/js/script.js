'use strict';

/* ============================================================
   SURJYA KAMAL SAHA — PORTFOLIO INTERACTIONS
   Single-scroll unified portfolio
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* ── Navbar entrance animation ─────────────────────────── */
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    setTimeout(() => {
      navbar.classList.add('visible');
    }, 500);

    /* ── Navbar scroll effect ──────────────────────────────── */
    function handleNavScroll() {
      if (window.scrollY > 40) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
    window.addEventListener('scroll', handleNavScroll, { passive: true });
    handleNavScroll();
  }

  /* ── Mobile nav toggle ────────────────────────────────── */
  const navToggle = document.querySelector('.nav-toggle');
  const navMobile = document.querySelector('.nav-mobile');
  if (navToggle && navMobile) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      navMobile.classList.toggle('open');
      const isOpen = navMobile.classList.contains('open');
      navToggle.setAttribute('aria-expanded', isOpen.toString());
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    // Close on link click
    navMobile.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('open');
        navMobile.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── Active nav link on scroll (scroll spy) ───────────── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[data-section]');

  function updateActiveLink() {
    const scrollPos = window.scrollY + 100;
    let current = '';
    sections.forEach(section => {
      if (section.offsetTop <= scrollPos) {
        current = section.id;
      }
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === current);
    });
  }
  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink();

  /* ── Smooth scroll for nav links ──────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });

        // Dispatch custom event for 3D camera spline sync
        const targetId = href.replace('#', '');
        const navEvent = new CustomEvent('navigate-section', {
          detail: { section: targetId }
        });
        window.dispatchEvent(navEvent);
      }
    });
  });

  /* ── Scroll reveal ────────────────────────────────────── */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReducedMotion) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  } else {
    // If reduced motion — just show everything
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  }

  /* ── Count-up animation ───────────────────────────────── */
  function animateCountUp(el) {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    let current = 0;
    const duration = 1400;
    const steps = 50;
    const increment = target / steps;
    const stepMs = duration / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.round(current) + suffix;
    }, stepMs);
  }

  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.stat-number').forEach(animateCountUp);
        statObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) statObserver.observe(heroStats);

  /* ── Typing animation ─────────────────────────────────── */
  const typingEl = document.getElementById('typing-text');
  if (typingEl) {
    const words = ['Fullstack Developer', 'ML Engineer', 'Data Scientist', 'Problem Solver'];
    let wordIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function type() {
      const currentWord = words[wordIndex];
      if (deleting) {
        typingEl.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;
      } else {
        typingEl.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;
      }

      if (!deleting && charIndex === currentWord.length) {
        deleting = true;
        setTimeout(type, 1800);
      } else if (deleting && charIndex === 0) {
        deleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        setTimeout(type, 300);
      } else {
        setTimeout(type, deleting ? 55 : 90);
      }
    }
    setTimeout(type, 800);
  }

  /* ── Prevent dead anchor links ────────────────────────── */
  document.addEventListener('click', function (e) {
    const link = e.target.closest('a[href="#"]');
    if (link) e.preventDefault();
  });

});
