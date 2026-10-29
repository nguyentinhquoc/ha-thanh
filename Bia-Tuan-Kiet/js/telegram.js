/* ============================================================
   THÔNG BÁO TELEGRAM
   - Khách bấm gọi / Zalo (mọi nút trên trang) → báo ngay
   - Đặt bàn, đăng ký ưu đãi → main.js gọi window.notifyTelegram
   Token bot + chat nhận tin nằm trong js/n7q2x9.js (window.TG_NOTIFY); chưa có chat thì không gửi gì.
   ============================================================ */
(function() {
    var SITE_NAME = 'Tuấn Kiệt Beer House';
    var CLICK_GAP_MS = 60 * 1000; // mỗi khách tối đa 1 tin / phút cho mỗi loại nút, tránh bị spam khi bấm liên tục

    function context() {
        var utm = new URLSearchParams(location.search);
        var source = ['utm_source', 'utm_medium', 'utm_campaign'].map(function(k) {
            return utm.get(k);
        }).filter(Boolean).join(' / ');
        return [
            source && 'Nguồn: ' + source,
            'Thiết bị: ' + (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'Điện thoại' : 'Máy tính'),
            'Trang: ' + location.href
        ].filter(Boolean);
    }

    function send(title, lines) {
        var tg = window.TG_NOTIFY || {};
        if (!tg.token || !tg.chatIds || !tg.chatIds.length) return;
        var text = [title + ' – ' + SITE_NAME].concat(lines.filter(Boolean), context()).join('\n');
        var url = 'https://api.telegram.org/bot' + tg.token + '/sendMessage';
        tg.chatIds.forEach(function(chatId) {
            var body = new URLSearchParams({
                chat_id: chatId,
                text: text,
                disable_web_page_preview: 'true'
            });
            // sendBeacon vẫn gửi được khi trình duyệt chuyển sang app gọi điện / Zalo
            if (!(navigator.sendBeacon && navigator.sendBeacon(url, body))) {
                fetch(url, {
                    method: 'POST',
                    body: body,
                    mode: 'no-cors',
                    keepalive: true
                }).catch(function() {});
            }
        });
    }

    function sentRecently(key) {
        try {
            var last = Number(sessionStorage.getItem('tg-' + key)) || 0;
            if (Date.now() - last < CLICK_GAP_MS) return true;
            sessionStorage.setItem('tg-' + key, String(Date.now()));
        } catch (e) {}
        return false;
    }

    document.addEventListener('click', function(e) {
        var link = e.target.closest('a[href^="tel:"], a[href*="zalo.me"]');
        if (!link) return;
        var href = link.getAttribute('href');
        var isPhone = href.indexOf('tel:') === 0;
        if (sentRecently(isPhone ? 'phone' : 'zalo')) return;
        send(isPhone ? '📞 Khách bấm GỌI' : '💬 Khách bấm ZALO', [isPhone ? 'Số: ' + href.slice(4) : 'Link: ' + href]);
    });

    window.notifyTelegram = send;
})();
