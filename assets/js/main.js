/* =========================================================================
   BioAI 2026 — interactions
   Vanilla JavaScript only. No build step, no external dependencies.
   ========================================================================= */
(function () {
  "use strict";

  var cfg = window.BIOAI_CONFIG || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (selector, scope) {
    return (scope || document).querySelector(selector);
  };
  var $$ = function (selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  };

  /* ---------------------------------------------------------------- config */
  function applyConfig() {
    $$("[data-site]").forEach(function (el) {
      var value = cfg[el.getAttribute("data-site")];
      if (value) el.textContent = value;
    });

    $$("[data-email-link]").forEach(function (link) {
      if (cfg.email) link.setAttribute("href", "mailto:" + cfg.email);
    });

    $$("[data-email-text]").forEach(function (el) {
      if (cfg.email) el.textContent = cfg.email;
    });

    $$("[data-repo-link]").forEach(function (link) {
      if (cfg.repo) link.setAttribute("href", cfg.repo);
    });

    var eventDate = cfg.eventDate ? new Date(cfg.eventDate) : null;
    if (eventDate && !isNaN(eventDate.getTime())) {
      var weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
      var weekdaysShort = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      $$("[data-weekday]").forEach(function (el) {
        el.textContent = weekdays[eventDate.getDay()];
      });
      $$("[data-weekday-short]").forEach(function (el) {
        el.textContent = weekdaysShort[eventDate.getDay()];
      });
      $$("[data-year]").forEach(function (el) {
        el.textContent = String(eventDate.getFullYear());
      });
    }
  }

  /* ---------------------------------------------------------------- toast */
  var toastTimer = 0;
  function toast(message) {
    var el = $("#toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      el.classList.remove("is-visible");
    }, 2800);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        return legacyCopy(text);
      });
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-9999px";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (error) {
      ok = false;
    }
    document.body.removeChild(area);
    return ok;
  }

  /* -------------------------------------------------------- header + menu */
  function initHeader() {
    var header = $("#site-header");
    var nav = $("#site-nav");
    var toggle = $(".menu-toggle");
    var progress = $(".scroll-progress span");
    if (!header) return;

    var ticking = false;
    function updateScroll() {
      var y = window.scrollY || window.pageYOffset;
      header.classList.toggle("is-scrolled", y > 28);

      if (progress) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var ratio = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
        progress.style.transform = "scaleX(" + ratio + ")";
      }
      ticking = false;
    }

    function requestScrollUpdate() {
      if (!ticking) {
        window.requestAnimationFrame(updateScroll);
        ticking = true;
      }
    }

    window.addEventListener("scroll", requestScrollUpdate, { passive: true });
    window.addEventListener("resize", requestScrollUpdate);
    updateScroll();

    if (!nav || !toggle) return;

    function setMenu(open) {
      header.classList.toggle("menu-open", open);
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    }

    toggle.addEventListener("click", function () {
      setMenu(!nav.classList.contains("is-open"));
    });

    $$("a", nav).forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setMenu(false);
        toggle.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (!nav.classList.contains("is-open")) return;
      if (header.contains(event.target)) return;
      setMenu(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1120 && nav.classList.contains("is-open")) {
        setMenu(false);
      }
    });
  }

  /* ----------------------------------------------------------- active nav */
  function initActiveNav() {
    var links = $$(".nav-link");
    if (!links.length) return;

    var byId = {};
    links.forEach(function (link) {
      var id = (link.getAttribute("href") || "").replace("#", "");
      if (id) byId[id] = link;
    });

    var sections = Object.keys(byId)
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);
    var offsets = [];

    function measure() {
      offsets = sections.map(function (section) {
        var rect = section.getBoundingClientRect();
        return {
          id: section.id,
          top: rect.top + window.scrollY,
          bottom: rect.bottom + window.scrollY
        };
      });
    }

    function activate(id) {
      links.forEach(function (link) {
        var active = Boolean(id) && link === byId[id];
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
    }

    var ticking = false;
    function update() {
      ticking = false;
      var probe = (window.scrollY || window.pageYOffset) + window.innerHeight * 0.36;
      var current = null;
      offsets.forEach(function (section) {
        if (probe >= section.top && probe < section.bottom) current = section.id;
      });
      activate(current);
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    measure();
    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", function () {
      measure();
      requestUpdate();
    });
    window.addEventListener("load", function () {
      measure();
      requestUpdate();
    });
  }

  /* --------------------------------------------------------------- reveal */
  function initReveal() {
    var items = $$(".reveal");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -7% 0px" }
    );

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ------------------------------------------------------------ countdown */
  function initCountdown() {
    var target = cfg.eventDate ? new Date(cfg.eventDate).getTime() : NaN;
    var daysEl = $('[data-countdown="days"]');
    if (!daysEl || isNaN(target)) return;

    var els = {
      days: daysEl,
      hours: $('[data-countdown="hours"]'),
      minutes: $('[data-countdown="minutes"]'),
      seconds: $('[data-countdown="seconds"]')
    };

    function pad(value) {
      return String(value).padStart(2, "0");
    }

    var last = null;
    function tick() {
      var diff = Math.max(0, target - Date.now());
      var days = Math.floor(diff / 86400000);
      var hours = Math.floor((diff % 86400000) / 3600000);
      var minutes = Math.floor((diff % 3600000) / 60000);
      var seconds = Math.floor((diff % 60000) / 1000);
      var key = [days, hours, minutes, seconds].join(":");
      if (key === last) return;
      last = key;

      if (els.days) els.days.textContent = pad(days);
      if (els.hours) els.hours.textContent = pad(hours);
      if (els.minutes) els.minutes.textContent = pad(minutes);
      if (els.seconds) els.seconds.textContent = pad(seconds);
    }

    tick();
    window.setInterval(tick, 1000);
  }

  /* ---------------------------------------------------------- helix canvas */
  function initHelix() {
    var canvas = $("#helix-canvas");
    if (!canvas) return;

    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var host = canvas.parentElement;
    var w = 1;
    var h = 1;
    var dpr = 1;
    var time = 0;
    var raf = 0;
    var onScreen = true;
    var pointerX = 0;
    var pointerY = 0;

    function resize() {
      var rect = host.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      var cx = w * 0.5 + pointerX * w * 0.045;
      var amp = Math.min(w * 0.255, 154) + pointerY * 8;
      var count = Math.max(46, Math.round(h / 11));
      var top = -14;
      var bottom = h + 14;
      var phase = time * 0.012;
      var strands = [[], []];
      var i;

      for (i = 0; i < count; i += 1) {
        var y = top + ((bottom - top) * i) / (count - 1);
        var angle = y * 0.0195 + phase;
        var za = Math.cos(angle);
        var zb = Math.cos(angle + Math.PI);
        strands[0].push({
          x: cx + Math.sin(angle) * amp,
          y: y,
          z: za
        });
        strands[1].push({
          x: cx + Math.sin(angle + Math.PI) * amp,
          y: y,
          z: zb
        });
      }

      // Faint centre axis
      ctx.save();
      ctx.strokeStyle = "rgba(242,239,230,0.055)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, h);
      ctx.stroke();
      ctx.restore();

      // Rungs between the two backbones
      for (i = 0; i < count; i += 2) {
        var a = strands[0][i];
        var b = strands[1][i];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = "rgba(242,239,230,0.075)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Backbones
      for (var s = 0; s < 2; s += 1) {
        ctx.beginPath();
        for (i = 0; i < count; i += 1) {
          var p = strands[s][i];
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = s === 0 ? "rgba(53,224,176,0.18)" : "rgba(216,255,95,0.16)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Nucleobases with a simple depth-of-field effect
      var colors = ["53,224,176", "216,255,95"];
      for (var s2 = 0; s2 < 2; s2 += 1) {
        for (i = 0; i < count; i += 1) {
          var dot = strands[s2][i];
          var depth = (dot.z + 1) * 0.5;
          var radius = 1.1 + depth * 3.6;
          var alpha = 0.18 + depth * 0.76;
          var color = colors[s2];

          ctx.beginPath();
          ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(" + color + "," + alpha.toFixed(3) + ")";
          ctx.fill();

          if (depth > 0.62) {
            ctx.save();
            ctx.shadowBlur = 13;
            ctx.shadowColor = "rgba(" + color + ",0.55)";
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, radius * 0.7, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(" + color + ",0.9)";
            ctx.fill();
            ctx.restore();
          }
        }
      }
    }

    function loop() {
      raf = 0;
      if (!onScreen || document.hidden) return;
      time += 0.62;
      draw();
      raf = window.requestAnimationFrame(loop);
    }

    function start() {
      if (reduceMotion || raf) return;
      raf = window.requestAnimationFrame(loop);
    }

    function stop() {
      if (raf) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      }
    }

    resize();

    if (!reduceMotion) {
      if ("ResizeObserver" in window) {
        new ResizeObserver(resize).observe(host);
      } else {
        window.addEventListener("resize", resize);
      }

      host.addEventListener("pointermove", function (event) {
        var rect = host.getBoundingClientRect();
        pointerX = (event.clientX - rect.left) / rect.width - 0.5;
        pointerY = (event.clientY - rect.top) / rect.height - 0.5;
      });

      host.addEventListener("pointerleave", function () {
        pointerX = 0;
        pointerY = 0;
      });

      if ("IntersectionObserver" in window) {
        new IntersectionObserver(
          function (entries) {
            onScreen = entries[0].isIntersecting;
            if (onScreen) start();
            else stop();
          },
          { threshold: 0 }
        ).observe(host);
      }

      document.addEventListener("visibilitychange", function () {
        if (!document.hidden && onScreen) start();
      });

      start();
    }
  }

  /* -------------------------------------------------------- agenda filter */
  function initAgendaFilter() {
    var buttons = $$(".filter-btn");
    var rows = $$(".agenda-row");
    var empty = $("#agenda-empty");
    var countEl = $("#agenda-visible-count");
    if (!buttons.length || !rows.length) return;

    function apply(filter) {
      var visible = 0;
      rows.forEach(function (row) {
        var show = filter === "all" || row.getAttribute("data-track") === filter;
        row.hidden = !show;
        if (show) visible += 1;
      });

      buttons.forEach(function (button) {
        var active = button.getAttribute("data-filter") === filter;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });

      if (countEl) countEl.textContent = String(visible);
      if (empty) empty.hidden = visible > 0;
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        apply(button.getAttribute("data-filter") || "all");
      });
    });
  }

  /* ------------------------------------------------------- add to calendar */
  function initCalendar() {
    var buttons = $$("[data-add-calendar]");
    if (!buttons.length) return;

    function toICSDate(value) {
      return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    }

    function escapeICS(value) {
      return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/\n/g, "\\n")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;");
    }

    function download() {
      var start = cfg.eventDate ? new Date(cfg.eventDate) : null;
      var end = cfg.eventEnd ? new Date(cfg.eventEnd) : null;
      if (!start || isNaN(start.getTime())) {
        toast("请先在 config.js 中设置会议时间");
        return;
      }
      if (!end || isNaN(end.getTime())) {
        end = new Date(start.getTime() + 8 * 60 * 60 * 1000);
      }

      var lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//BioAI 2026//CN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        "UID:bioai-2026-" + start.getTime() + "@wangsiya2459.github.io",
        "DTSTAMP:" + toICSDate(new Date()),
        "DTSTART:" + toICSDate(start),
        "DTEND:" + toICSDate(end),
        "SUMMARY:" + escapeICS(cfg.eventTitle || "BioAI 2026"),
        "DESCRIPTION:" + escapeICS(cfg.eventDescription || ""),
        "LOCATION:" + escapeICS(cfg.eventLocation || cfg.venue || ""),
        "URL:" + (cfg.siteUrl || ""),
        "END:VEVENT",
        "END:VCALENDAR"
      ];

      var blob = new Blob([lines.join("\r\n")], {
        type: "text/calendar;charset=utf-8"
      });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = "BioAI-2026.ics";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 1200);
      toast("日历文件已生成，可在日历中打开");
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", download);
    });
  }

  /* --------------------------------------------------------------- copy UI */
  function initCopyButtons() {
    $$("[data-copy-email]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (!cfg.email) return;
        copyText(cfg.email).then(function () {
          toast("邮箱已复制：" + cfg.email);
        });
      });
    });
  }

  /* ---------------------------------------------------------- registration */
  var registrationText = "";

  function initRegistration() {
    var form = $("#registration-form");
    if (!form) return;

    var result = $("#form-result");
    var preview = $("#registration-preview");
    var mailto = $("#form-mailto");
    var copyButton = $("#copy-registration-form");

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var data = new FormData(form);
      var name = String(data.get("name") || "").trim();
      var org = String(data.get("org") || "").trim();
      var email = String(data.get("email") || "").trim();
      var role = String(data.get("role") || "").trim();
      var mode = String(data.get("mode") || "").trim();
      var message = String(data.get("message") || "").trim();

      var lines = [
        "BioAI 2026 参会报名",
        "",
        "姓名：" + name,
        "单位 / 学校：" + org,
        "邮箱：" + email,
        "身份：" + (role || "未填写"),
        "参会方式：" + (mode || "未填写")
      ];
      if (message) {
        lines.push("想聊的问题：" + message);
      }
      lines.push("", "— 由 BioAI 2026 官网生成");

      registrationText = lines.join("\n");
      var subject = "BioAI 2026 参会报名 - " + name;
      if (mailto) {
        mailto.setAttribute(
          "href",
          "mailto:" + cfg.email +
            "?subject=" + encodeURIComponent(subject) +
            "&body=" + encodeURIComponent(registrationText)
        );
      }
      if (preview) preview.textContent = registrationText;
      if (result) {
        result.hidden = false;
        result.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "nearest"
        });
      }
    });

    form.addEventListener("input", function () {
      if (result && !result.hidden) result.hidden = true;
    });

    if (copyButton) {
      copyButton.addEventListener("click", function () {
        if (!registrationText) return;
        copyText(registrationText).then(function () {
          toast("报名信息已复制");
        });
      });
    }
  }

  /* ------------------------------------------------------------------ boot */
  function boot() {
    applyConfig();
    initHeader();
    initActiveNav();
    initReveal();
    initCountdown();
    initHelix();
    initAgendaFilter();
    initCalendar();
    initCopyButtons();
    initRegistration();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
