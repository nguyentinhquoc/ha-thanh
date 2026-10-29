/**
* Tuấn Kiệt Beer House – Lẩu Nướng Đồng Quê
* Website interactions
* Author: WaveBear
* Copyright (c) 2026 WaveBear. All rights reserved.
*/

AOS.init({
    duration: 680,
    once: true,
    offset: 55
});

/* Vị trí cuộn tới phần tử (trừ chiều cao navbar) */
function scrollToEl(el, offset) {
    window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - (offset || 78),
        behavior: 'smooth'
    });
}

/* NAVBAR SCROLL & ACTIVE LINK  */
window.addEventListener('scroll', function() {
    document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 60);
    document.getElementById('btt').classList.toggle('show', window.scrollY > 300);
    document.querySelectorAll('section[id]').forEach(function(sec) {
        var top = sec.offsetTop - 110,
            bot = top + sec.offsetHeight;
        if (window.scrollY >= top && window.scrollY < bot) {
            var lnk = document.querySelector('.nav-link[href="#' + sec.id + '"]');
            if (!lnk) return;
            document.querySelectorAll('.nav-link').forEach(function(l) {
                l.classList.remove('active');
            });
            lnk.classList.add('active');
        }
    });
});

/*  SMOOTH SCROLL + MOBILE NAV CLOSE (ủy quyền sự kiện: chạy cả với link do render.js tạo ra) */
document.addEventListener('click', function(e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (href.length < 2) return;
    var t = document.querySelector(href);
    if (!t) return;
    e.preventDefault();
    var go = function() {
        scrollToEl(t);
    };
    // Menu mobile đang mở: navbar sticky còn chiếm chỗ, phải đợi đóng hẳn rồi mới tính vị trí cuộn
    var navCollapse = document.getElementById('navmenu');
    if (navCollapse && navCollapse.classList.contains('show')) {
        navCollapse.addEventListener('hidden.bs.collapse', go, { once: true });
        bootstrap.Collapse.getOrCreateInstance(navCollapse, { toggle: false }).hide();
    } else {
        go();
    }
});


$(document).ready(function() {
    $('.magnific_popup').magnificPopup({
        type: 'iframe',
        mainClass: 'mfp-fade',
        removalDelay: 160,
        preloader: false,
        fixedContentPos: false,
        disableOn: 300
    });
    // Ảnh thực đơn: bấm để xem cỡ lớn, chuyển qua lại giữa các trang
    $('#menuImgs').magnificPopup({
        delegate: 'a.mnimg',
        type: 'image',
        mainClass: 'mfp-fade',
        removalDelay: 160,
        tClose: 'Đóng (Esc)',
        tLoading: 'Đang tải...',
        gallery: {
            enabled: true,
            tPrev: 'Trang trước',
            tNext: 'Trang sau',
            tCounter: '%curr% / %total%'
        },
        image: {
            tError: 'Không tải được ảnh thực đơn.'
        }
    });
});


/* ===================== FORM ĐẶT BÀN ===================== */
// Kiểm tra trường bắt buộc, trả về false nếu thiếu
function checkRequired(ids) {
    var firstBad = null;
    ids.forEach(function(id) {
        var el = document.getElementById(id);
        var v = el.value.trim();
        var bad = !v || (el.type === 'tel' && v.replace(/[^\d]/g, '').length < 9);
        el.classList.toggle('err', bad);
        if (bad && !firstBad) firstBad = el;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
}

document.querySelectorAll('.fctrl').forEach(function(el) {
    el.addEventListener('input', function() {
        this.classList.remove('err');
    });
});

function val(id) {
    return document.getElementById(id).value.trim();
}

// Hiện 1 thông báo dưới form đặt bàn (resSent: đã nhận, resErr: lỗi), ẩn thông báo còn lại
function showResMsg(id) {
    ['resSent', 'resErr'].forEach(function(k) {
        document.getElementById(k).style.display = k === id ? 'block' : 'none';
    });
    document.getElementById(id).scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
    });
}

/* ===================== GỬI DỮ LIỆU VỀ GOOGLE SHEET ===================== */
// Link Web App đặt trong data/thong-tin-quan.json → "googleSheetUrl" (script: google-apps-script/lau-nuong-tuan-kiet.gs)
function sheetUrl() {
    return (window.SITE && SITE.info && SITE.info.googleSheetUrl) || '';
}

// Trả về Promise<true> khi Google Sheet đã lưu xong dòng mới
function sendToSheet(fields) {
    if (!sheetUrl()) return Promise.resolve(false);
    var data = new FormData();
    Object.keys(fields).forEach(function(k) {
        data.append(k, fields[k]);
    });
    data.append('trang', location.href);
    var ctrl = new AbortController();
    var timer = setTimeout(function() {
        ctrl.abort();
    }, 15000);
    return fetch(sheetUrl(), {
            method: 'POST',
            body: data,
            signal: ctrl.signal
        })
        .then(function(res) {
            return res.json();
        })
        .then(function(res) {
            return res.result === 'success';
        })
        .catch(function() {
            return false;
        })
        .finally(function() {
            clearTimeout(timer);
        });
}

// Ngày đặt bàn mặc định = hôm nay, không cho chọn ngày đã qua
(function() {
    var d = new Date();
    var iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    var el = document.getElementById('resDate');
    el.min = iso;
    el.value = iso;
})();

document.getElementById('resBtn').addEventListener('click', function() {
    if (!checkRequired(['resName', 'resPhone', 'resDate'])) return;
    var btn = this;
    var html = btn.innerHTML;
    var p = val('resDate').split('-');
    var fields = {
        form: 'dat-ban',
        ho_ten: val('resName'),
        so_dien_thoai: val('resPhone'),
        ngay: p[2] + '/' + p[1] + '/' + p[0],
        gio: val('resTime'),
        so_khach: val('resGuests'),
        khu_vuc: val('resArea'),
        ghi_chu: val('resNote')
    };
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';
    sendToSheet(fields).then(function(saved) {
        // Báo Telegram mỗi lượt đặt bàn (js/telegram.js), kèm trạng thái lưu Google Sheet
        if (window.notifyTelegram) {
            window.notifyTelegram('🍲 ĐẶT BÀN', [
                'Họ tên: ' + fields.ho_ten,
                'SĐT: ' + fields.so_dien_thoai,
                'Ngày: ' + fields.ngay + ' – Giờ: ' + fields.gio,
                'Số khách: ' + fields.so_khach,
                'Khu vực: ' + fields.khu_vuc,
                fields.ghi_chu && 'Ghi chú: ' + fields.ghi_chu,
                saved ? '✅ Đã lưu Google Sheet' : '⚠️ Chưa lưu được vào Google Sheet – gọi lại khách ngay'
            ]);
        }
        btn.disabled = false;
        btn.innerHTML = html;
        if (!saved) return showResMsg('resErr');
        ['resName', 'resPhone', 'resNote'].forEach(function(id) {
            document.getElementById(id).value = '';
        });
        showResMsg('resSent');
    });
});


/* ===================== POPUP GALLERY ===================== */
var galPop = document.getElementById('galPop');
var galData = [];
var galIdx = 0;

document.querySelectorAll('.gitem').forEach(function(item) {
    galData.push({
        img: item.getAttribute('data-gimg'),
        title: item.getAttribute('data-gtitle'),
        desc: item.getAttribute('data-gdesc')
    });
    item.addEventListener('click', function() {
        openGal(parseInt(this.getAttribute('data-gi')));
    });
});

function openGal(i) {
    galIdx = i;
    var g = galData[i];
    document.getElementById('gpImg').setAttribute('src', g.img);
    document.getElementById('gpImg').setAttribute('alt', g.title);
    document.getElementById('gpTitle').textContent = g.title;
    document.getElementById('gpDesc').innerHTML = g.desc;
    galPop.classList.add('open');
    document.body.style.overflow = 'hidden';
}

document.getElementById('gpClose').addEventListener('click', closeGal);
galPop.addEventListener('click', function(e) {
    if (e.target === this) closeGal();
});

function closeGal() {
    galPop.classList.remove('open');
    document.body.style.overflow = '';
}

document.getElementById('gpPrev').addEventListener('click', function() {
    openGal((galIdx - 1 + galData.length) % galData.length);
});
document.getElementById('gpNext').addEventListener('click', function() {
    openGal((galIdx + 1) % galData.length);
});

/*  Phím ESC đóng mọi popup */
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeGal();
        if (typeof $.magnificPopup !== 'undefined') $.magnificPopup.close();
    }
});


function initSwiper() {
    new Swiper('.tesSwiper', {
        slidesPerView: 1,
        spaceBetween: 22,
        loop: document.querySelectorAll('.tesSwiper .swiper-slide').length > 3,
        autoplay: {
            delay: 4000,
            disableOnInteraction: false
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true
        },
        breakpoints: {
            640: {
                slidesPerView: 2
            },
            1024: {
                slidesPerView: 3
            }
        }
    });
}


/* Đồng hồ đếm ngược ưu đãi – đếm tới "ketThuc" (data/noi-dung.json), để trống thì ẩn */
function startCountdown(endStr) {
    var wrap = document.getElementById('cdWrap');
    var m = String(endStr || '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?/);
    if (!m) {
        wrap.style.display = 'none';
        return;
    }
    var end = m[4] ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : new Date(+m[1], +m[2] - 1, +m[3], 23, 59, 59);
    function pad(n) {
        return String(n).padStart(2, '0');
    }
    function tick() {
        var left = Math.max(0, Math.floor((end - Date.now()) / 1000));
        document.getElementById('cdH').textContent = pad(Math.floor(left / 3600));
        document.getElementById('cdM').textContent = pad(Math.floor(left % 3600 / 60));
        document.getElementById('cdS').textContent = pad(left % 60);
    }
    tick();
    setInterval(tick, 1000);
}

/* ── NHẬN ƯU ĐÃI (nhận số điện thoại hoặc email) ── */
document.getElementById('nlBtn').addEventListener('click', function() {
    var input = document.getElementById('nlEmail');
    var v = input.value.trim();
    var isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    var isPhone = /^(\+?84|0)\d{9,10}$/.test(v.replace(/[\s.\-]/g, ''));
    if (!isEmail && !isPhone) {
        input.focus();
        input.placeholder = 'Vui lòng nhập SĐT hoặc email hợp lệ';
        input.value = '';
        return;
    }
    var btn = this;
    btn.disabled = true;
    sendToSheet({
        form: 'uu-dai',
        lien_he: v
    }).then(function(saved) {
        if (window.notifyTelegram) {
            window.notifyTelegram('🎁 ĐĂNG KÝ ƯU ĐÃI', [
                'SĐT / Email: ' + v,
                saved ? '✅ Đã lưu Google Sheet' : '⚠️ Chưa lưu được vào Google Sheet'
            ]);
        }
        // Gửi lỗi (hoặc chưa có link Google Sheet) → giữ nội dung để khách bấm thử lại
        btn.disabled = false;
        btn.textContent = saved ? '✓ Đã đăng ký!' : 'Chưa gửi được, thử lại';
        btn.style.background = saved ? '#4ade80' : '#fca5a5';
        btn.style.color = '#222';
        if (saved) input.value = '';
        setTimeout(function() {
            btn.innerHTML = '<i class="fas fa-paper-plane me-1"></i>Đăng ký';
            btn.style.background = '';
            btn.style.color = '';
        }, 3000);
    });
});

/*  HIỆU ỨNG ĐẾM SỐ */
var numAnimated = false;
window.addEventListener('scroll', function() {
    var hero = document.getElementById('hero');
    if (!numAnimated && hero && window.scrollY > hero.offsetHeight - 300) {
        numAnimated = true;
        document.querySelectorAll('.snum').forEach(function(el) {
            var em = el.querySelector('em');
            var suf = em ? em.textContent : '';
            var num = parseInt(el.textContent);
            if (isNaN(num)) return;
            var start = 0;
            var step = Math.ceil(num / 55);
            var iv = setInterval(function() {
                start += step;
                if (start >= num) {
                    start = num;
                    clearInterval(iv);
                }
                el.innerHTML = start + (suf ? '<em>' + esc(suf) + '</em>' : '');
            }, 1400 / 55);
        });
    }
});


/* Sau khi render.js dựng xong nội dung từ data/*.json */
siteReady.then(function() {
    AOS.refreshHard();
    initSwiper();
    startCountdown(SITE.content.uuDai && SITE.content.uuDai.ketThuc);
}).catch(function() {});
