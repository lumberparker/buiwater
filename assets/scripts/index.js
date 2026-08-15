// Hero Carousel Functionality
class HeroCarousel {
    constructor() {
        console.log('HeroCarousel constructor called');
        this.slidesContainer = document.querySelector('.hero__carousel');
        this.slides = document.querySelectorAll('.hero__slide');
        this.dotsContainer = document.querySelector('.hero__dots');
        
        console.log('Slides container:', this.slidesContainer);
        console.log('Slides found:', this.slides);
        console.log('Dots container:', this.dotsContainer);
        
        if (!this.slidesContainer) {
            console.error('No slides container found (.hero__carousel)');
            return;
        }
        
        if (!this.slides.length) {
            console.error('No slides found (.hero__slide)');
            return;
        }
        
        if (!this.dotsContainer) {
            console.error('No dots container found (.hero__dots)');
            return;
        }
        
        this.dots = [];
        this.currentSlide = 0;
        this.autoSlideInterval = null;
        this.isTransitioning = false;
        
        console.log('HeroCarousel initialized, calling init()');
        this.init();
    }
    
    init() {
        console.log('Initializing hero carousel...');
        console.log('Found slides:', this.slides.length);
        
        // Ensure first slide is active
        this.slides.forEach((slide, index) => {
            slide.classList.remove('hero__slide--active');
            if (index === 0) {
                slide.classList.add('hero__slide--active');
            }
        });
        
        // Generate dots based on number of slides
        this.generateDots();
        
        // Add click event listeners to dots
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index));
        });
        
        // Start auto-sliding (no-ops when there's only one slide)
        this.startAutoSlide();

        // Pause-on-hover was wired to mouseenter/mouseleave on the hero
        // section. Those fire not just from actual mouse movement but also
        // whenever scrolling moves the page under a stationary cursor —
        // crossing the hero's bottom edge while scrolling toggled these on
        // every pass, which is what produced the "bump" needing a second
        // scroll to push through. With one slide there's nothing to pause
        // anyway, so this listens for nothing and adds nothing.
    }
    
    generateDots() {
        // Clear existing dots
        this.dotsContainer.innerHTML = '';
        this.dots = [];
        
        // Create dots for each slide
        this.slides.forEach((slide, index) => {
            const dot = document.createElement('button');
            dot.className = index === 0 ? 'hero__dot hero__dot--active' : 'hero__dot';
            dot.setAttribute('data-slide', index);
            dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
            
            this.dotsContainer.appendChild(dot);
            this.dots.push(dot);
        });
    }
    
    goToSlide(slideIndex) {
        if (this.isTransitioning || slideIndex === this.currentSlide) {
            return;
        }
        
        // Ensure slideIndex is within bounds
        slideIndex = slideIndex % this.slides.length;
        if (slideIndex < 0) slideIndex = this.slides.length - 1;
        
        this.isTransitioning = true;
        
        const currentSlideElement = this.slides[this.currentSlide];
        const nextSlideElement = this.slides[slideIndex];
        
        // Update dots immediately
        this.dots[this.currentSlide].classList.remove('hero__dot--active');
        this.dots[slideIndex].classList.add('hero__dot--active');
        
        // Simple cross-fade: activate next slide immediately, then fade out current
        nextSlideElement.classList.add('hero__slide--active');
        
        // Update current slide index
        this.currentSlide = slideIndex;
        
        // Fade out the previous slide after a short delay
        setTimeout(() => {
            currentSlideElement.classList.remove('hero__slide--active');
            this.isTransitioning = false;
        }, 100);
        
        // Reset auto-slide timer
        this.resetAutoSlide();
    }
    
    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.slides.length;
        this.goToSlide(nextIndex);
    }
    
    startAutoSlide() {
        this.pauseAutoSlide(); // Clear any existing interval
        // Nothing to cycle to — don't run a timer forever for no reason.
        if (this.slides.length <= 1) return;
        this.autoSlideInterval = setInterval(() => {
            this.nextSlide();
        }, 5000);
    }
    
    pauseAutoSlide() {
        if (this.autoSlideInterval) {
            clearInterval(this.autoSlideInterval);
            this.autoSlideInterval = null;
        }
    }
    
    resetAutoSlide() {
        this.startAutoSlide();
    }
    
    // Method to refresh carousel if slides are added dynamically
    refresh() {
        this.slides = document.querySelectorAll('.hero__slide');
        this.currentSlide = 0;
        this.generateDots();
        this.init();
    }
}

// Language Detection and Content Management
class LanguageManager {
    constructor() {
        this.currentLanguage = 'es'; // Default to Spanish
        this.content = null; // Will be loaded from translations.json
        
        this.init();
    }
    
    async init() {
        // Load translations first
        await this.loadTranslations();
        
        // Initialize language switcher (hidden until translation is complete)
        this.initLanguageSwitcher();
        
        // Always start in Spanish. English is only applied when the user
        // explicitly chooses it on the switcher — never from IP/country/browser.
        // Undefined/failed country detection → Spanish.
        this.setLanguage('es');
        this.updateLanguageSwitcher('es');
    }
    
    // Load translations from external JSON file
    async loadTranslations() {
        try {
            const response = await fetch('assets/translations.json');
            if (!response.ok) {
                throw new Error(`Failed to load translations: ${response.status}`);
            }
            this.content = await response.json();
            console.log('Translations loaded successfully');
        } catch (error) {
            console.error('Error loading translations:', error);
            // Fallback to default content if loading fails
            this.content = {
                es: {
                    title: 'BUI',
                    nav: ['Nosotros', 'Productos', 'Contacto'],
                    navProducts: ['Agua natural', 'Agua gasificada', 'Infusiones', "b'ui Kids"],
                    slides: [{ title: 'BUI', subtitle: 'Agua natural de manantial' }],
                    marquee: 'ERES LO QUE TOMAS  |  ',
                    conoce: { text: 'b\'ui es agua natural', button: 'CONOCE MÁS' },
                    propiedades: { title: 'PROPIEDADES', items: ['Natural'] },
                    presentaciones: { title: 'Presentaciones', items: ['Agua'] },
                    showcase: { title: 'Agua natural' }
                },
                en: {
                    title: 'BUI',
                    nav: ['About Us', 'Products', 'Contact'],
                    navProducts: ['Natural water', 'Sparkling water', 'Infusions', "b'ui Kids"],
                    slides: [{ title: 'BUI', subtitle: 'Natural spring water' }],
                    marquee: 'YOU ARE WHAT YOU DRINK  |  ',
                    conoce: { text: 'b\'ui is natural water', button: 'LEARN MORE' },
                    propiedades: { title: 'PROPERTIES', items: ['Natural'] },
                    presentaciones: { title: 'Presentations', items: ['Water'] },
                    showcase: { title: 'Natural water' }
                }
            };
        }
    }
    
    // Initialize language switcher buttons
    initLanguageSwitcher() {
        const langSwitcher = document.querySelector('.header__language-switcher');
        if (langSwitcher) {
            langSwitcher.addEventListener('click', () => {
                const newLanguage = this.currentLanguage === 'es' ? 'en' : 'es';
                this.setLanguage(newLanguage);
                this.updateLanguageSwitcher(newLanguage);
            });
        }
        
        // Set initial state
        this.updateLanguageSwitcher(this.currentLanguage);
    }
    
    // Update navigation menu content (top-level only; keep product submenu separate)
    updateNavigation(language) {
        const navItems = document.querySelectorAll('.header__nav-list > .header__nav-item');
        const navContent = this.content[language].nav;
        const productLabels = this.content[language].navProducts
            || this.content[language].presentaciones?.items
            || [];

        navItems.forEach((item, index) => {
            const link = item.querySelector(':scope > .header__nav-link');
            if (!link || !navContent[index]) return;

            if (link.classList.contains('header__nav-link--dropdown')) {
                // Preserve caret while updating label
                const caret = link.querySelector('.header__nav-caret');
                link.textContent = navContent[index] + ' ';
                if (caret) {
                    link.appendChild(caret);
                } else {
                    const newCaret = document.createElement('span');
                    newCaret.className = 'header__nav-caret';
                    newCaret.setAttribute('aria-hidden', 'true');
                    link.appendChild(newCaret);
                }
            } else {
                link.textContent = navContent[index];
            }
        });

        const submenuLinks = document.querySelectorAll('.header__submenu-link');
        submenuLinks.forEach((link, index) => {
            if (productLabels[index]) {
                link.textContent = productLabels[index];
            }
        });
    }
    
    // Update language switcher visual state
    updateLanguageSwitcher(activeLanguage) {
        const langSwitcher = document.querySelector('.header__language-switcher');
        if (!langSwitcher) return;
        
        const flag = langSwitcher.querySelector('.header__flag');
        const text = langSwitcher.querySelector('.header__lang-text');
        
        if (activeLanguage === 'es') {
            // Show English option since Spanish is active
            flag.textContent = '🇺🇸';
            text.textContent = 'ENG';
        } else {
            // Show Spanish option since English is active
            flag.textContent = '🇲🇽';
            text.textContent = 'ESP';
        }
    }
    
    // Kept for possible future use; always defaults to Spanish if country is missing/unknown.
    // English is never returned automatically — only the switcher sets 'en'.
    async detectLanguageByLocation() {
        return 'es';
    }
    
    detectLanguageByBrowser() {
        this.setLanguage('es');
    }
    
    getBrowserLanguage() {
        // Auto-detect never chooses English
        return 'es';
    }
    
    setLanguage(language) {
        // Guard: only allow English if the switcher is present (translation ready).
        // Until then, force Spanish even if something asks for 'en'.
        const switcher = document.querySelector('.header__language-switcher');
        const switcherVisible =
            switcher &&
            window.getComputedStyle(switcher).display !== 'none' &&
            window.getComputedStyle(switcher).visibility !== 'hidden';

        if (language === 'en' && !switcherVisible) {
            language = 'es';
        }

        if (language !== 'es' && language !== 'en') {
            language = 'es';
        }

        this.currentLanguage = language;
        this.updateContent();
        
        // Update HTML lang attribute
        document.documentElement.lang = language === 'es' ? 'es' : 'en';
        
        // Update page title if content is loaded
        if (this.content && this.content[language]) {
            document.title = this.content[language].title;
        }
    }
    
    updateContent() {
        // Check if translations are loaded
        if (!this.content || !this.content[this.currentLanguage]) {
            console.warn('Translations not loaded yet, skipping content update');
            return;
        }
        
        const slides = document.querySelectorAll('.hero__slide');
        const content = this.content[this.currentLanguage];
        
        // Update slide content
        slides.forEach((slide, index) => {
            if (content.slides[index]) {
                const title = slide.querySelector('.hero__content-title');
                const subtitle = slide.querySelector('.hero__content-subtitle');
                
                if (title) title.textContent = content.slides[index].title;
                if (subtitle) subtitle.textContent = content.slides[index].subtitle;
            }
        });
        
        // Update marquee content
        const marqueeTexts = document.querySelectorAll('.marquee__text');
        const marqueeContent = content.marquee.repeat(6); // Repeat 6 times as in original
        
        marqueeTexts.forEach(text => {
            text.textContent = marqueeContent;
        });
        
        // Update conoce section
        const conoceText = document.querySelector('.conoce__content_text-main');
        const conoceButton = document.querySelector('.conoce__content_text-button');
        
        if (conoceText) conoceText.textContent = content.conoce.text;
        if (conoceButton) conoceButton.textContent = content.conoce.button;
        
        // Update propiedades section
        const propiedadesTitle = document.querySelector('.propiedades__content_title');
        const propiedadesItems = document.querySelectorAll('.propiedades__content_item');
        
        if (propiedadesTitle) propiedadesTitle.textContent = content.propiedades.title;
        propiedadesItems.forEach((item, index) => {
            if (content.propiedades.items[index]) {
                item.textContent = content.propiedades.items[index];
            }
        });
        
        // Update presentaciones section
        const presentacionesTitle = document.querySelector('.presentaciones__title');
        const presentacionesTitles = document.querySelectorAll('.presentaciones__item-title');
        
        if (presentacionesTitle) presentacionesTitle.textContent = content.presentaciones.title;
        presentacionesTitles.forEach((title, index) => {
            if (content.presentaciones.items[index]) {
                title.textContent = content.presentaciones.items[index];
            }
        });
        
        // Update showcase section
        const showcaseTitle = document.querySelector('.showcase__title');
        if (showcaseTitle) showcaseTitle.textContent = content.showcase.title;
        
        // Update navigation menu
        this.updateNavigation(this.currentLanguage);
    }
    
    // Public method to manually switch language (can be used for language toggle button)
    switchLanguage(language) {
        if (this.content[language]) {
            this.setLanguage(language);
        }
    }
}

// Hamburger Menu Functionality
class HamburgerMenu {
    constructor() {
        this.hamburger = document.querySelector('.header__hamburger');
        this.navList = document.querySelector('.header__nav-list');
        this.isOpen = false;
        
        this.init();
    }
    
    init() {
        if (this.hamburger && this.navList) {
            this.hamburger.addEventListener('click', () => this.toggle());
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.header__nav') && this.isOpen) {
                    this.close();
                }
            });
            
            // Close mobile menu when navigating (not when opening Productos submenu)
            const navLinks = document.querySelectorAll('.header__nav-link, .header__submenu-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (link.classList.contains('header__nav-link--dropdown')) return;
                    this.close();
                });
            });
        }
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    open() {
        this.hamburger.classList.add('header__hamburger--active');
        this.navList.classList.add('header__nav-list--active');
        this.isOpen = true;
    }
    
    close() {
        this.hamburger.classList.remove('header__hamburger--active');
        this.navList.classList.remove('header__nav-list--active');
        this.isOpen = false;
        // Collapse product dropdowns when mobile menu closes
        document.querySelectorAll('.header__nav-item--dropdown.is-open').forEach(item => {
            item.classList.remove('is-open');
            const btn = item.querySelector('.header__nav-link--dropdown');
            if (btn) btn.setAttribute('aria-expanded', 'false');
        });
    }
}

// Productos header dropdown (click toggle for touch / keyboard)
class ProductsDropdown {
    constructor() {
        this.dropdowns = document.querySelectorAll('.header__nav-item--dropdown');
        this.init();
    }

    init() {
        if (!this.dropdowns.length) return;

        this.dropdowns.forEach(dropdown => {
            const button = dropdown.querySelector('.header__nav-link--dropdown');
            if (!button) return;

            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const willOpen = !dropdown.classList.contains('is-open');
                this.closeAll();
                if (willOpen) {
                    dropdown.classList.add('is-open');
                    button.setAttribute('aria-expanded', 'true');
                }
            });
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.header__nav-item--dropdown')) {
                this.closeAll();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeAll();
        });
    }

    closeAll() {
        this.dropdowns.forEach(dropdown => {
            dropdown.classList.remove('is-open');
            const button = dropdown.querySelector('.header__nav-link--dropdown');
            if (button) button.setAttribute('aria-expanded', 'false');
        });
    }
}

// Presentaciones + categorias: play video on hover
function initPresentacionesVideos() {
    const medias = document.querySelectorAll('.presentaciones__media, .categorias__media');

    medias.forEach((media) => {
        if (media.dataset.videoHoverBound === 'true') return;

        const video = media.querySelector('video.presentaciones__video, video');
        if (!video) return;

        media.dataset.videoHoverBound = 'true';

        // Required for hover autoplay in browsers
        video.muted = true;
        video.defaultMuted = true;
        video.volume = 0;
        video.loop = true;
        video.playsInline = true;
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        // Deliberately NOT forcing preload='auto' here — these are below-
        // the-fold hover videos. Setting 'auto' at setup time makes every
        // browser fetch every video in full the instant the page loads,
        // which is what made the home page feel slow to open. play() below
        // already kicks off loading on demand the first time the user
        // actually hovers, which is when the data is needed.

        let playToken = 0;

        const playVideo = () => {
            const token = ++playToken;
            media.classList.add('is-playing');
            video.muted = true;
            video.volume = 0;

            const attempt = () => {
                if (token !== playToken) return;
                const p = video.play();
                if (p && typeof p.then === 'function') {
                    p.catch(() => {
                        // Retry once after a short delay (codec still buffering)
                        if (token !== playToken) return;
                        setTimeout(() => {
                            if (token !== playToken) return;
                            video.muted = true;
                            video.play().catch(() => {});
                        }, 150);
                    });
                }
            };

            if (video.readyState >= 2) {
                attempt();
            } else {
                const onReady = () => {
                    video.removeEventListener('canplay', onReady);
                    attempt();
                };
                video.addEventListener('canplay', onReady);
                // Kick loading without full reset if possible
                try {
                    video.play().catch(() => {});
                } catch (_) { /* ignore */ }
            }
        };

        const stopVideo = () => {
            playToken += 1;
            media.classList.remove('is-playing');
            video.pause();
            try {
                video.currentTime = 0;
            } catch (_) { /* ignore */ }
        };

        media.addEventListener('mouseenter', playVideo);
        media.addEventListener('mouseleave', stopVideo);
        media.addEventListener('focusin', playVideo);
        media.addEventListener('focusout', stopVideo);
    });
}

// Video Autoplay Manager for Small Screens
class VideoAutoplayManager {
    constructor() {
        this.isSmallScreen = window.innerWidth <= 768;
        this.init();
    }
    
    init() {
        this.checkScreenSize();
        this.forceVideoAutoplay();
        
        // Listen for window resize
        window.addEventListener('resize', () => {
            this.checkScreenSize();
            this.forceVideoAutoplay();
        });
    }
    
    checkScreenSize() {
        this.isSmallScreen = window.innerWidth <= 768;
    }
    
    forceVideoAutoplay() {
        if (!this.isSmallScreen) return;
        
        // Force autoplay for hero videos
        const heroVideos = document.querySelectorAll('.hero__video');
        heroVideos.forEach(video => {
            this.enforceVideoAttributes(video);
        });
        
        // Force autoplay for showcase video
        const showcaseVideo = document.querySelector('.showcase__video');
        if (showcaseVideo) {
            this.enforceVideoAttributes(showcaseVideo);
        }
        
        // Force autoplay for presentaciones videos
        const presentacionesVideos = document.querySelectorAll('.presentaciones__video');
        presentacionesVideos.forEach(video => {
            this.enforceVideoAttributes(video);
        });
    }
    
    enforceVideoAttributes(video) {
        if (!video) return;
        
        // Set required attributes
        video.setAttribute('autoplay', 'true');
        video.setAttribute('muted', 'true');
        video.setAttribute('loop', 'true');
        video.setAttribute('playsinline', 'true');
        
        // Force play if not already playing
        video.muted = true;
        video.loop = true;
        
        // Try to play the video
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('Video autoplay successful on small screen');
            }).catch(error => {
                console.log('Video autoplay failed, retrying...', error);
                // Retry after a short delay
                setTimeout(() => {
                    video.play().catch(e => console.log('Video autoplay retry failed', e));
                }, 1000);
            });
        }
    }
}

// Ripple Effect for Presentaciones
class RippleEffect {
    constructor() {
        this.init();
    }
    
    init() {
        // Skip categorias cards — their ::before is a permanent title gradient
        const mediaElements = document.querySelectorAll('.presentaciones__media:not(.categorias__media)');
        
        mediaElements.forEach(media => {
            media.addEventListener('click', (e) => {
                this.createRipple(media, e);
            });
        });
    }
    
    createRipple(element, event) {
        // Remove existing ripple class if present
        element.classList.remove('ripple-effect');
        
        // Force reflow to ensure class removal takes effect
        void element.offsetWidth;
        
        // Add ripple effect class
        element.classList.add('ripple-effect');
        
        // Remove the class after animation completes
        setTimeout(() => {
            element.classList.remove('ripple-effect');
        }, 1000);
        
        // Create additional ripple waves for enhanced effect
        this.createWaves(element, event);
    }
    
    createWaves(element, event) {
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        
        // Create multiple wave elements for layered effect
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.createSingleWave(element, size, i);
            }, i * 150);
        }
    }
    
    createSingleWave(element, size, index) {
        const wave = document.createElement('div');
        wave.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255,255,255,${0.3 - index * 0.1}) 0%, transparent 70%);
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: ${5 + index};
            animation: wave-expand 0.8s ease-out forwards;
        `;
        
        // Add CSS animation keyframes if not already present
        if (!document.querySelector('#wave-animation-styles')) {
            const style = document.createElement('style');
            style.id = 'wave-animation-styles';
            style.textContent = `
                @keyframes wave-expand {
                    0% {
                        width: 0;
                        height: 0;
                        opacity: 0.8;
                    }
                    50% {
                        opacity: 0.4;
                    }
                    100% {
                        width: ${size * 1.5}px;
                        height: ${size * 1.5}px;
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        element.appendChild(wave);
        
        // Remove wave element after animation
        setTimeout(() => {
            if (wave.parentNode) {
                wave.parentNode.removeChild(wave);
            }
        }, 800);
    }
}

// Sticky Header — cheap scrolled state (no blur / no layout thrash)
class StickyHeader {
    constructor() {
        this.header = document.querySelector('.header');
        this.scrollThreshold = 50;
        this.ticking = false;
        this.scrolled = false;
        this.init();
    }
    
    init() {
        if (!this.header) {
            console.warn('Header element not found');
            return;
        }
        
        window.addEventListener(
            'scroll',
            () => {
                if (this.ticking) return;
                this.ticking = true;
                requestAnimationFrame(() => {
                    this.handleScroll();
                    this.ticking = false;
                });
            },
            { passive: true }
        );
        
        this.handleScroll();
    }
    
    handleScroll() {
        const should = (window.scrollY || window.pageYOffset) > this.scrollThreshold;
        // Only touch the DOM when state actually changes
        if (should === this.scrolled) return;
        this.scrolled = should;
        this.header.classList.toggle('header--scrolled', should);
    }
}

// Text curving functionality for presentaciones
class TextCurver {
    constructor() {
        this.init();
    }
    
    init() {
        // Find all presentaciones item titles
        const titles = document.querySelectorAll('.presentaciones__item-title');
        
        titles.forEach(title => {
            this.wrapLetters(title);
        });
    }
    
    wrapLetters(titleElement) {
        // Add curve-text class
        titleElement.classList.add('curve-text');
        
        // Get the text content
        const text = titleElement.textContent;
        
        // Clear the element
        titleElement.innerHTML = '';
        
        // Wrap each letter in a span
        for (let i = 0; i < text.length; i++) {
            const letter = text[i];
            if (letter === ' ') {
                // Handle spaces
                const space = document.createElement('span');
                space.innerHTML = '&nbsp;';
                space.classList.add('letter', 'space');
                titleElement.appendChild(space);
            } else {
                const letterSpan = document.createElement('span');
                letterSpan.textContent = letter;
                letterSpan.classList.add('letter');
                titleElement.appendChild(letterSpan);
            }
        }
    }
}

// Products Grid / Carousel — data from /assets/productos.json
class ProductsGrid {
    constructor() {
        this.gridContainer = document.getElementById('productosGrid');
        this.prevBtn = document.querySelector('.productos__arrow--prev');
        this.nextBtn = document.querySelector('.productos__arrow--next');
        this.productsData = [];
        this.carouselWrapper = null;
        this.currentIndex = 0;
        this.cardStep = 0;
        this.isTransitioning = false;
        this.autoplayTimer = null;
        this.autoplayDelay = 3000; // ms between auto steps
        this.slideDuration = 500; // ms
        this.init();
    }
    
    async init() {
        await this.loadProductsData();
        this.renderProducts();
        this.bindArrows();
    }
    
    async loadProductsData() {
        try {
            const response = await fetch('assets/productos.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.productsData = data.productos;
            console.log('Products data loaded:', this.productsData);
        } catch (error) {
            console.error('Error loading products data:', error);
            // Fallback data in case JSON fails to load
            this.productsData = [
                {
                    id: 1,
                    image: "/assets/images/agua-natural.png",
                    title: "Agua de manantial natural",
                    sizes: ["10 Oz / 290 ml", "16 Oz / 473 ml", "32 Oz / 946 ml"],
                    circleColor: "#e3f2fd"
                },
                {
                    id: 2,
                    image: "/assets/images/agua-gasificada.png",
                    title: "Agua de manantial natural gasificada",
                    sizes: ["10 Oz / 290 ml", "16 Oz / 473 ml", "32 Oz / 946 ml"],
                    circleColor: "#d9d9d9"
                },
                {
                    id: 3,
                    image: "/assets/images/agua-infusionada-pepino.png",
                    title: "Agua de manantial Infusionada - Pepino",
                    sizes: ["10 Oz / 290 ml"],
                    circleColor: "#e7f5e8"
                },
                {
                    id: 4,
                    image: "/assets/images/agua-infusionada-hierbabuena.png",
                    title: "Agua de manantial Infusionada - Hierbabuena",
                    sizes: ["10 Oz / 290 ml"],
                    circleColor: "#334217"
                }
            ];
        }
    }
    
    renderProducts() {
        if (!this.gridContainer) {
            console.error('Products grid container not found');
            return;
        }
        
        this.stopAutoplay();
        this.gridContainer.innerHTML = '';
        
        const carouselWrapper = document.createElement('div');
        carouselWrapper.className = 'productos__carousel';
        
        // Two copies of the list: when we finish the first set, jump back
        // invisibly so the next product is always the first one again.
        const allProducts = [...this.productsData, ...this.productsData];
        
        allProducts.forEach(product => {
            carouselWrapper.appendChild(this.createProductCard(product));
        });
        
        this.gridContainer.appendChild(carouselWrapper);
        this.carouselWrapper = carouselWrapper;
        this.currentIndex = 0;
        
        requestAnimationFrame(() => {
            this.measureStep();
            this.setPosition(0, false);
            this.startAutoplay();
        });
        
        // Pause autoplay while hovering the track
        this.gridContainer.addEventListener('mouseenter', () => this.stopAutoplay());
        this.gridContainer.addEventListener('mouseleave', () => this.startAutoplay());
        
        console.log(`Rendered ${this.productsData.length} product cards from JSON`);
    }

    measureStep() {
        if (!this.carouselWrapper) return;
        const firstCard = this.carouselWrapper.querySelector('.productos__card');
        if (!firstCard) return;
        const gap = parseFloat(window.getComputedStyle(this.carouselWrapper).gap) || 20;
        this.cardStep = firstCard.getBoundingClientRect().width + gap;
    }

    setPosition(index, animate = true) {
        if (!this.carouselWrapper || !this.cardStep) return;

        this.carouselWrapper.style.transition = animate
            ? `transform ${this.slideDuration}ms ease`
            : 'none';
        this.carouselWrapper.style.transform = `translateX(-${index * this.cardStep}px)`;
        this.currentIndex = index;
    }

    bindArrows() {
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => {
                this.prev();
                this.restartAutoplay();
            });
        }
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => {
                this.next();
                this.restartAutoplay();
            });
        }

        // Keep step accurate on resize
        window.addEventListener('resize', () => {
            const previousIndex = this.currentIndex % Math.max(this.productsData.length, 1);
            this.measureStep();
            this.setPosition(previousIndex, false);
        });
    }

    next() {
        if (this.isTransitioning || !this.productsData.length) return;
        this.isTransitioning = true;

        const numCards = this.productsData.length;
        const nextIndex = this.currentIndex + 1;
        this.setPosition(nextIndex, true);

        // Landed on the start of the duplicate set → snap back to real first card
        if (nextIndex >= numCards) {
            setTimeout(() => {
                this.setPosition(0, false);
                this.isTransitioning = false;
            }, this.slideDuration);
        } else {
            setTimeout(() => {
                this.isTransitioning = false;
            }, this.slideDuration);
        }
    }

    prev() {
        if (this.isTransitioning || !this.productsData.length) return;
        this.isTransitioning = true;

        const numCards = this.productsData.length;

        if (this.currentIndex === 0) {
            // Jump to the duplicate first card (no animation), then slide back one
            this.setPosition(numCards, false);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this.setPosition(numCards - 1, true);
                    setTimeout(() => {
                        this.isTransitioning = false;
                    }, this.slideDuration);
                });
            });
        } else {
            this.setPosition(this.currentIndex - 1, true);
            setTimeout(() => {
                this.isTransitioning = false;
            }, this.slideDuration);
        }
    }

    startAutoplay() {
        this.stopAutoplay();
        if (this.productsData.length <= 1) return;
        this.autoplayTimer = setInterval(() => this.next(), this.autoplayDelay);
    }

    stopAutoplay() {
        if (this.autoplayTimer) {
            clearInterval(this.autoplayTimer);
            this.autoplayTimer = null;
        }
    }

    restartAutoplay() {
        this.stopAutoplay();
        this.startAutoplay();
    }
    
    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'productos__card';
        card.setAttribute('data-product-id', product.id);
        
        const sizesHTML = product.sizes.map(size => 
            `<div class="productos__card-size">${size}</div>`
        ).join('');
        
        const circleColor = product.circleColor || '#ffffff';
        
        card.innerHTML = `
            <div class="productos__card-image-container">
                <div class="productos__card-image-circle" style="background-color: ${circleColor};"></div>
                <img src="${product.image}" alt="${product.title}" class="productos__card-image" loading="eager" decoding="async">
            </div>
            <h3 class="productos__card-title">${product.title}</h3>
            <div class="productos__card-sizes">
                ${sizesHTML}
            </div>
        `;
        
        card.addEventListener('click', () => {
            this.handleCardClick(product);
        });
        
        return card;
    }
    
    handleCardClick(product) {
        console.log('Product clicked:', product);
    }
    
    addProduct(newProduct) {
        this.productsData.push(newProduct);
        this.renderProducts();
    }
    
    removeProduct(productId) {
        this.productsData = this.productsData.filter(product => product.id !== productId);
        this.renderProducts();
    }
}

// Snap the producto-hero right panel to a whole-pixel width so its 1px
// divider lands on the same crisp pixel grid as the outer 1px border.
// aspect-ratio alone can leave the panel edge at a fractional coordinate
// (e.g. 856.3125px), which makes a 1px border/pseudo-element anti-alias
// across ~2 device pixels and look thicker than the frame around it.
function snapProductoHeroDivider() {
    const heroes = document.querySelectorAll('.producto-hero');
    heroes.forEach((hero) => {
        const right = hero.querySelector('.producto-hero__panel--right');
        if (!right) return;
        const isEqual = hero.classList.contains('producto-hero--equal');
        const heroHeight = hero.clientHeight;
        const heroWidth = hero.clientWidth;

        if (isEqual) {
            // Grid: set explicit whole-pixel columns so the boundary
            // (and the divider sitting on it) is never fractional.
            const leftPx = Math.round(heroWidth / 2);
            const rightPx = heroWidth - leftPx;
            hero.style.gridTemplateColumns = leftPx + 'px ' + rightPx + 'px';
        } else {
            const widthPx = Math.round(heroHeight * (540 / 534));
            right.style.width = widthPx + 'px';
            right.style.flex = '0 0 ' + widthPx + 'px';
        }
    });
}

window.addEventListener('resize', () => {
    clearTimeout(window._snapHeroTimer);
    window._snapHeroTimer = setTimeout(snapProductoHeroDivider, 100);
});

// Distributor registration slide-over panel
function initDistribuidorPanel() {
    const panel = document.getElementById('distribuidorPanel');
    if (!panel) return;

    const openButtons = document.querySelectorAll('[data-open-distribuidor]');
    const closeTargets = panel.querySelectorAll('[data-close-distribuidor]');
    const closeBtn = panel.querySelector('.distribuidor-panel__close');

    const open = () => {
        panel.classList.add('is-open');
        panel.setAttribute('aria-hidden', 'false');
        // No scrollIntoView here: the panel expands in normal flow right
        // below the button, so the page should stay exactly where it is
        // and let the content below get pushed down.
        if (closeBtn) closeBtn.focus({ preventScroll: true });
    };

    const close = () => {
        panel.classList.remove('is-open');
        panel.setAttribute('aria-hidden', 'true');
    };

    openButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            open();
        });
    });

    closeTargets.forEach((el) => {
        el.addEventListener('click', close);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && panel.classList.contains('is-open')) {
            close();
        }
    });

    window.openDistribuidorPanel = open;
    window.closeDistribuidorPanel = close;
}

// Initialize carousel and language manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded - initializing components...');
    console.log('Document ready state:', document.readyState);
    
    // Check if hero elements exist
    const heroSection = document.querySelector('.hero');
    const heroCarousel = document.querySelector('.hero__carousel');
    const heroSlides = document.querySelectorAll('.hero__slide');
    const heroDots = document.querySelector('.hero__dots');
    
    console.log('Hero section:', heroSection);
    console.log('Hero carousel:', heroCarousel);
    console.log('Hero slides:', heroSlides.length);
    console.log('Hero dots container:', heroDots);
    
    try {
        // Initialize core components
        console.log('Creating HeroCarousel...');
        window.heroCarousel = new HeroCarousel();
        console.log('HeroCarousel created:', window.heroCarousel);
        
        console.log('Creating LanguageManager...');
        window.languageManager = new LanguageManager();
        
        console.log('Creating HamburgerMenu...');
        window.hamburgerMenu = new HamburgerMenu();
        window.productsDropdown = new ProductsDropdown();
        
        console.log('Creating VideoAutoplayManager...');
        window.videoAutoplayManager = new VideoAutoplayManager();
        
        console.log('Creating RippleEffect...');
        window.rippleEffect = new RippleEffect();
        
        console.log('Creating StickyHeader...');
        window.stickyHeader = new StickyHeader();
        
        console.log('Creating TextCurver...');
        window.textCurver = new TextCurver();
        
        console.log('Creating ProductsGrid...');
        window.productsGrid = new ProductsGrid();

        initDistribuidorPanel();
        snapProductoHeroDivider();

        console.log('All components initialized successfully');
    } catch (error) {
        console.error('Error initializing components:', error);
    }
    
    // Hover videos for presentaciones + categorias cards
    initPresentacionesVideos();
    // Retry shortly in case media elements load late
    setTimeout(initPresentacionesVideos, 500);
});
