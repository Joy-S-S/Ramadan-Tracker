// ============================================
// SHARED.JS — Ramadan Tracker
// Common JS used across all pages:
//   1. Google Analytics
//   2. Dynamic Navigation
//   3. PWA Install Logic
//   4. Service Worker Registration
// ============================================

(function () {
    'use strict';

    // ===== 1. GOOGLE ANALYTICS =====
    const GA_ID = 'G-90N7S5Q8EE';
    const gtagScript = document.createElement('script');
    gtagScript.async = true;
    gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(gtagScript);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', GA_ID);
    window.gtag = gtag;

    // ===== 2. DYNAMIC NAVIGATION =====
    const NAV_TRANSLATIONS = {
        ar: {
            'index.html': { label: 'الجدول', aria: 'الجدول الرئيسي' },
            'quran.html': { label: 'الختمة', aria: 'ختمة القرآن' },
            'tasbih.html': { label: 'الأذكار', aria: 'الأذكار والتسبيح' },
            'sunnah.html': { label: 'السنن', aria: 'السنن النبوية' },
            'salah.html': { label: 'الصلاة', aria: 'كيفية الصلاة' }
        },
        en: {
            'index.html': { label: 'Planner', aria: 'Main Planner' },
            'quran.html': { label: 'Khatma', aria: 'Quran Completion' },
            'tasbih.html': { label: 'Adhkar', aria: 'Tasbih and Adhkar' },
            'sunnah.html': { label: 'Sunnah', aria: 'Prophetic Sunnah' },
            'salah.html': { label: 'Salah', aria: 'Prayer Guide' }
        }
    };

    function getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
        return filename;
    }

    function buildNav() {
        const navEl = document.getElementById('main-nav');
        if (!navEl) return;

        const currentPage = getCurrentPage();
        const lang = document.documentElement.lang || 'ar';
        const items = NAV_TRANSLATIONS[lang] || NAV_TRANSLATIONS.ar;

        navEl.innerHTML = ''; // Clear existing

        Object.keys(items).forEach(href => {
            if (href === currentPage) return; // Skip current page

            const link = document.createElement('a');
            link.href = href;
            link.className = 'nav-btn';
            link.setAttribute('aria-label', items[href].aria);
            link.textContent = items[href].label;
            navEl.appendChild(link);
        });
    }

    // Smart Watcher for language changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'lang') {
                buildNav();
            }
        });
    });
    observer.observe(document.documentElement, { attributes: true });

    // ===== 3. PWA INSTALL LOGIC =====
    let deferredPrompt;
    const installBtn = document.getElementById('installBtn');

    function updateInstallIcon() {
        if (!installBtn) return;
        const icon = installBtn.querySelector('i');
        if (!icon) return;
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('android')) {
            icon.className = 'fab fa-android';
        } else if (
            ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod') ||
            (ua.includes('macintosh') && navigator.maxTouchPoints > 1)
        ) {
            icon.className = 'fab fa-apple';
        }
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (installBtn) {
            updateInstallIcon();
            installBtn.style.display = 'flex';
        }
    });

    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    deferredPrompt = null;
                    installBtn.style.display = 'none';
                }
            }
        });
    }

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        if (installBtn) installBtn.style.display = 'none';
    });

    // ===== 4. SERVICE WORKER =====
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(() => { });
    }

    // ===== INIT =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            buildNav();
            document.body.classList.add('loaded');
        });
    } else {
        buildNav();
        document.body.classList.add('loaded');
    }
})();
