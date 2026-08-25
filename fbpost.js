(() => {
  'use strict';

  const API_URL = 'https://script.google.com/macros/s/AKfycbxvqWwNRKu5GpoVRyDZGdwXRy6ubEgPAg2-stv-G-arF4HRoqkAfP21oTl124ne6CvZ/exec?mode=facebook';
  const state = { items: [] };

  const esc = value => String(value ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;')
    .replaceAll('>','&gt;').replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');

  const safeHttps = value => {
    const url = String(value || '').trim();
    return /^https:\/\//i.test(url) ? url : '';
  };

  function scaleFrames() {
    document.querySelectorAll('.fb-card-preview').forEach(box => {
      const iframe = box.querySelector('iframe');
      if (!iframe) return;
      iframe.style.transform = `scale(${Math.min(1, box.clientWidth / 500)})`;
    });
  }

  function fillAreaFilter(items) {
    const select = document.getElementById('fbAreaFilter');
    const areas = [...new Set(items.map(item => String(item.area || '').trim()).filter(Boolean))]
      .sort((a,b) => a.localeCompare(b,'th'));

    select.innerHTML =
      '<option value="">ทุกพื้นที่</option>' +
      areas.map(area => `<option value="${esc(area)}">${esc(area)}</option>`).join('');
  }

  function render() {
    const grid = document.getElementById('fbPageGrid');
    const status = document.getElementById('fbPageStatus');
    const count = document.getElementById('fbResultCount');
    const selected = document.getElementById('fbAreaFilter').value;

    const items = state.items.filter(item => !selected || item.area === selected);
    count.textContent = `พบ ${items.length} รายการ`;

    if (!items.length) {
      grid.innerHTML = '';
      status.hidden = false;
      status.textContent = selected ? 'ไม่พบโพสต์ในพื้นที่นี้' : 'ยังไม่มีโพสต์ Facebook';
      return;
    }

    status.hidden = true;
    grid.innerHTML = items.map(item => {
      const embedUrl = safeHttps(item.embedUrl);
      const facebookUrl = safeHttps(item.facebookUrl);
      if (!embedUrl || !facebookUrl) return '';

      return `
        <article class="fb-card" data-url="${esc(facebookUrl)}" tabindex="0" role="link">
          <div class="fb-card-preview">
            <iframe
              src="${esc(embedUrl)}"
              title="โพสต์ Facebook ${esc(item.area || '')}"
              loading="lazy"
              scrolling="no"
              frameborder="0"
              allowfullscreen
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share">
            </iframe>
          </div>
          <div class="fb-card-body">
            <h2 class="fb-card-area">${esc(item.area || 'ไม่ระบุพื้นที่')}</h2>
            ${item.date ? `<div class="fb-card-date"><i class="fa-regular fa-calendar"></i>${esc(item.date)}</div>` : ''}
            <div class="fb-card-open"><i class="fa-brands fa-facebook"></i> เปิดโพสต์บน Facebook</div>
          </div>
        </article>`;
    }).join('');

    grid.querySelectorAll('.fb-card').forEach(card => {
      const open = () => {
        const url = card.dataset.url;
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
      };
      card.addEventListener('click', open);
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    });

    requestAnimationFrame(scaleFrames);
  }

  async function load() {
    const status = document.getElementById('fbPageStatus');
    try {
      const response = await fetch(API_URL + '&_t=' + Date.now(), {cache:'no-store'});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const result = await response.json();
      if (result.success === false) throw new Error(result.message || 'โหลดข้อมูลไม่สำเร็จ');

      state.items = Array.isArray(result.items) ? result.items : [];
      fillAreaFilter(state.items);
      render();
    } catch (error) {
      console.error('fbpost:', error);
      status.hidden = false;
      status.textContent = 'โหลดโพสต์ Facebook ไม่สำเร็จ';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('fbAreaFilter').addEventListener('change', render);
    load();
  });

  window.addEventListener('resize', scaleFrames);
})();
