(function() {
  "use strict";

  /**
   * URL Web App của Google Apps Script (xem docs/huong-dan-google-sheets.md).
   * Để trống: form báo người dùng gọi hotline thay vì gửi.
   */
  const BOOKING_ENDPOINT = '';
  const HOTLINE_TEXT = '0913 176 135';

  /**
   * Gửi sự kiện chuyển đổi tới Facebook Pixel / Google tag nếu đã cài trên trang
   */
  function track(eventName, params) {
    if (typeof window.fbq === 'function') window.fbq('track', eventName, params || {});
    if (typeof window.gtag === 'function') window.gtag('event', eventName, params || {});
  }

  document.querySelectorAll('a[href^="tel:"]').forEach(link => {
    link.addEventListener('click', () => track('Contact', { method: 'phone' }));
  });
  document.querySelectorAll('a[href*="zalo.me"]').forEach(link => {
    link.addEventListener('click', () => track('Contact', { method: 'zalo' }));
  });
  document.querySelectorAll('a[href*="m.me/"]').forEach(link => {
    link.addEventListener('click', () => track('Contact', { method: 'messenger' }));
  });

  /**
   * Form đặt lịch
   */
  const form = document.querySelector('#booking-form');
  if (!form) return;

  const loading = form.querySelector('.loading');
  const errorBox = form.querySelector('.error-message');
  const sentBox = form.querySelector('.sent-message');

  function show(el, html) {
    [loading, errorBox, sentBox].forEach(box => box.classList.remove('d-block'));
    if (!el) return;
    if (html) el.innerHTML = html;
    el.classList.add('d-block');
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    form.classList.add('was-validated');
    if (!form.checkValidity()) {
      show(errorBox, 'Vui lòng nhập họ tên và số điện thoại hợp lệ.');
      return;
    }

    if (!BOOKING_ENDPOINT) {
      show(errorBox, `Hệ thống đặt lịch online đang được cập nhật. Vui lòng gọi <a href="tel:0913176135">${HOTLINE_TEXT}</a> hoặc nhắn Zalo để được hỗ trợ ngay.`);
      return;
    }

    const data = new FormData(form);
    data.append('trang', window.location.href);

    show(loading);
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      const response = await fetch(BOOKING_ENDPOINT, { method: 'POST', body: data });
      const result = await response.json();
      if (result.result !== 'success') throw new Error(result.error || 'Gửi không thành công');
      show(sentBox);
      form.reset();
      form.classList.remove('was-validated');
      track('Lead', { content_name: 'Đặt lịch cắt bao quy đầu' });
    } catch (err) {
      show(errorBox, `Chưa gửi được thông tin. Vui lòng gọi <a href="tel:0913176135">${HOTLINE_TEXT}</a> để đặt lịch.`);
    } finally {
      button.disabled = false;
    }
  });

})();
