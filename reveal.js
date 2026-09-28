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
      video: { icon: '🎬', label: 'Video' },
      link: { icon: '🔗', label: 'Link' }
    };

    function escapeHtml(str) {
      var div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    function isDirectVideoFile(url) {
      return /\.(mp4|webm|ogv|mov)$/i.test(url);
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

        var mediaHtml = '';
        var linkHtml;
        if (item.type === 'video' && isDirectVideoFile(item.url)) {
          // Self-hosted video file — play inline in the card.
          mediaHtml = '<video class="kb-video" controls preload="metadata" src="' + item.url + '"></video>';
          linkHtml = '';
        } else {
          linkHtml = (
            '<a class="kb-link" href="' + item.url + '" target="_blank" rel="noopener noreferrer">' +
              (item.type === 'video' ? '▶ Watch video' : item.type === 'link' ? 'Visit resource' : 'View / Download') +
            '</a>'
          );
        }

        return (
          '<article class="kb-card" style="animation-delay:' + (i * 0.05) + 's">' +
            '<span class="kb-type">' + meta.icon + ' ' + meta.label + '</span>' +
            '<h3>' + escapeHtml(item.title) + '</h3>' +
            mediaHtml +
            '<p>' + escapeHtml(item.description || '') + '</p>' +
            (tags ? '<ul class="kb-tags">' + tags + '</ul>' : '') +
            linkHtml +
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
  // ---------------------------------------------------------------------
  // Custom cursor — a dark-red arrow that follows the mouse and reacts
  // (grows + shifts to gold) over anything clickable. Only enabled on
  // devices that actually have a mouse; touch devices are left alone.
  // ---------------------------------------------------------------------
  var supportsCustomCursor = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (supportsCustomCursor) {
    var cursorEl = document.createElement('div');
    cursorEl.className = 'custom-cursor';
    cursorEl.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M3 2 L3 21 L8 16 L11 22 L14 20.5 L11 15 L18 15 Z"></path>' +
      '</svg>';
    document.body.appendChild(cursorEl);
    document.documentElement.classList.add('custom-cursor-active');

    document.addEventListener('mousemove', function (e) {
      cursorEl.classList.add('is-visible');
      cursorEl.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
    });

    document.addEventListener('mouseleave', function () {
      cursorEl.classList.remove('is-visible');
    });

    // Event delegation so dynamically-added elements (like Knowledge
    // Base cards, which load after a fetch) are still picked up.
    var interactiveSelector = 'a, button, summary, label, input, .kb-card, .skill-pill';
    document.addEventListener('pointerover', function (e) {
      if (e.target.closest(interactiveSelector)) {
        cursorEl.classList.add('is-hover');
      }
    });
    document.addEventListener('pointerout', function (e) {
      var leavingInteractive = e.target.closest(interactiveSelector);
      var enteringInteractive = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(interactiveSelector);
      if (leavingInteractive && !enteringInteractive) {
        cursorEl.classList.remove('is-hover');
      }
    });
  }

  // ---------------------------------------------------------------------
  // Career Timeline ↔ Growth Journey ↔ role popup.
  //   - Dashed connector lines link each timeline point to its stage card
  //   - Clicking a timeline point OR a company chip opens a small popup
  //     with that role's full details (read from #role-detail-source)
  // ---------------------------------------------------------------------
  function flashHighlight(el) {
    if (!el) return;
    el.classList.add('is-jump-target');
    setTimeout(function () { el.classList.remove('is-jump-target'); }, 1400);
  }

  // ---- Role popup ----------------------------------------------------
  var modalOverlay = document.getElementById('role-modal-overlay');
  var modalBody = document.getElementById('role-modal-body');
  var modalClose = document.getElementById('role-modal-close');
  var roleSource = document.getElementById('role-detail-source');
  var lastFocused = null;

  function openRoleModal(roleId) {
    if (!modalOverlay || !roleSource) return;
    var source = roleSource.querySelector('#' + roleId);
    if (!source) return;

    modalBody.innerHTML = source.innerHTML;
    var heading = modalBody.querySelector('h3');
    if (heading) heading.id = 'role-modal-company';

    lastFocused = document.activeElement;
    modalOverlay.hidden = false;
    void modalOverlay.offsetWidth; // force reflow so the transition runs
    modalOverlay.classList.add('is-open');
    document.body.classList.add('modal-open');
    modalBody.scrollTop = 0;
    if (modalClose) modalClose.focus();
  }

  function closeRoleModal() {
    if (!modalOverlay || modalOverlay.hidden) return;
    modalOverlay.classList.remove('is-open');
    document.body.classList.remove('modal-open');
    setTimeout(function () { modalOverlay.hidden = true; }, 260);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) closeRoleModal();
    });
    if (modalClose) modalClose.addEventListener('click', closeRoleModal);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeRoleModal();
    });
  }

  // ---- Timeline nodes + chips ----------------------------------------
  var timelineNodes = Array.prototype.slice.call(document.querySelectorAll('.timeline-node[data-target]'));
  var connectorPaths = [];

  function setActiveNode(index) {
    timelineNodes.forEach(function (n, i) {
      n.classList.toggle('is-active-target', i === index);
    });
    connectorPaths.forEach(function (p, i) {
      if (p) p.classList.toggle('is-active', i === index);
    });
  }

  timelineNodes.forEach(function (node, index) {
    node.addEventListener('click', function () {
      var chip = document.getElementById(node.getAttribute('data-chip'));
      setActiveNode(index);
      flashHighlight(chip);
      if (chip) openRoleModal(chip.getAttribute('data-role'));
    });
  });

  document.querySelectorAll('.growth-chip[data-role]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var idx = timelineNodes.findIndex(function (n) {
        return n.getAttribute('data-chip') === chip.id;
      });
      if (idx > -1) setActiveNode(idx);
      openRoleModal(chip.getAttribute('data-role'));
    });
  });

  // ---- Connector lines (timeline dot → its stage card) ---------------
  var connectorWrap = document.getElementById('timeline-connector-wrap');
  var connectorSvg = document.getElementById('timeline-connectors');
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function drawConnectors() {
    if (!connectorWrap || !connectorSvg) return;
    var wrapRect = connectorWrap.getBoundingClientRect();

    // Not enough side margin on narrow screens for the routed lines.
    if (wrapRect.width < 820) {
      connectorSvg.style.display = 'none';
      return;
    }
    connectorSvg.style.display = '';
    connectorSvg.setAttribute('viewBox', '0 0 ' + wrapRect.width + ' ' + wrapRect.height);
    connectorSvg.setAttribute('preserveAspectRatio', 'none');
    while (connectorSvg.firstChild) connectorSvg.removeChild(connectorSvg.firstChild);
    connectorPaths = [];

    // How many nodes point at each stage, so shared stages fan out.
    var perStage = {};
    timelineNodes.forEach(function (n) {
      var t = n.getAttribute('data-target');
      perStage[t] = (perStage[t] || 0) + 1;
    });
    var seen = {};

    var firstStage = document.getElementById('stage-1');
    var gapTop = firstStage ? firstStage.getBoundingClientRect().top - wrapRect.top : 0;

    // Lane layout for the routed lines: each entry is
    // [side, channel distance from card, sweep offset above stage 1, entry offset below card top]
    var lanes = {
      'stage-2': { left:  [24, 52, 44] },
      'stage-3': { right: [24, 40, 38] },
      'stage-3-ai': { right: [44, 66, 66] }
    };

    timelineNodes.forEach(function (node, i) {
      var stageId = node.getAttribute('data-target');
      var stage = document.getElementById(stageId);
      if (!stage) { connectorPaths.push(null); return; }

      var nr = node.getBoundingClientRect();
      var sr = stage.getBoundingClientRect();
      var x1 = nr.left + nr.width / 2 - wrapRect.left;
      var y1 = nr.bottom - wrapRect.top + 6;
      var sTop = sr.top - wrapRect.top;
      var sLeft = sr.left - wrapRect.left;
      var sRight = sr.right - wrapRect.left;

      var order = seen[stageId] || 0;
      seen[stageId] = order + 1;
      var isAi = node.classList.contains('is-ai-milestone');
      var d, ex, ey;
      var R = 14;

      if (stageId === 'stage-1') {
        // Straight drop into the top edge of the first stage.
        var cnt = perStage[stageId];
        ex = sLeft + (sRight - sLeft) * (cnt > 1 ? 0.3 + 0.4 * order / (cnt - 1) : 0.5);
        ey = sTop;
        var mid = (y1 + ey) / 2;
        d = 'M' + x1 + ',' + y1 + ' C' + x1 + ',' + mid + ' ' + ex + ',' + mid + ' ' + ex + ',' + ey;
      } else {
        var lane = lanes[isAi ? stageId + '-ai' : stageId];
        var side = lane.left ? 'left' : 'right';
        var cfg = lane[side];
        var xc = side === 'left' ? sLeft - cfg[0] : sRight + cfg[0];
        var sy = gapTop - cfg[1];
        ey = sTop + cfg[2];
        ex = side === 'left' ? sLeft : sRight;
        var hDir = xc < x1 ? -1 : 1;          // sweep direction along the top
        var inDir = side === 'left' ? 1 : -1;  // direction into the card edge
        d = 'M' + x1 + ',' + y1 +
            ' L' + x1 + ',' + (sy - R) +
            ' Q' + x1 + ',' + sy + ' ' + (x1 + hDir * R) + ',' + sy +
            ' L' + (xc - hDir * R) + ',' + sy +
            ' Q' + xc + ',' + sy + ' ' + xc + ',' + (sy + R) +
            ' L' + xc + ',' + (ey - R) +
            ' Q' + xc + ',' + ey + ' ' + (xc + inDir * R) + ',' + ey +
            ' L' + ex + ',' + ey;
      }

      var path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', d);
      if (isAi) path.setAttribute('class', 'is-ai-path');
      connectorSvg.appendChild(path);
      connectorPaths.push(path);

      var dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', ex);
      dot.setAttribute('cy', ey);
      dot.setAttribute('r', 3.5);
      dot.setAttribute('class', isAi ? 'is-ai-path' : '');
      connectorSvg.appendChild(dot);
    });

    var activeIdx = timelineNodes.findIndex(function (n) { return n.classList.contains('is-active-target'); });
    if (activeIdx > -1 && connectorPaths[activeIdx]) connectorPaths[activeIdx].classList.add('is-active');
  }

  if (connectorWrap) {
    var redrawTimer = null;
    var scheduleRedraw = function () {
      clearTimeout(redrawTimer);
      redrawTimer = setTimeout(drawConnectors, 120);
    };
    window.addEventListener('resize', scheduleRedraw);
    window.addEventListener('load', function () {
      drawConnectors();
      setTimeout(drawConnectors, 600);
      setTimeout(drawConnectors, 1400);
    });
    if ('ResizeObserver' in window) {
      new ResizeObserver(scheduleRedraw).observe(connectorWrap);
    }
    if ('IntersectionObserver' in window) {
      var wrapObserver = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          // Stage cards finish their reveal transition shortly after.
          setTimeout(drawConnectors, 800);
          wrapObserver.disconnect();
        }
      }, { threshold: 0.1 });
      wrapObserver.observe(connectorWrap);
    }
    drawConnectors();
  }
})();
