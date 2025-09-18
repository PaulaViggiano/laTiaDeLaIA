

(function() {
    'use strict';

    // ===== UTILIDADES =====
    
    // Debounce function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function
    function throttle(func, delay) {
        let timeoutId;
        let lastExecTime = 0;
        return function (...args) {
            const currentTime = Date.now();
            if (currentTime - lastExecTime > delay) {
                func.apply(this, args);
                lastExecTime = currentTime;
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                    lastExecTime = Date.now();
                }, delay - (currentTime - lastExecTime));
            }
        };
    }

    // Smooth scroll function
    function smoothScrollTo(target) {
        if (!target) return;

        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - 100;
        
        if ('scrollBehavior' in document.documentElement.style) {
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        } else {
            // Fallback para navegadores antiguos
            window.scrollTo(0, targetPosition);
        }
    }

    // Track events function
    function trackEvent(action, category, label, data) {
        console.log('Event tracked:', { action, category, label, data });
        
        // Google Analytics
        if (typeof gtag === 'function') {
            gtag('event', action, {
                event_category: category,
                event_label: label,
                ...data
            });
        }
    }

    // ===== HEADER COMPONENT =====
    
    function initHeader() {
        const header = document.querySelector('.header');
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const navLinks = document.querySelector('.nav-links');
        const nav = document.querySelector('.nav');
        let isMenuOpen = false;

        if (!header) return;

        // Scroll effect
        const handleScroll = throttle(() => {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }, 16);

        window.addEventListener('scroll', handleScroll, { passive: true });

        // Smooth scroll para enlaces internos
        const links = nav.querySelectorAll('a[href^="#"]');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const target = document.querySelector(targetId);
                
                if (target) {
                    smoothScrollTo(target);
                    closeMobileMenu();
                    trackEvent('navigation', 'internal_link', targetId);
                }
            });
        });

        // Mobile menu
        if (mobileToggle && navLinks) {
            mobileToggle.addEventListener('click', toggleMobileMenu);
            
            // Cerrar menú al hacer click fuera
            document.addEventListener('click', (e) => {
                if (isMenuOpen && !nav.contains(e.target)) {
                    closeMobileMenu();
                }
            });

            // Cerrar con Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && isMenuOpen) {
                    closeMobileMenu();
                }
            });
        }

        function toggleMobileMenu() {
            isMenuOpen = !isMenuOpen;
            
            mobileToggle.classList.toggle('active', isMenuOpen);
            navLinks.classList.toggle('active', isMenuOpen);
            mobileToggle.setAttribute('aria-expanded', isMenuOpen);
            
            // Prevenir scroll del body
            document.body.style.overflow = isMenuOpen ? 'hidden' : '';
            
            trackEvent('menu_toggle', 'navigation', isMenuOpen ? 'open' : 'close');
        }

        function closeMobileMenu() {
            if (!isMenuOpen) return;
            
            isMenuOpen = false;
            mobileToggle.classList.remove('active');
            navLinks.classList.remove('active');
            mobileToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }

        // Cerrar menú en resize
        window.addEventListener('resize', debounce(() => {
            if (window.innerWidth > 768 && isMenuOpen) {
                closeMobileMenu();
            }
        }, 250));
    }

    // ===== VIDEO COMPONENT =====
    
    function initVideo() {
        const containers = document.querySelectorAll('.video-container');
        
        containers.forEach(container => {
            const placeholder = container.querySelector('.video-placeholder');
            const playBtn = container.querySelector('.video-play-btn');
            const iframe = container.querySelector('.lazy-iframe');
            
            if (!placeholder || !playBtn || !iframe) return;
            
            playBtn.addEventListener('click', () => {
                loadAndPlayVideo(container, placeholder, iframe);
            });

            // Auto-load en desktop
            if (window.innerWidth > 768) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            setTimeout(() => {
                                loadVideo(iframe);
                            }, 1000);
                            observer.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.5 });
                
                observer.observe(container);
            }
        });

        function loadAndPlayVideo(container, placeholder, iframe) {
            loadVideo(iframe);
            
            placeholder.style.opacity = '0';
            setTimeout(() => {
                placeholder.style.display = 'none';
            }, 300);
            
            trackEvent('video_play', 'engagement', 'hero_video');
        }

        function loadVideo(iframe) {
            const src = iframe.dataset.src;
            if (src && !iframe.src) {
                iframe.src = src + '&autoplay=1';
                iframe.classList.add('loaded');
            }
        }
    }

    // ===== SCROLL ANIMATIONS =====
    
    function initScrollAnimations() {
        const elements = document.querySelectorAll('.scroll-reveal');
        
        if (elements.length === 0) return;

        // Respetar preferencias de reduced motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            elements.forEach(el => el.classList.add('revealed'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    
                    // Dejar de observar después de la animación
                    setTimeout(() => {
                        observer.unobserve(entry.target);
                    }, 600);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        elements.forEach(el => observer.observe(el));
    }

    // ===== CTA TRACKING =====
    
    function initCTATracking() {
        const ctaButtons = document.querySelectorAll('[data-track]');
        
        ctaButtons.forEach(button => {
            const trackingId = button.dataset.track;
            const href = button.href;
            const text = button.textContent.trim();
            
            button.addEventListener('click', (e) => {
                trackEvent('cta_click', 'conversion', trackingId, {
                    button_text: text,
                    button_href: href
                });
                
                // Para enlaces externos, pequeño delay para tracking
                if (href && href.includes('http') && !href.includes(window.location.hostname)) {
                    e.preventDefault();
                    setTimeout(() => {
                        window.open(href, button.target || '_self');
                    }, 100);
                }
            });

            // Track visibility
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        trackEvent('cta_view', 'engagement', trackingId, {
                            button_text: text
                        });
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            
            observer.observe(button);
        });
    }

    // ===== ANALYTICS SETUP =====
    
    function setupAnalytics() {
        // Configurar Google Analytics si está disponible
        if (typeof gtag === 'function') {
            gtag('config', 'GA_MEASUREMENT_ID', {
                page_title: document.title,
                page_location: window.location.href
            });
        }

        // Track tiempo en página
        const startTime = Date.now();
        
        const timeInterval = setInterval(() => {
            const timeSpent = Math.round((Date.now() - startTime) / 1000);
            trackEvent('time_on_page', 'engagement', `${timeSpent}s`, {
                time_spent: timeSpent
            });
        }, 30000);

        // Cleanup al salir
        window.addEventListener('beforeunload', () => {
            clearInterval(timeInterval);
            const finalTime = Math.round((Date.now() - startTime) / 1000);
            trackEvent('session_end', 'engagement', 'page_exit', {
                total_time: finalTime
            });
        });

        // Track scroll depth
        const thresholds = [25, 50, 75, 90, 100];
        const tracked = new Set();
        
        const trackScrollDepth = throttle(() => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );
            
            thresholds.forEach(threshold => {
                if (scrollPercent >= threshold && !tracked.has(threshold)) {
                    tracked.add(threshold);
                    trackEvent('scroll_depth', 'engagement', `${threshold}%`, {
                        scroll_depth: threshold
                    });
                }
            });
        }, 100);

        window.addEventListener('scroll', trackScrollDepth, { passive: true });
    }

    // ===== LAZY LOADING IFRAMES =====
    
    function initLazyLoading() {
        const iframes = document.querySelectorAll('.lazy-iframe');
        
        const loadIframe = (iframe) => {
            const src = iframe.dataset.src;
            if (src) {
                iframe.src = src;
                iframe.classList.add('loaded');
                iframe.removeAttribute('data-src');
            }
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadIframe(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        iframes.forEach(iframe => observer.observe(iframe));
    }

    // ===== ERROR HANDLING =====
    
    function setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('JavaScript Error:', event.message);
            trackEvent('error', 'javascript', 'global_error', {
                error_message: event.message,
                error_filename: event.filename,
                error_line: event.lineno
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled Promise Rejection:', event.reason);
            trackEvent('error', 'javascript', 'unhandled_promise', {
                error_message: event.reason
            });
        });
    }

    // ===== INITIALIZATION =====
    
    function initApp() {
        console.log('🚀 Initializing La tIA de la IA Landing...');
        
        try {
            // Inicializar todos los componentes
            initHeader();
            initVideo();
            initScrollAnimations();
            initCTATracking();
            initLazyLoading();
            setupAnalytics();
            setupErrorHandling();
            
            // Track successful initialization
            trackEvent('app_initialized', 'technical', 'success', {
                load_time: performance.now(),
                user_agent: navigator.userAgent.substring(0, 100) // Truncar para analytics
            });
            
            console.log('✅ App initialized successfully');
            
        } catch (error) {
            console.error('Error initializing app:', error);
            trackEvent('error', 'javascript', 'app_initialization', {
                error_message: error.message
            });
        }
    }

    // ===== DOM READY =====
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }

    // Exponer funciones útiles globalmente para debugging
    window.LaTiaApp = {
        trackEvent: trackEvent,
        smoothScrollTo: smoothScrollTo
    };

})();
