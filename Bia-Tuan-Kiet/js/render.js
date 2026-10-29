/* ============================================================
   ĐỌC DỮ LIỆU TỪ THƯ MỤC data/ VÀ HIỂN THỊ LÊN TRANG
   - data/thong-tin-quan.json : liên hệ, mạng xã hội, giờ mở cửa, số liệu
   - data/noi-dung.json       : ưu đãi, hành trình, đầu bếp, đánh giá
   Chỉ cần sửa các file JSON, không cần sửa file này.
   ============================================================ */

/* Chống chèn mã HTML từ dữ liệu */
function esc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function digits(s) {
    return String(s || '').replace(/[^\d]/g, '');
}

function fillHTML(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
}

function loadJSON(file) {
    return fetch('data/' + file, { cache: 'no-cache' })
        .then(function(res) {
            if (!res.ok) throw new Error('Không tìm thấy file data/' + file);
            return res.text();
        })
        .then(function(text) {
            try {
                return JSON.parse(text);
            } catch (e) {
                throw new Error('File data/' + file + ' bị sai cú pháp JSON (' + e.message + '). Kiểm tra dấu phẩy, dấu ngoặc kép.');
            }
        });
}

function showLoadError(err) {
    var msg = location.protocol === 'file:' ?
        'Trình duyệt không cho đọc thư mục data/ khi mở trực tiếp file index.html. Hãy mở bằng Live Server (VS Code) hoặc đưa lên hosting.' :
        err.message;
    var bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#b00020;color:#fff;padding:12px 16px;font:600 14px/1.5 sans-serif;text-align:center;';
    bar.textContent = '⚠ ' + msg;
    document.body.appendChild(bar);
    console.error(err);
}

/* ---------- Thông tin quán: gắn vào các phần tử data-t / data-href / data-if ---------- */
function buildInfoMap(info) {
    var mxh = info.mangXaHoi || {};
    var gh = info.giaoHang || {};
    return {
        tenQuan: info.tenQuan,
        hotline: info.hotline,
        soPhu: info.soPhu,
        email: info.email,
        diaChi: info.diaChi,
        diaChiNgan: info.diaChiNgan,
        gioMoCua: info.gioMoCua,
        gioMoCuaNgan: info.gioMoCuaNgan,
        telHotline: info.hotline ? 'tel:' + digits(info.hotline) : '',
        telSoPhu: info.soPhu ? 'tel:' + digits(info.soPhu) : '',
        zalo: info.hotline ? 'https://zalo.me/' + digits(info.hotline) : '',
        mailto: info.email ? 'mailto:' + info.email : '',
        video: info.videoGioiThieu,
        shopeefood: gh.shopeefood,
        grabfood: gh.grabfood,
        facebook: mxh.facebook,
        tiktok: mxh.tiktok,
        instagram: mxh.instagram,
        youtube: mxh.youtube
    };
}

function applyBindings(map) {
    document.querySelectorAll('[data-t]').forEach(function(el) {
        el.textContent = map[el.getAttribute('data-t')] || '';
    });
    // link trống thì ẩn luôn nút/biểu tượng đó
    document.querySelectorAll('[data-href]').forEach(function(el) {
        var v = map[el.getAttribute('data-href')];
        if (v) el.setAttribute('href', v);
        else el.style.display = 'none';
    });
    document.querySelectorAll('[data-if]').forEach(function(el) {
        if (!map[el.getAttribute('data-if')]) el.style.display = 'none';
    });
}

var SOCIAL_ICONS = [
    ['facebook', 'fab fa-facebook-f', 'Facebook'],
    ['tiktok', 'fab fa-tiktok', 'TikTok'],
    ['instagram', 'fab fa-instagram', 'Instagram'],
    ['youtube', 'fab fa-youtube', 'YouTube']
];

function socialLinks(links) {
    return SOCIAL_ICONS.filter(function(s) {
        return links[s[0]];
    }).map(function(s) {
        return '<a href="' + esc(links[s[0]]) + '" target="_blank" rel="noopener" title="' + s[2] + '"><i class="' + s[1] + '"></i></a>';
    }).join('');
}

function renderInfo(info) {
    fillHTML('tbContact',
        '<span><i class="fas fa-phone-alt"></i>' + esc(info.hotline) + (info.soPhu ? ' – ' + esc(info.soPhu) : '') + '</span>' +
        (info.email ? '<span><i class="fas fa-envelope"></i>' + esc(info.email) + '</span>' : '') +
        '<span><i class="fas fa-map-marker-alt"></i>' + esc(info.diaChiNgan) + '</span>');

    var social = socialLinks(info.mangXaHoi || {});
    ['tbSocial', 'ftSocial'].forEach(function(id) {
        fillHTML(id, social);
    });

    fillHTML('heroStats', (info.soLieu || []).map(function(s) {
        return '<div class="hstat"><span class="snum">' + esc(s.so) + '<em>' + esc(s.donVi) + '</em></span><small>' + esc(s.nhan) + '</small></div>';
    }).join('<div class="sdiv"></div>'));

    fillHTML('hoursRows', (info.bangGio || []).map(function(r) {
        return '<div class="hrsrow">' +
            '<span class="hrsday"><i class="fas ' + esc(r.icon || 'fa-calendar-day') + ' me-2"></i>' + esc(r.ten) + '</span>' +
            '<div class="d-flex align-items-center gap-2"><div class="hdot ' + (r.mo ? 'on' : 'off') + '"></div>' +
            '<span class="hrstime"' + (r.mo ? '' : ' style="color:#ff6b6b;"') + '>' + esc(r.gio) + '</span></div>' +
            '</div>';
    }).join(''));

    // Dữ liệu nhà hàng cho Google (JSON-LD)
    var ld = {
        '@context': 'https://schema.org',
        '@type': 'Restaurant',
        name: info.tenQuan,
        image: 'img/banner-img.jpg',
        telephone: [info.hotline, info.soPhu].filter(Boolean).map(function(p) {
            return '+84' + digits(p).replace(/^0/, '');
        }),
        email: info.email || undefined,
        servesCuisine: ['Lẩu', 'Nướng', 'Món Việt', 'Đồ nhậu'],
        address: { '@type': 'PostalAddress', streetAddress: info.diaChi, addressRegion: 'Ninh Bình', addressCountry: 'VN' },
        acceptsReservations: 'True'
    };
    if (info.toaDo) ld.geo = { '@type': 'GeoCoordinates', latitude: info.toaDo.viDo, longitude: info.toaDo.kinhDo };
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);
}

/* ---------- Nội dung ---------- */
function renderContent(c) {
    var u = c.uuDai;
    if (u) {
        fillHTML('spTag', '<i class="fas fa-bolt me-1"></i>' + esc(u.nhan));
        fillHTML('spTitle', (u.tieuDe || []).map(esc).join('<br/>') + (u.tieuDeNoiBat ? '<br/><span>' + esc(u.tieuDeNoiBat) + '</span>' : ''));
        fillHTML('spDesc', esc(u.moTa));
        fillHTML('spOld', esc(u.giaCu));
        fillHTML('spNew', esc(u.giaMoi));
        if (!u.giaCu) document.getElementById('spOld').style.display = 'none';
        if (!u.giaCu && !u.giaMoi) document.querySelector('.sppbdg').style.display = 'none';
        fillHTML('spBtnText', esc(u.nut));
        var img = document.getElementById('spImg');
        if (img && u.anh) img.src = u.anh;
    }

    fillHTML('timeline', (c.hanhTrinh || []).map(function(h) {
        var side = '<div class="tlyear">' + esc(h.nam) + '</div><h5>' + esc(h.tieuDe) + '</h5><p>' + esc(h.moTa) + '</p>';
        return '<div class="tli"><div class="tl-left">' + side + '</div><div class="tl-center"><div class="tldot"></div></div><div class="tl-right">' + side + '</div></div>';
    }).join(''));

    fillHTML('chefRow', (c.doiNguBep || []).map(function(p, i) {
        return '<div class="col-sm-6 col-lg-3" data-aos="fade-up" data-aos-delay="' + (i * 80) + '"><div class="chcard">' +
            '<div class="chimg"><img src="' + esc(p.anh) + '" alt="' + esc(p.ten) + '"/>' +
            '<div class="chsoc">' + socialLinks(p) + '</div></div>' +
            '<div class="chbody"><div class="chnm">' + esc(p.ten) + '</div><div class="chrole">' + esc(p.vaiTro) + '</div><div class="chexp">' + esc(p.kinhNghiem) + '</div></div>' +
            '</div></div>';
    }).join(''));

    fillHTML('tesWrapper', (c.danhGia || []).map(function(r) {
        var n = Math.max(0, Math.min(5, parseInt(r.soSao, 10) || 5));
        return '<div class="swiper-slide"><div class="tescard"><div class="tesq">"</div>' +
            '<div class="tess">' + '<i class="fas fa-star"></i>'.repeat(n) + '<i class="far fa-star"></i>'.repeat(5 - n) + '</div>' +
            '<p class="testxt">' + esc(r.noiDung) + '</p>' +
            '<div class="tesauth"><img src="' + esc(r.anh) + '" alt=""/><div><div class="tesnm">' + esc(r.ten) + '</div><div class="tesrl">' + esc(r.vaiTro) + '</div></div></div>' +
            '</div></div>';
    }).join(''));
}

/* ---------- Tải toàn bộ dữ liệu ---------- */
window.SITE = { info: {}, content: {} };

window.siteReady = Promise.all([
    loadJSON('thong-tin-quan.json'),
    loadJSON('noi-dung.json')
]).then(function(all) {
    SITE.info = all[0];
    SITE.content = all[1];
    renderInfo(SITE.info);
    renderContent(SITE.content);
    applyBindings(buildInfoMap(SITE.info));
    return SITE;
}).catch(function(err) {
    showLoadError(err);
    throw err;
});
