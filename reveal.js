// 1) Scroll-reveal: fades/slides .reveal sections in as they enter view.
// 2) Count-up: animates the numbers in .stat-card h2 once the stats
//    section is visible.
// 3) Nav shadow: adds a slightly deeper shadow to the nav once the page
//    has scrolled, so it reads as "lifted" above the content.
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var revealTargets = document.querySelectorAll('.reveal');
  var statNumbers = document.querySelectorAll('.stat-card h2[data-count]');

  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) {
      el.textContent = target + suffix;
      return;
    }
    var duration = 1200;
    var start = null;

    function step(timestamp) {
      if (!start) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      var current = Math.round(eased * target);
      el.textContent = current + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (!('IntersectionObserver' in window)) {
    revealTargets.forEach(function (el) { el.classList.add('in-view'); });
    statNumbers.forEach(animateCount);
  } else {
    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');

            // If this is the stats section, trigger the count-up once.
            var counters = entry.target.querySelectorAll('h2[data-count]');
            counters.forEach(animateCount);

            sectionObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -40px 0px' }
    );

    revealTargets.forEach(function (el) { sectionObserver.observe(el); });
  }

  // Nav scroll shadow
  var nav = document.querySelector('nav');
  if (nav) {
    var toggleNavShadow = function () {
      nav.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    toggleNavShadow();
    window.addEventListener('scroll', toggleNavShadow, { passive: true });
  }
})();
