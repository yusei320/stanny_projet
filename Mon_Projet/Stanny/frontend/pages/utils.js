(function () {
    function readStoredUser() {
        var rawUser = localStorage.getItem('user');
        if (!rawUser) return null;
        try { return JSON.parse(rawUser); } catch (e) { return null; }
    }

    function decodeJwtPayload(token) {
        if (!token || token.split('.').length < 2) return null;
        try {
            var payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(atob(payload));
        } catch (e) { return null; }
    }

    function getCurrentUser() {
        var storedUser = readStoredUser();
        if (storedUser) return storedUser;
        return decodeJwtPayload(localStorage.getItem('token')) || {};
    }

    function getCurrentPageName() {
        var path = window.location.pathname || '';
        return path.substring(path.lastIndexOf('/') + 1).toLowerCase();
    }

    function getInitials(name) {
        return String(name || 'U')
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map(function (p) { return p.charAt(0).toUpperCase(); })
            .join('') || 'U';
    }

    function createSidebarMarkup() {
        var pageName = getCurrentPageName();
        var user = getCurrentUser();
        var userName = (user && user.name) ? user.name : 'Administrateur';
        var userEmail = (user && user.email) ? user.email : 'contact@statcom.com';
        var userInitials = getInitials(userName);
        var avatarHtml = (user && user.profile_image) 
            ? '<img src="' + user.profile_image + '" class="sb-user-img">'
            : '<div class="sb-user-initials">' + userInitials + '</div>';

        function isActive(target) {
            var targetBase = target.replace('.html', '');
            var currentPageBase = pageName.replace('.html', '');
            return (currentPageBase === targetBase || pageName === targetBase) ? ' active' : '';
        }

        return [
            '<div class="sidebar-header">',
            '  <div class="sb-brand">',
            '    <div class="sb-logo-wrap"><div class="sb-logo-ring"><img src="/assets/img/logo.png" id="sidebarBrandLogo" class="sb-logo-img"></div></div>',
            '  </div>',
            '  <button class="sb-burger-btn" onclick="utils.toggleSidebar()" id="sb-burger" title="Agrandir/Réduire">',
            '    <span></span><span></span><span></span>',
            '  </button>',
            '</div>',

            '<nav class="sb-nav">',
            '  <a href="/dashboard" class="sb-link' + isActive('dashboard') + '" title="Tableau de Bord">',
            '    <i class="fas fa-th-large"></i><span>Dashboard</span>',
            '  </a>',
            '  <a href="/clients" class="sb-link' + isActive('clients') + '" title="Clients">',
            '    <i class="fas fa-users"></i><span>Clients</span>',
            '  </a>',
            '  <a href="/projets" class="sb-link' + isActive('projets') + '" title="Projets">',
            '    <i class="fas fa-project-diagram"></i><span>Projets</span>',
            '  </a>',
            '  <a href="/tasks" class="sb-link' + isActive('tasks') + '" title="Tâches">',
            '    <i class="fas fa-tasks"></i><span>Tâches</span>',
            '  </a>',
            '  <a href="/employes" class="sb-link' + isActive('employes') + '" title="Employés">',
            '    <i class="fas fa-user-tie"></i><span>Employés</span>',
            '  </a>',
            
            '  <div class="sb-accordion' + (['caisse', 'devis', 'factures', 'fiche-fin-travaux'].some(function(r){ return pageName.includes(r); }) ? ' open' : '') + '">',
            '    <div class="sb-acc-header" onclick="utils.toggleAccordion(this)" title="Finances">',
            '      <i class="fas fa-wallet"></i><span>Finances</span><i class="fas fa-chevron-right arrow"></i>',
            '    </div>',
            '    <div class="sb-acc-body">',
            '      <a href="/caisse" class="sb-sub-link' + isActive('caisse') + '"><i class="fas fa-cash-register"></i>Caisse</a>',
            '      <a href="/devis" class="sb-sub-link' + isActive('devis') + '"><i class="fas fa-file-invoice"></i>Devis</a>',
            '      <a href="/factures" class="sb-sub-link' + isActive('factures') + '"><i class="fas fa-file-invoice-dollar"></i>Factures</a>',
            '      <a href="/fiche-fin-travaux" class="sb-sub-link' + isActive('fiche-fin-travaux') + '"><i class="fas fa-clipboard-check"></i>Fiches Travaux</a>',
            '    </div>',
            '  </div>',

            '  <a href="/historique" class="sb-link' + isActive('historique') + '" title="Historique">',
            '    <i class="fas fa-history"></i><span>Historique</span>',
            '  </a>',
            '</nav>',

            '<div class="sb-footer">',
            '  <a href="/profile" class="sb-user-card' + isActive('profile') + '" title="Mon Profil">',
            '    ' + avatarHtml,
            '    <div class="sb-user-info">',
            '      <div class="sb-user-name">' + userName + '</div>',
            '      <div class="sb-user-email">' + userEmail + '</div>',
            '    </div>',
            '  </a>',
            '</div>'
        ].join('\n');
    }

    function injectSidebarStyles() {
        if (document.getElementById('sb-styles')) return;
        var style = document.createElement('style');
        style.id = 'sb-styles';
        style.textContent = `
            :root {
                --sb-bg: rgba(10, 14, 26, 0.95);
                --sb-width: 280px;
                --sb-width-collapsed: 80px;
                --sb-accent: #3399ff;
                --sb-text: #e0e6f0;
                --sb-text-muted: rgba(255,255,255,0.4);
            }

            .sidebar {
                width: var(--sb-width); height: 100vh; 
                background: url('/assets/img/sidebar_bg.png') center/cover no-repeat, var(--sb-bg);
                backdrop-filter: blur(20px); border-right: 1px solid rgba(255,255,255,0.06);
                display: flex; flex-direction: column; position: fixed; top: 0; left: 0;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); z-index: 1000;
                font-family: 'Outfit', sans-serif; overflow: hidden;
            }
            .sidebar.collapsed { width: var(--sb-width-collapsed); }

            .sidebar-header { padding: 24px 20px; display: flex; align-items: center; justify-content: space-between; min-height: 80px; }
            .sb-brand { display: flex; align-items: center; gap: 14px; transition: 0.3s; }
            .sb-logo-wrap { flex-shrink: 0; }
            .sb-logo-ring {
                width: auto; height: auto; max-width: 180px;
                background: transparent;
                padding: 0;
                box-shadow: none;
                animation: none;
                display: flex; align-items: center; justify-content: center;
            }
            @keyframes logoGlow {
                from { box-shadow: 0 0 10px rgba(51,153,255,0.3), 0 0 20px rgba(51,153,255,0.1); }
                to   { box-shadow: 0 0 20px rgba(51,153,255,0.6), 0 0 40px rgba(51,153,255,0.2); }
            }
            .sb-logo-img { width: 100%; height: auto; border-radius: 0; object-fit: contain; display: block; background: transparent; }
            .sb-brand-text { display: flex; flex-direction: column; line-height: 1; }
            .sb-brand-main { font-size: 17px; font-weight: 900; letter-spacing: 1.5px; color: #fff; }
            .sb-brand-accent { color: var(--sb-accent); }
            .sb-brand-sub { font-size: 9px; font-weight: 700; letter-spacing: 4px; color: rgba(255,255,255,0.3); text-transform: uppercase; margin-top: 3px; }
            .sidebar.collapsed .sb-brand { opacity: 0; pointer-events: none; width: 0; }

            .sb-burger-btn { background: none; border: none; cursor: pointer; width: 30px; height: 20px; position: relative; display: flex; flex-direction: column; justify-content: space-between; z-index: 10; padding: 0; }
            .sb-burger-btn span { display: block; width: 100%; height: 2px; background: var(--sb-accent, #fff); border-radius: 2px; transition: 0.3s; }
            .sb-burger-btn:hover span { background: #fff; }
            
            /* Animation Burger quand COLLAPSED */
            .sidebar.collapsed .sb-burger-btn span:nth-child(1) { transform: none; }
            .sidebar.collapsed .sb-burger-btn span:nth-child(2) { opacity: 1; }
            .sidebar.collapsed .sb-burger-btn span:nth-child(3) { transform: none; }

            .sb-nav { flex: 1; padding: 10px 15px; overflow-y: auto; overflow-x: hidden; }
            .sb-link { display: flex; align-items: center; gap: 15px; padding: 15px 20px; border-radius: 14px; color: rgba(255,255,255,0.6); text-decoration: none; font-size: 14px; font-weight: 500; transition: all 0.3s; margin-bottom: 12px; position: relative; }
            .sb-link i { font-size: 20px; width: 24px; text-align: center; transition: 0.3s; }
            .sb-link:hover { background: rgba(255,255,255,0.05); color: #fff; }
            .sb-link.active {
                background: linear-gradient(90deg, var(--sb-active-bg, rgba(51, 153, 255, 0.15)) 0%, transparent 100%);
                color: var(--sb-accent);
                border-left: 4px solid var(--sb-accent);
                border-radius: 4px 14px 14px 4px;
            }
            .sidebar.collapsed .sb-link span { opacity: 0; width: 0; }
            .sidebar.collapsed .sb-link { padding: 15px 25px; }

            .sb-acc-header { display: flex; align-items: center; gap: 15px; padding: 15px 20px; border-radius: 14px; color: rgba(255,255,255,0.6); cursor: pointer; font-size: 14px; font-weight: 500; transition: 0.3s; margin-bottom: 5px; }
            .sb-acc-header .arrow { margin-left: auto; font-size: 10px; transition: transform 0.3s; }
            .sb-accordion.open .arrow { transform: rotate(90deg); }
            .sb-accordion.open .sb-acc-header { color: var(--sb-accent); }
            .sb-acc-body { max-height: 0; overflow: hidden; transition: all 0.4s ease; padding-left: 40px; }
            .sb-accordion.open .sb-acc-body { max-height: 200px; padding-top: 5px; padding-bottom: 10px; }
            .sb-sub-link { display: flex; align-items: center; gap: 10px; padding: 8px 12px; font-size: 13px; color: var(--sb-text-muted); text-decoration: none; border-radius: 8px; transition: 0.2s; }
            .sb-sub-link i { font-size: 14px; width: 16px; text-align: center; opacity: 0.7; }
            .sb-sub-link:hover, .sb-sub-link.active { color: #fff; background: rgba(255,255,255,0.05); }
            .sb-sub-link.active { color: var(--sb-accent); font-weight: 600; }
            .sb-sub-link.active i { opacity: 1; }
            .sidebar.collapsed .sb-acc-header span, .sidebar.collapsed .sb-acc-header .arrow { display: none; }
            .sidebar.collapsed .sb-acc-header { padding: 12px 25px; }

            .sb-footer { padding: 20px; border-top: 1px solid rgba(255,255,255,0.06); }
            .sb-user-card { display: flex; align-items: center; gap: 12px; text-decoration: none; padding: 12px; border-radius: 15px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); transition: 0.2s; overflow: hidden; }
            .sb-user-card:hover { background: rgba(255,255,255,0.06); }
            .sb-user-card.active { border-color: var(--sb-accent); background: rgba(255,255,255,0.05); }
            .sb-user-img { width: 40px; height: 40px; border-radius: 10px; object-fit: cover; border: 2px solid var(--sb-accent); flex-shrink: 0; }
            .sb-user-initials { width: 40px; height: 40px; border-radius: 10px; background: var(--sb-accent); display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; flex-shrink: 0; }
            .sb-user-info { transition: opacity 0.2s; white-space: nowrap; }
            .sb-user-name { font-size: 14px; font-weight: 700; color: #fff; }
            .sb-user-email { font-size: 11px; color: var(--sb-text-muted); }
            .sidebar.collapsed .sb-user-info { display: none; }
            .sidebar.collapsed .sb-footer { padding: 20px 10px; }

            /* --- SCROLLBAR IMPÉRATIVE & ULTRA-VISIBLE --- */
            html, body { overflow-x: hidden; }
            .page-body, .main-content { overflow-y: scroll !important; }

            *::-webkit-scrollbar { 
                width: 12px !important; 
                height: 12px !important; 
                display: block !important;
            }
            *::-webkit-scrollbar-track { 
                background: rgba(255, 255, 255, 0.05) !important; 
                border-left: 1px solid rgba(255, 255, 255, 0.1) !important;
            }
            *::-webkit-scrollbar-thumb { 
                background: var(--sb-accent, #3399ff) !important; 
                border-radius: 0px !important; /* Carré pour un look plus "barre" */
                border: 1px solid rgba(0,0,0,0.2) !important;
                box-shadow: inset 0 0 6px rgba(0,0,0,0.3) !important;
            }
            *::-webkit-scrollbar-thumb:hover { 
                background: #fff !important;
            }
            
            /* --- ASCENSEUR STYLE ANTIGRAVITY --- */
            .sb-nav { 
                overflow-y: auto !important; 
                scrollbar-width: thin !important;
                scrollbar-color: var(--sb-accent) transparent !important;
            }
            .sb-nav::-webkit-scrollbar { 
                width: 8px !important; 
            }
            .sb-nav::-webkit-scrollbar-track { 
                background: transparent !important; 
            }
            .sb-nav::-webkit-scrollbar-thumb { 
                background-color: var(--sb-accent, #3399ff) !important; 
                border-radius: 20px !important;
                border: 2px solid transparent !important; /* Crée l'effet de flottement */
                background-clip: content-box !important;
            }
            .sb-nav::-webkit-scrollbar-thumb:hover {
                background-color: #fff !important;
            }

            .mobile-burger {
                display: none;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                color: #fff;
                width: 40px;
                height: 40px;
                border-radius: 10px;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                margin-right: 15px;
                font-size: 18px;
            }

            @media (max-width: 768px) {
                .mobile-burger { display: flex; }
                .sidebar { position: fixed; left: -280px; top: 0; }
                .sidebar.mobile-open { left: 0; box-shadow: 20px 0 50px rgba(0,0,0,0.5); }
                .sb-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999; display: none; backdrop-filter: blur(4px); }
                .sb-overlay.show { display: block; }
            }

            /* --- GLOBAL LIGHT MODE OVERRIDES (FORCED WHITE THEME) --- */
            body.light-mode { background: #ffffff !important; color: #1e293b !important; }
            body.light-mode .main-content { background: #ffffff !important; }
            body.light-mode .top-header { background: #ffffff !important; border-bottom: 1px solid #e2e8f0 !important; }
            body.light-mode .top-header h1, body.light-mode .top-header p, body.light-mode .sb-u-name, body.light-mode .sb-brand-text { color: #1e293b !important; }
            body.light-mode .dash-card, body.light-mode .stat-card-mini, body.light-mode .data-card, body.light-mode .table-card, body.light-mode .task-card, body.light-mode .client-card, body.light-mode .section-card, body.light-mode .hero-container, body.light-mode .modal-content { background: #ffffff !important; border: 1px solid #e2e8f0 !important; box-shadow: 0 4px 15px rgba(0,0,0,0.05) !important; }
            body.light-mode .card-val, body.light-mode .stat-val-mini, body.light-mode .c-name, body.light-mode .task-name, body.light-mode td, body.light-mode .user-name { color: #1e293b !important; }
            body.light-mode th { color: #64748b !important; }
            body.light-mode .text-muted, body.light-mode p { color: #64748b !important; }
            body.light-mode .form-input, body.light-mode .form-select, body.light-mode .search-input { background: #f8fafc !important; color: #1e293b !important; border-color: #e2e8f0 !important; }
            body.light-mode .slider { background-color: #cbd5e1 !important; }
            body.light-mode .time-badge { background: #f8fafc !important; border: 1px solid #e2e8f0 !important; }
            body.light-mode #current-time { color: #1e293b !important; }
            body.light-mode #current-date { color: #64748b !important; }
            body.light-mode .view-toggle { background: #f8fafc !important; border: 1px solid #e2e8f0 !important; }
            body.light-mode .toggle-btn { color: #64748b !important; }
            body.light-mode .toggle-btn:hover { color: #1e293b !important; background: rgba(0,0,0,0.05) !important; }
            /* SIDEBAR IS INTENTIONALLY EXCLUDED FROM LIGHT MODE OVERRIDES TO KEEP IT DARK */

            /* --- GLOBAL STANDARDIZED BUTTONS --- */
            .btn-primary {
                background: var(--sb-accent, #3399ff);
                color: #fff;
                border: none;
                padding: 10px 20px;
                border-radius: 12px;
                font-weight: 700;
                font-family: 'Outfit', sans-serif;
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 4px 15px var(--sb-active-bg);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-size: 13px;
            }
            .btn-primary:hover {
                transform: translateY(-2px);
                filter: brightness(1.1);
                box-shadow: 0 8px 25px var(--sb-active-bg);
            }
            .btn-primary:active { transform: translateY(0) scale(0.98); }

            .btn-icon {
                width: 36px;
                height: 36px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: none;
                cursor: pointer;
                transition: all 0.2s;
                background: rgba(255,255,255,0.05);
                color: rgba(255,255,255,0.6);
            }
            .btn-icon:hover { background: rgba(255,255,255,0.1); color: #fff; transform: scale(1.1); }
            
            .btn-edit { color: var(--sb-accent) !important; background: var(--sb-active-bg) !important; }
            .btn-edit:hover { background: var(--sb-accent) !important; color: #fff !important; }
            
            .btn-delete { color: #f87171 !important; background: rgba(248, 113, 113, 0.1) !important; }
            .btn-delete:hover { background: #f87171 !important; color: #fff !important; }

            .btn-outline {
                background: transparent;
                border: 1px solid rgba(255,255,255,0.1);
                color: rgba(255,255,255,0.6);
                padding: 8px 16px;
                border-radius: 10px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: 0.2s;
            }
            .btn-outline:hover { background: rgba(255,255,255,0.05); color: #fff; border-color: rgba(255,255,255,0.2); }

            /* Animation bounce pour les boutons d'action principale */
            .btn-glow {
                animation: pulseGlow 2s infinite;
            }
            @keyframes pulseGlow {
                0% { box-shadow: 0 0 0 0 rgba(var(--sb-accent-rgb, 51, 153, 255), 0.4); }
                70% { box-shadow: 0 0 0 15px rgba(var(--sb-accent-rgb, 51, 153, 255), 0); }
                100% { box-shadow: 0 0 0 0 rgba(var(--sb-accent-rgb, 51, 153, 255), 0); }
            }
        `;

        document.head.appendChild(style);
        
        if (!document.querySelector('.sb-overlay')) {
            var overlay = document.createElement('div');
            overlay.className = 'sb-overlay';
            overlay.onclick = function() { utils.toggleSidebar(); };
            document.body.appendChild(overlay);
        }
    }

    window.utils = {
        checkAuth: function () {
            if (!localStorage.getItem('token')) {
                window.location.href = '../auth/login.html';
                return false;
            }
            return true;
        },

        initTheme: function() {
            // Force light mode (white background) permanently as requested
            document.body.classList.add('light-mode');
        },

        toggleSidebar: function () {
            var sb = document.querySelector('.sidebar');
            var overlay = document.querySelector('.sb-overlay');
            if (!sb) return;

            if (window.innerWidth <= 768) {
                sb.classList.toggle('mobile-open');
                if (overlay) overlay.classList.toggle('show');
            } else {
                var isCollapsed = sb.classList.toggle('collapsed');
                localStorage.setItem('sidebar-collapsed', isCollapsed);
            }
        },

        toggleAccordion: function (header) {
            var acc = header.parentElement;
            var sb = document.querySelector('.sidebar');
            if (sb && sb.classList.contains('collapsed')) {
                this.toggleSidebar();
            }
            acc.classList.toggle('open');
        },

        loadSidebar: function (activePage, themeColor) {
            var sidebar = document.getElementById('sidebar');
            if (!sidebar) return;
            
            injectSidebarStyles();
            sidebar.innerHTML = createSidebarMarkup();
            
            this.initTheme();

            if (window.innerWidth > 768 && localStorage.getItem('sidebar-collapsed') === 'true') {
                sidebar.classList.add('collapsed');
            }
            
            if (themeColor) {
                sidebar.style.setProperty('--sb-accent', themeColor);
                sidebar.style.setProperty('--sb-active-bg', themeColor + '26');
                // For scrollbar
                document.documentElement.style.setProperty('--sb-accent', themeColor);
            }
            
            // Apply cached transparent logo or process it
            var self = this;
            var logoImg = document.getElementById('sidebarBrandLogo');
            if (logoImg) {
                // If we have a cached transparent logo, use it immediately
                if (window._cachedLogoPng) {
                    logoImg.src = window._cachedLogoPng;
                } else {
                    // Otherwise process it for the first time
                    if (logoImg.complete) {
                        self.makeLogoTransparent(logoImg);
                    } else {
                        logoImg.onload = function() {
                            self.makeLogoTransparent(logoImg);
                        };
                    }
                }
            }
        },

        makeLogoTransparent: function(imageEl) {
            if (!imageEl) return;
            
            var processImage = function() {
                var src = imageEl.currentSrc || imageEl.src || '';
                if (!src) return;

                var probe = new Image();
                probe.crossOrigin = 'anonymous';
                probe.onload = function() {
                    try {
                        var canvas = document.createElement('canvas');
                        canvas.width = probe.naturalWidth;
                        canvas.height = probe.naturalHeight;
                        var ctx = canvas.getContext('2d', { willReadFrequently: true });
                        ctx.drawImage(probe, 0, 0);
                        var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        var px = imgData.data;

                        // Turn near-white pixels transparent
                        for (var i = 0; i < px.length; i += 4) {
                            var r = px[i];
                            var g = px[i + 1];
                            var b = px[i + 2];
                            if (r > 235 && g > 235 && b > 235) {
                                px[i + 3] = 0;
                            }
                        }

                        ctx.putImageData(imgData, 0, 0);
                        var pngDataUrl = canvas.toDataURL('image/png');
                        // Cache the transparent logo
                        window._cachedLogoPng = pngDataUrl;
                        imageEl.src = pngDataUrl;
                    } catch (err) {
                        console.error('Error processing logo:', err);
                    }
                };
                probe.onerror = function() {
                    // Keep original if loading fails
                };
                probe.src = src;
            };
            
            // Wait for image to load if not already loaded
            if (imageEl.complete) {
                processImage();
            } else {
                imageEl.onload = processImage;
            }
        },

        formatDate: function(dateStr) {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            const format = localStorage.getItem('date_format') || 'dd/MM/yyyy';
            if (format === 'MM/dd/yyyy') return date.toLocaleDateString('en-US');
            return date.toLocaleDateString('fr-FR');
        },

        escapeHtml: function (text) {
            if (!text) return '';
            var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
            return String(text).replace(/[&<>"']/g, function(m) { return map[m]; });
        },

        downloadPdf: async function(url, defaultFilename) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(url, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                
                if (response.status === 401) {
                    if(typeof notify !== "undefined") notify.error("Session expirée. Veuillez vous reconnecter."); else alert("Session expirée. Veuillez vous reconnecter.");
                    window.location.href = '/login';
                    return;
                }
                
                if (!response.ok) {
                    throw new Error('Erreur lors de la génération du PDF');
                }
                
                const blob = await response.blob();
                const contentDisposition =
                    response.headers.get('content-disposition') ||
                    response.headers.get('Content-Disposition') ||
                    response.headers.get('Content-disposition');
                let filename = defaultFilename || 'document.pdf';
                if (contentDisposition) {
                    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
                    const asciiMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
                    if (utf8Match && utf8Match[1]) {
                        filename = decodeURIComponent(utf8Match[1]);
                    } else if (asciiMatch && asciiMatch[1]) {
                        filename = asciiMatch[1];
                    }
                }
                
                const blobUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(blobUrl);
            } catch (e) {
                console.error(e);
                if(typeof notify !== "undefined") notify.error("Erreur lors du téléchargement du PDF: " + e.message); else alert("Erreur lors du téléchargement du PDF: " + e.message);
            }
        },

        logout: function () {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    };
})();