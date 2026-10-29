/**
 * Thông báo Telegram: khách bấm gọi / Zalo (mọi nút trên trang) và khách gửi form (window.notifyTelegram).
 * Token bot + chat nhận tin nằm trong assets/js/n7q2x9.js (window.TG_NOTIFY); chưa có chat thì không gửi gì.
 */
(function() {
  "use strict";

  const SITE_NAME = 'Cắt bao quy đầu';
  const CLICK_GAP_MS = 60 * 1000; // mỗi khách tối đa 1 tin / phút cho mỗi loại nút, tránh bị spam khi bấm liên tục

  function context() {
    const utm = new URLSearchParams(window.location.search);
    const source = ['utm_source', 'utm_medium', 'utm_campaign'].map((key) => utm.get(key)).filter(Boolean).join(' / ');
    return [
      source && 'Nguồn: ' + source,
      'Thiết bị: ' + (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'Điện thoại' : 'Máy tính'),
      'Trang: ' + window.location.href,
    ].filter(Boolean);
  }

  function send(title, lines) {
    const tg = window.TG_NOTIFY || {};
    if (!tg.token || !tg.chatIds || !tg.chatIds.length) return;
    const text = [title + ' – ' + SITE_NAME].concat(lines.filter(Boolean), context()).join('\n');
    const url = 'https://api.telegram.org/bot' + tg.token + '/sendMessage';
    tg.chatIds.forEach((chatId) => {
      const body = new URLSearchParams({ chat_id: chatId, text: text, disable_web_page_preview: 'true' });
      // sendBeacon vẫn gửi được khi trình duyệt chuyển sang app gọi điện / Zalo
      if (!(navigator.sendBeacon && navigator.sendBeacon(url, body))) {
        fetch(url, { method: 'POST', body: body, mode: 'no-cors', keepalive: true }).catch(() => {});
      }
    });
  }

  function sentRecently(key) {
    try {
      const last = Number(sessionStorage.getItem('tg-' + key)) || 0;
      if (Date.now() - last < CLICK_GAP_MS) return true;
      sessionStorage.setItem('tg-' + key, String(Date.now()));
    } catch (error) {
      // trình duyệt chặn sessionStorage: vẫn gửi
    }
    return false;
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="tel:"], a[href*="zalo.me"]');
    if (!link) return;
    const href = link.getAttribute('href');
    const isPhone = href.startsWith('tel:');
    if (sentRecently(isPhone ? 'phone' : 'zalo')) return;
    send(isPhone ? '📞 Khách bấm GỌI' : '💬 Khách bấm ZALO', [isPhone ? 'Số: ' + href.slice(4) : 'Link: ' + href]);
  });

  window.notifyTelegram = send;
})();
