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

  // ---------------------------------------------------------------------
  // Knowledge Base — reads knowledge-base/manifest.json and renders it.
  // To add a resource: drop the file in knowledge-base/files/, add an
  // entry to manifest.json, commit & push. See knowledge-base/README.md.
  // ---------------------------------------------------------------------
  var kbGrid = document.getElementById('kb-grid');
  if (kbGrid) {
    var kbSearch = document.getElementById('kb-search');
    var kbItems = [];

    var typeMeta = {
      pdf: { icon: '📄', label: 'PDF' },
      doc: { icon: '📝', label: 'Doc' },
      link: { icon: '🔗', label: 'Link' }
    };

    function escapeHtml(str) {
      var div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    function renderKb(items) {
      if (!items.length) {
        kbGrid.innerHTML = '<p class="kb-status">No resources match that search.</p>';
        return;
      }
      kbGrid.innerHTML = items.map(function (item, i) {
        var meta = typeMeta[item.type] || typeMeta.link;
        var tags = (item.tags || []).map(function (t) {
          return '<li>' + escapeHtml(t) + '</li>';
        }).join('');
        return (
          '<article class="kb-card" style="animation-delay:' + (i * 0.05) + 's">' +
            '<span class="kb-type">' + meta.icon + ' ' + meta.label + '</span>' +
            '<h3>' + escapeHtml(item.title) + '</h3>' +
            '<p>' + escapeHtml(item.description || '') + '</p>' +
            (tags ? '<ul class="kb-tags">' + tags + '</ul>' : '') +
            '<a class="kb-link" href="' + item.url + '" target="_blank" rel="noopener noreferrer">' +
              (item.type === 'link' ? 'Visit resource' : 'View / Download') +
            '</a>' +
          '</article>'
        );
      }).join('');
    }

    fetch('knowledge-base/manifest.json')
      .then(function (res) {
        if (!res.ok) throw new Error('manifest not found');
        return res.json();
      })
      .then(function (data) {
        kbItems = (data || []).slice().sort(function (a, b) {
          return (b.dateAdded || '').localeCompare(a.dateAdded || '');
        });
        renderKb(kbItems);
      })
      .catch(function () {
        kbGrid.innerHTML = '<p class="kb-status">The knowledge base is still being set up — check back soon.</p>';
      });

    if (kbSearch) {
      kbSearch.addEventListener('input', function () {
        var q = kbSearch.value.trim().toLowerCase();
        if (!q) { renderKb(kbItems); return; }
        var filtered = kbItems.filter(function (item) {
          var haystack = (
            item.title + ' ' + (item.description || '') + ' ' + (item.tags || []).join(' ')
          ).toLowerCase();
          return haystack.indexOf(q) !== -1;
        });
        renderKb(filtered);
      });
    }
  }
})();
