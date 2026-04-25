(function() {
'use strict';

document.addEventListener('DOMContentLoaded', function() {
    if (!document.getElementById('sidebar')) return;

    /* ====== CSS ====== */
    const style = document.createElement('style');
    style.textContent = `
        .progress-track { display: flex; align-items: center; gap: 0; }
        .progress-dot { width: 14px; height: 14px; border-radius: 50%; background: #ddd; position: relative; z-index: 1; }
        .progress-dot.filled { background: #22C55E; }
        .progress-dot.current { background: #E91E8C; box-shadow: 0 0 0 3px rgba(233,30,140,0.2); }
        .progress-line { width: 28px; height: 3px; background: #ddd; }
        .progress-line.filled { background: #22C55E; }
        .tracking-input { border: 1px solid #E0E0E0; border-radius: 6px; padding: 4px 8px; font-size: 12px; width: 140px; font-family: monospace; }
        .log-type { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .log-type.orders { background: rgba(59,130,246,0.1); color: #3B82F6; }
        .log-type.inventory { background: rgba(34,197,94,0.1); color: #22C55E; }
        .log-type.pricing { background: rgba(245,158,11,0.1); color: #F59E0B; }
        .log-type.login { background: rgba(139,92,246,0.1); color: #8B5CF6; }
        .log-type.system { background: rgba(107,107,107,0.1); color: #6B6B6B; }
        .role-badge { display: inline-block; padding: 2px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; }
        .role-admin { background: rgba(233,30,140,0.1); color: #E91E8C; }
        .role-manager { background: rgba(59,130,246,0.1); color: #3B82F6; }
        .role-warehouse { background: rgba(34,197,94,0.1); color: #22C55E; }
        .user-form-panel { background: #fff; border: 1px solid #E0E0E0; border-radius: 12px; padding: 24px; margin-top: 16px; display: none; }
        .user-form-panel.open { display: block; }
        .user-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media(max-width:768px) { .user-form-grid { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(style);

    /* ====== NAV ITEMS ====== */
    const sidebarFooter = document.querySelector('.sidebar-footer');
    if (sidebarFooter) {
        sidebarFooter.insertAdjacentHTML('beforebegin', `
            <div class="nav-item" data-section="returns"><span class="icon">🔄</span>Grąžinimai</div>
            <div class="nav-item" data-section="invoices"><span class="icon">🧾</span>Sąskaitos</div>
            <div class="nav-item" data-section="shipping"><span class="icon">🚚</span>Pristatymas</div>
            <div class="nav-item" data-section="log"><span class="icon">📜</span>Žurnalas</div>
            <div class="nav-item" data-section="users"><span class="icon">👤</span>Vartotojai</div>
        `);
    }

    /* ====== SECTIONS HTML ====== */
    const lastSection = document.querySelectorAll('.section');
    if (lastSection.length) {
        lastSection[lastSection.length - 1].insertAdjacentHTML('afterend', `
            <!-- RETURNS -->
            <div class="section" id="sec-returns">
                <div class="stats-grid" id="returnsStats"></div>
                <div class="panel" style="padding:0;margin-top:16px;">
                    <div class="panel-header"><h3>Grąžinimai</h3></div>
                    <div style="overflow-x:auto;"><table class="data-table" id="returnsTable"><thead><tr>
                        <th>ID</th><th>Data</th><th>Užsakymas</th><th>Klientas</th><th>Produktai</th><th>Suma</th><th>Priežastis</th><th>Statusas</th><th>Veiksmai</th>
                    </tr></thead><tbody></tbody></table></div>
                </div>
            </div>

            <!-- INVOICES -->
            <div class="section" id="sec-invoices">
                <div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:16px;">
                    <button class="btn btn-secondary btn-sm" onclick="exportInvoicesCSV()">📥 Eksportuoti CSV</button>
                </div>
                <div class="panel" style="padding:0;">
                    <div class="panel-header"><h3>Sąskaitos-faktūros</h3></div>
                    <div style="overflow-x:auto;"><table class="data-table" id="invoicesTable"><thead><tr>
                        <th>Nr.</th><th>Data</th><th>Klientas</th><th>Suma</th><th>PVM (21%)</th><th>Viso</th><th>Statusas</th><th>Veiksmai</th>
                    </tr></thead><tbody></tbody></table></div>
                </div>
            </div>

            <!-- SHIPPING -->
            <div class="section" id="sec-shipping">
                <div class="stats-grid" id="shippingStats"></div>
                <div class="panel" style="padding:0;margin-top:16px;">
                    <div class="panel-header"><h3>Siuntos</h3></div>
                    <div style="overflow-x:auto;"><table class="data-table" id="shippingTable"><thead><tr>
                        <th>Užsakymas</th><th>Klientas</th><th>Būdas</th><th>Tracking Nr.</th><th>Statusas</th><th>Progresas</th><th>Atnaujinta</th>
                    </tr></thead><tbody></tbody></table></div>
                </div>
            </div>

            <!-- AUDIT LOG -->
            <div class="section" id="sec-log">
                <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;" id="logFilters"></div>
                <div class="panel" style="padding:0;">
                    <div class="panel-header"><h3>Veiksmų žurnalas</h3></div>
                    <div style="overflow-x:auto;"><table class="data-table" id="logTable"><thead><tr>
                        <th>Data ir laikas</th><th>Vartotojas</th><th>Tipas</th><th>Veiksmas</th><th>Detalės</th>
                    </tr></thead><tbody></tbody></table></div>
                </div>
            </div>

            <!-- USERS -->
            <div class="section" id="sec-users">
                <div style="display:flex;justify-content:flex-end;margin-bottom:16px;">
                    <button class="btn btn-primary btn-sm" onclick="toggleUserForm()">+ Pridėti vartotoją</button>
                </div>
                <div class="user-form-panel" id="userFormPanel">
                    <h3 style="margin-bottom:16px;">Naujas vartotojas</h3>
                    <div class="user-form-grid">
                        <div><label class="form-label">Vardas</label><input class="form-input" id="userFormName" placeholder="Vardas Pavardė"></div>
                        <div><label class="form-label">El. paštas</label><input class="form-input" id="userFormEmail" type="email" placeholder="el@pastas.lt"></div>
                        <div><label class="form-label">Rolė</label><select class="form-input" id="userFormRole"><option value="admin">Administratorius</option><option value="manager">Vadybininkas</option><option value="warehouse">Sandėlininkas</option></select></div>
                        <div><label class="form-label">Slaptažodis</label><input class="form-input" id="userFormPass" type="password" placeholder="Slaptažodis"></div>
                    </div>
                    <div style="display:flex;gap:8px;margin-top:16px;">
                        <button class="btn btn-primary btn-sm" onclick="saveUser()">Išsaugoti</button>
                        <button class="btn btn-secondary btn-sm" onclick="toggleUserForm()">Atšaukti</button>
                    </div>
                </div>
                <div class="panel" style="padding:0;">
                    <div class="panel-header"><h3>Vartotojai</h3></div>
                    <div style="overflow-x:auto;"><table class="data-table" id="usersTable"><thead><tr>
                        <th>Vardas</th><th>El. paštas</th><th>Rolė</th><th>Pask. prisijungimas</th><th>Statusas</th><th>Veiksmai</th>
                    </tr></thead><tbody></tbody></table></div>
                </div>
            </div>
        `);
    }

    /* ====== EXTEND SECTION TITLES ====== */
    if (window.sectionTitles) {
        Object.assign(window.sectionTitles, {
            returns: 'Grąžinimai',
            invoices: 'Sąskaitos',
            shipping: 'Pristatymo sekimas',
            log: 'Veiksmų žurnalas',
            users: 'Vartotojai'
        });
    }

    /* ====== HOOK SWITCHSECTION ====== */
    const origSwitch = window.switchSection;
    window.switchSection = function(section, navEl) {
        origSwitch(section, navEl);
        if (section === 'returns') renderReturns();
        if (section === 'invoices') renderInvoices();
        if (section === 'shipping') renderShipping();
        if (section === 'log') renderLog();
        if (section === 'users') renderUsers();
    };

    /* ====== NAV CLICK HANDLERS ====== */
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
        if (!item.getAttribute('onclick')) {
            item.addEventListener('click', function() {
                window.switchSection(this.dataset.section, this);
            });
        }
    });

    /* ====== GENERATE SAMPLE DATA ====== */
    initExtraData();
});

/* ============================================================
   DATA GENERATION
   ============================================================ */
function initExtraData() {
    const names = ['Agnė Petrauskienė','Rūta Kazlauskienė','Tomas Jonaitis','Viktorija Stankevičiūtė','Darius Balčiūnas','Jurgita Navickienė','Andrius Vasiliauskas','Laura Žukauskienė','Marius Grigas','Eglė Rimkutė','Gintaras Savickas','Kristina Mockuvienė','Donatas Urbšys','Simona Kairytė','Paulius Černiauskas'];
    const cities = ['Kaunas','Vilnius','Klaipėda','Šiauliai','Panevėžys'];

    // Returns
    if (!localStorage.getItem('dk_returns')) {
        const statuses = ['Pateiktas','Patvirtintas','Gautas','Grąžinti pinigai','Atmestas'];
        const reasons = ['Netinkama spalva','Pažeista pakuotė','Klaidingas užsakymas','Alergija','Netinkamas atspalvis','Produktas neatitinka aprašymo'];
        const returns = [];
        for (let i = 0; i < 6; i++) {
            const d = new Date(); d.setDate(d.getDate() - Math.floor(Math.random()*20));
            returns.push({
                id: 'RET-' + String(i+1).padStart(3,'0'),
                date: d.toISOString().slice(0,10),
                orderId: 'DK-' + String(Math.floor(Math.random()*25)+1).padStart(3,'0'),
                customer: names[Math.floor(Math.random()*names.length)],
                products: 'Color SHOCK ' + ['7.00','5.00','9.00','6.1','8.34','4.00'][i],
                amount: (Math.random()*30+8).toFixed(2),
                reason: reasons[i],
                status: statuses[Math.floor(Math.random()*statuses.length)]
            });
        }
        localStorage.setItem('dk_returns', JSON.stringify(returns));
    }

    // Invoices
    if (!localStorage.getItem('dk_invoices')) {
        const orders = JSON.parse(localStorage.getItem('dk_orders') || '[]');
        const invoices = orders.filter(o => o.status !== 'Atšauktas' && o.status !== 'Naujas').map((o, i) => {
            const subtotal = parseFloat(o.total || o.amount || (Math.random()*80+15).toFixed(2));
            const vat = (subtotal * 0.21).toFixed(2);
            return {
                number: 'DK-2026-' + String(i+1).padStart(3,'0'),
                date: o.date || new Date().toISOString().slice(0,10),
                customer: o.customer || names[i % names.length],
                subtotal: subtotal.toFixed(2),
                vat: vat,
                total: (subtotal + parseFloat(vat)).toFixed(2),
                status: Math.random() > 0.2 ? 'Apmokėta' : 'Neapmokėta',
                items: (o.items || [{name:'Color SHOCK 7.00',qty:2,price:7.99}])
            };
        });
        if (invoices.length === 0) {
            for (let i = 0; i < 10; i++) {
                const sub = (Math.random()*60+15).toFixed(2);
                const vat = (parseFloat(sub)*0.21).toFixed(2);
                const d = new Date(); d.setDate(d.getDate() - Math.floor(Math.random()*30));
                invoices.push({
                    number: 'DK-2026-' + String(i+1).padStart(3,'0'),
                    date: d.toISOString().slice(0,10),
                    customer: names[i % names.length],
                    subtotal: sub, vat: vat,
                    total: (parseFloat(sub)+parseFloat(vat)).toFixed(2),
                    status: Math.random() > 0.2 ? 'Apmokėta' : 'Neapmokėta',
                    items: [{name:'Color SHOCK '+['7.00','5.00','9.00','6.1','8.34'][i%5],qty:Math.floor(Math.random()*4)+1,price:7.99}]
                });
            }
        }
        localStorage.setItem('dk_invoices', JSON.stringify(invoices));
    }

    // Shipping
    if (!localStorage.getItem('dk_shipping')) {
        const methods = ['Kurjeris','Paštomatas','Atsiėmimas'];
        const sStatuses = ['Ruošiamas','Išsiųstas','Pakeliui','Pristatyta'];
        const shipments = [];
        for (let i = 0; i < 12; i++) {
            const d = new Date(); d.setDate(d.getDate() - Math.floor(Math.random()*14));
            shipments.push({
                orderId: 'DK-' + String(i+1).padStart(3,'0'),
                customer: names[i % names.length],
                method: methods[Math.floor(Math.random()*methods.length)],
                tracking: 'LP' + Math.floor(1000000000 + Math.random()*9000000000),
                status: sStatuses[Math.floor(Math.random()*sStatuses.length)],
                updated: d.toISOString().slice(0,10)
            });
        }
        localStorage.setItem('dk_shipping', JSON.stringify(shipments));
    }

    // Audit Log
    if (!localStorage.getItem('dk_audit_log')) {
        const types = ['orders','inventory','pricing','login','system'];
        const actions = [
            {t:'orders',a:'Atnaujintas užsakymo statusas',d:'DK-005: Naujas → Apmokėtas'},
            {t:'orders',a:'Naujas užsakymas gautas',d:'DK-025, €47.94'},
            {t:'orders',a:'Užsakymas atšauktas',d:'DK-018'},
            {t:'inventory',a:'Pakeistas produkto kiekis',d:'7.00 Natural Blonde: 45 → 40'},
            {t:'inventory',a:'Pakeistas produkto kiekis',d:'5.00 Light Brown: 30 → 25'},
            {t:'inventory',a:'Produktas pažymėtas kaip "Nėra"',d:'10.0 Black: 0 vnt.'},
            {t:'pricing',a:'Kaina atnaujinta',d:'Visi produktai: €7.99 → €8.49'},
            {t:'pricing',a:'Sukurtas nuolaidos kodas',d:'SALON20 — 20% nuolaida'},
            {t:'pricing',a:'Nuolaidos kodas deaktyvuotas',d:'WELCOME10'},
            {t:'login',a:'Prisijungimas',d:'admin@dazaikirpejams.lt iš 192.168.1.100'},
            {t:'login',a:'Prisijungimas',d:'ruta@dazaikirpejams.lt iš 10.0.0.55'},
            {t:'login',a:'Nesėkmingas prisijungimas',d:'unknown@test.lt'},
            {t:'system',a:'Atsarginė kopija sukurta',d:'backup_2026-04-07.zip'},
            {t:'system',a:'Svetainės kešas išvalytas',d:''},
            {t:'system',a:'Naujienlaiškis išsiųstas',d:'250 gavėjų'},
            {t:'orders',a:'Sąskaita-faktūra sugeneruota',d:'DK-2026-012'},
            {t:'inventory',a:'Masinis kiekio atnaujinimas',d:'15 produktų atnaujinta'},
            {t:'orders',a:'Grąžinimas patvirtintas',d:'RET-003, €23.97'},
            {t:'pricing',a:'B2B kaina nustatyta',d:'Salon Pro: -15%'},
            {t:'login',a:'Slaptažodis pakeistas',d:'admin@dazaikirpejams.lt'},
            {t:'orders',a:'Siunta išsiųsta',d:'DK-010, tracking LP3847562910'},
            {t:'system',a:'Sistemos atnaujinimas',d:'v2.1.0'},
            {t:'inventory',a:'Naujas produktas pridėtas',d:'RosaNera šampūnas 250ml'},
            {t:'orders',a:'Mokėjimas gautas',d:'DK-022, €31.96'},
            {t:'pricing',a:'Sezoninė nuolaida aktyvuota',d:'PAVASARIS15'},
            {t:'login',a:'Prisijungimas',d:'tomas@dazaikirpejams.lt'},
            {t:'system',a:'Duomenų eksportas',d:'Klientų sąrašas CSV'},
            {t:'inventory',a:'Kiekis papildytas',d:'9.00 Very Light Blonde: 0 → 50'},
            {t:'orders',a:'Užsakymo adresas pakeistas',d:'DK-019'},
            {t:'system',a:'Cron užduotis įvykdyta',d:'Automatinis atsargų patikrinimas'}
        ];
        const log = [];
        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(d.getDate() - Math.floor(Math.random()*7));
            d.setHours(Math.floor(Math.random()*12)+8, Math.floor(Math.random()*60));
            const entry = actions[i % actions.length];
            log.push({
                datetime: d.toISOString(),
                user: ['admin@dazaikirpejams.lt','ruta@dazaikirpejams.lt','tomas@dazaikirpejams.lt'][Math.floor(Math.random()*3)],
                type: entry.t,
                action: entry.a,
                details: entry.d
            });
        }
        log.sort((a,b) => new Date(b.datetime) - new Date(a.datetime));
        localStorage.setItem('dk_audit_log', JSON.stringify(log));
    }

    // Users
    if (!localStorage.getItem('dk_users')) {
        const email = sessionStorage.getItem('dk_admin_email') || 'admin@dazaikirpejams.lt';
        const users = [
            { id: 1, name: 'Administratorius', email: email, role: 'admin', lastLogin: new Date().toISOString(), active: true },
            { id: 2, name: 'Rūta Kazlauskienė', email: 'ruta@dazaikirpejams.lt', role: 'manager', lastLogin: new Date(Date.now()-86400000*2).toISOString(), active: true },
            { id: 3, name: 'Tomas Petrauskas', email: 'tomas@dazaikirpejams.lt', role: 'warehouse', lastLogin: new Date(Date.now()-86400000).toISOString(), active: true }
        ];
        localStorage.setItem('dk_users', JSON.stringify(users));
    }
}

/* ============================================================
   RENDER: RETURNS
   ============================================================ */
function renderReturns() {
    const returns = JSON.parse(localStorage.getItem('dk_returns') || '[]');
    const statusColors = {'Pateiktas':'#3B82F6','Patvirtintas':'#F59E0B','Gautas':'#8B5CF6','Grąžinti pinigai':'#22C55E','Atmestas':'#EF4444'};

    // Stats
    const stats = document.getElementById('returnsStats');
    if (stats) {
        const total = returns.length;
        const waiting = returns.filter(r => r.status === 'Pateiktas').length;
        const approved = returns.filter(r => r.status === 'Patvirtintas' || r.status === 'Gautas').length;
        const refunded = returns.filter(r => r.status === 'Grąžinti pinigai').length;
        stats.innerHTML = `
            <div class="stat-card"><div class="stat-value">${total}</div><div class="stat-label">Viso grąžinimų</div></div>
            <div class="stat-card"><div class="stat-value" style="color:#F59E0B">${waiting}</div><div class="stat-label">Laukia patvirtinimo</div></div>
            <div class="stat-card"><div class="stat-value" style="color:#8B5CF6">${approved}</div><div class="stat-label">Patvirtinti</div></div>
            <div class="stat-card"><div class="stat-value" style="color:#22C55E">${refunded}</div><div class="stat-label">Grąžinti pinigai</div></div>
        `;
    }

    // Table
    const tbody = document.querySelector('#returnsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = returns.map((r, i) => {
        const color = statusColors[r.status] || '#6B6B6B';
        return `<tr>
            <td><strong>${r.id}</strong></td>
            <td>${r.date}</td>
            <td>${r.orderId}</td>
            <td>${r.customer}</td>
            <td>${r.products}</td>
            <td>€${r.amount}</td>
            <td>${r.reason}</td>
            <td><span class="badge" style="background:${color}15;color:${color}">${r.status}</span></td>
            <td><select class="form-input" style="font-size:12px;padding:4px 8px;" onchange="updateReturnStatus(${i},this.value)">
                ${['Pateiktas','Patvirtintas','Gautas','Grąžinti pinigai','Atmestas'].map(s => `<option value="${s}" ${s===r.status?'selected':''}>${s}</option>`).join('')}
            </select></td>
        </tr>`;
    }).join('');
}

window.updateReturnStatus = function(idx, status) {
    const returns = JSON.parse(localStorage.getItem('dk_returns') || '[]');
    if (returns[idx]) { returns[idx].status = status; localStorage.setItem('dk_returns', JSON.stringify(returns)); renderReturns(); }
};
window.renderReturns = renderReturns;

/* ============================================================
   RENDER: INVOICES
   ============================================================ */
function renderInvoices() {
    const invoices = JSON.parse(localStorage.getItem('dk_invoices') || '[]');
    const tbody = document.querySelector('#invoicesTable tbody');
    if (!tbody) return;
    tbody.innerHTML = invoices.map((inv, i) => {
        const sc = inv.status === 'Apmokėta' ? '#22C55E' : '#F59E0B';
        return `<tr>
            <td><strong>${inv.number}</strong></td>
            <td>${inv.date}</td>
            <td>${inv.customer}</td>
            <td>€${inv.subtotal}</td>
            <td>€${inv.vat}</td>
            <td><strong>€${inv.total}</strong></td>
            <td><span class="badge" style="background:${sc}15;color:${sc}">${inv.status}</span></td>
            <td><button class="btn btn-secondary btn-sm" onclick="generateInvoicePDF(${i})" style="font-size:11px;padding:4px 10px;">🖨️ PDF</button></td>
        </tr>`;
    }).join('');
}

window.generateInvoicePDF = function(idx) {
    const invoices = JSON.parse(localStorage.getItem('dk_invoices') || '[]');
    const inv = invoices[idx]; if (!inv) return;
    const items = inv.items || [{name:'Color SHOCK',qty:1,price:7.99}];
    const w = window.open('','_blank');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Sąskaita ${inv.number}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body{font-family:'Inter',sans-serif;padding:40px;max-width:800px;margin:0 auto;color:#1A1A1A;font-size:14px;}
        .inv-header{display:flex;justify-content:space-between;margin-bottom:40px;padding-bottom:20px;border-bottom:2px solid #E91E8C;}
        .inv-company h1{color:#E91E8C;font-size:22px;margin-bottom:8px;}
        .inv-company p{color:#6B6B6B;line-height:1.6;}
        .inv-info h2{font-size:18px;text-align:right;margin-bottom:8px;}
        .inv-info p{text-align:right;color:#6B6B6B;line-height:1.6;}
        .inv-customer{margin:30px 0;padding:16px;background:#F5F5F7;border-radius:8px;}
        table{width:100%;border-collapse:collapse;margin:24px 0;}
        th{background:#F5F5F7;padding:10px 12px;text-align:left;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;}
        td{padding:10px 12px;border-bottom:1px solid #eee;}
        .inv-totals{text-align:right;margin-top:20px;}
        .inv-totals p{margin:4px 0;font-size:14px;}
        .inv-totals .total{font-size:20px;font-weight:700;color:#E91E8C;margin-top:8px;}
        .inv-footer{margin-top:40px;padding-top:20px;border-top:1px solid #eee;color:#6B6B6B;font-size:12px;}
        @media print{body{padding:20px;}}
    </style></head><body>
    <div class="inv-header">
        <div class="inv-company"><h1>Dažai Kirpėjams</h1><p>UAB "Dažai Kirpėjams"<br>Kaunas, Lietuva<br>info@dazaikirpejams.lt<br>+370 600 00000<br>Įm. kodas: 000000000<br>PVM kodas: LT000000000</p></div>
        <div class="inv-info"><h2>SĄSKAITA-FAKTŪRA</h2><p>Nr: ${inv.number}<br>Data: ${inv.date}<br>Apmokėti iki: ${inv.date}</p></div>
    </div>
    <div class="inv-customer"><strong>Pirkėjas:</strong><br>${inv.customer}</div>
    <table><thead><tr><th>Produktas</th><th>Kiekis</th><th>Kaina</th><th>Suma</th></tr></thead>
    <tbody>${items.map(it => `<tr><td>${it.name}</td><td>${it.qty}</td><td>€${Number(it.price).toFixed(2)}</td><td>€${(it.qty*it.price).toFixed(2)}</td></tr>`).join('')}</tbody></table>
    <div class="inv-totals">
        <p>Suma be PVM: <strong>€${inv.subtotal}</strong></p>
        <p>PVM (21%): <strong>€${inv.vat}</strong></p>
        <p class="total">Viso: €${inv.total}</p>
    </div>
    <div class="inv-footer"><p>Mokėjimas: banko pavedimas<br>AB "Swedbank" | LT12 3456 7890 1234 5678<br><br>Ačiū, kad perkate Dažai Kirpėjams!</p></div>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
};

window.exportInvoicesCSV = function() {
    const invoices = JSON.parse(localStorage.getItem('dk_invoices') || '[]');
    let csv = 'Nr.,Data,Klientas,Suma,PVM,Viso,Statusas\n';
    invoices.forEach(inv => { csv += `${inv.number},${inv.date},"${inv.customer}",${inv.subtotal},${inv.vat},${inv.total},${inv.status}\n`; });
    const blob = new Blob(['\uFEFF' + csv], {type:'text/csv;charset=utf-8;'});
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'saskaitos.csv'; link.click();
};

window.renderInvoices = renderInvoices;

/* ============================================================
   RENDER: SHIPPING
   ============================================================ */
const SHIP_STEPS = ['Ruošiamas','Išsiųstas','Pakeliui','Pristatyta'];

function renderShipping() {
    const shipments = JSON.parse(localStorage.getItem('dk_shipping') || '[]');
    const stats = document.getElementById('shippingStats');
    if (stats) {
        const waiting = shipments.filter(s => s.status === 'Ruošiamas').length;
        const sent = shipments.filter(s => s.status === 'Išsiųstas').length;
        const transit = shipments.filter(s => s.status === 'Pakeliui').length;
        const delivered = shipments.filter(s => s.status === 'Pristatyta').length;
        stats.innerHTML = `
            <div class="stat-card"><div class="stat-value" style="color:#F59E0B">${waiting}</div><div class="stat-label">Laukia išsiuntimo</div></div>
            <div class="stat-card"><div class="stat-value" style="color:#3B82F6">${sent}</div><div class="stat-label">Išsiųsta</div></div>
            <div class="stat-card"><div class="stat-value" style="color:#8B5CF6">${transit}</div><div class="stat-label">Pakeliui</div></div>
            <div class="stat-card"><div class="stat-value" style="color:#22C55E">${delivered}</div><div class="stat-label">Pristatyta</div></div>
        `;
    }

    const tbody = document.querySelector('#shippingTable tbody');
    if (!tbody) return;
    tbody.innerHTML = shipments.map((s, i) => {
        const stepIdx = SHIP_STEPS.indexOf(s.status);
        const progress = SHIP_STEPS.map((st, j) => {
            const dot = j < stepIdx ? 'filled' : (j === stepIdx ? 'current' : '');
            const line = j < SHIP_STEPS.length - 1 ? `<div class="progress-line ${j < stepIdx ? 'filled' : ''}"></div>` : '';
            return `<div class="progress-dot ${dot}" title="${st}"></div>${line}`;
        }).join('');
        return `<tr>
            <td><strong>${s.orderId}</strong></td>
            <td>${s.customer}</td>
            <td>${s.method}</td>
            <td><input class="tracking-input" value="${s.tracking}" onchange="updateTracking(${i},this.value)"></td>
            <td><select class="form-input" style="font-size:12px;padding:4px 8px;" onchange="updateShipStatus(${i},this.value)">
                ${SHIP_STEPS.map(st => `<option ${st===s.status?'selected':''}>${st}</option>`).join('')}
            </select></td>
            <td><div class="progress-track">${progress}</div></td>
            <td>${s.updated}</td>
        </tr>`;
    }).join('');
}

window.updateTracking = function(idx, val) {
    const sh = JSON.parse(localStorage.getItem('dk_shipping') || '[]');
    if (sh[idx]) { sh[idx].tracking = val; localStorage.setItem('dk_shipping', JSON.stringify(sh)); }
};
window.updateShipStatus = function(idx, status) {
    const sh = JSON.parse(localStorage.getItem('dk_shipping') || '[]');
    if (sh[idx]) { sh[idx].status = status; sh[idx].updated = new Date().toISOString().slice(0,10); localStorage.setItem('dk_shipping', JSON.stringify(sh)); renderShipping(); }
};
window.renderShipping = renderShipping;

/* ============================================================
   RENDER: AUDIT LOG
   ============================================================ */
let logFilterType = 'all';

function renderLog() {
    const log = JSON.parse(localStorage.getItem('dk_audit_log') || '[]');
    const types = ['all','orders','inventory','pricing','login','system'];
    const typeLabels = {all:'Visi',orders:'Užsakymai',inventory:'Sandėlis',pricing:'Kainos',login:'Prisijungimas',system:'Sistema'};

    const filtersEl = document.getElementById('logFilters');
    if (filtersEl) {
        filtersEl.innerHTML = types.map(t =>
            `<button class="btn ${logFilterType===t?'btn-primary':'btn-secondary'} btn-sm" onclick="filterLog('${t}')">${typeLabels[t]}</button>`
        ).join('');
    }

    const filtered = logFilterType === 'all' ? log : log.filter(l => l.type === logFilterType);
    const tbody = document.querySelector('#logTable tbody');
    if (!tbody) return;
    tbody.innerHTML = filtered.map(l => {
        const dt = new Date(l.datetime);
        const dateStr = dt.toISOString().slice(0,10) + ' ' + dt.toTimeString().slice(0,5);
        return `<tr>
            <td style="white-space:nowrap">${dateStr}</td>
            <td>${l.user}</td>
            <td><span class="log-type ${l.type}">${typeLabels[l.type] || l.type}</span></td>
            <td>${l.action}</td>
            <td style="color:#6B6B6B;font-size:12px;">${l.details}</td>
        </tr>`;
    }).join('');
}

window.filterLog = function(type) { logFilterType = type; renderLog(); };
window.renderLog = renderLog;

window.addLogEntry = function(user, type, action, details) {
    const log = JSON.parse(localStorage.getItem('dk_audit_log') || '[]');
    log.unshift({ datetime: new Date().toISOString(), user: user || 'admin@dazaikirpejams.lt', type: type, action: action, details: details || '' });
    if (log.length > 200) log.length = 200;
    localStorage.setItem('dk_audit_log', JSON.stringify(log));
};

/* ============================================================
   RENDER: USERS
   ============================================================ */
function renderUsers() {
    const users = JSON.parse(localStorage.getItem('dk_users') || '[]');
    const roleLabels = {admin:'Administratorius',manager:'Vadybininkas',warehouse:'Sandėlininkas'};
    const roleClasses = {admin:'role-admin',manager:'role-manager',warehouse:'role-warehouse'};

    const tbody = document.querySelector('#usersTable tbody');
    if (!tbody) return;
    tbody.innerHTML = users.map((u, i) => {
        const lastLogin = u.lastLogin ? new Date(u.lastLogin).toISOString().slice(0,10) : '—';
        const statusColor = u.active ? '#22C55E' : '#6B6B6B';
        const statusText = u.active ? 'Aktyvus' : 'Neaktyvus';
        return `<tr>
            <td><strong>${u.name}</strong></td>
            <td>${u.email}</td>
            <td><span class="role-badge ${roleClasses[u.role] || ''}">${roleLabels[u.role] || u.role}</span></td>
            <td>${lastLogin}</td>
            <td><span class="badge" style="background:${statusColor}15;color:${statusColor}">${statusText}</span></td>
            <td style="display:flex;gap:6px;">
                <button class="btn btn-secondary btn-sm" style="font-size:11px;padding:3px 8px;" onclick="toggleUserActive(${i})">${u.active?'Deaktyvuoti':'Aktyvuoti'}</button>
                ${i > 0 ? `<button class="btn btn-secondary btn-sm" style="font-size:11px;padding:3px 8px;color:#EF4444;" onclick="deleteUser(${i})">🗑️</button>` : ''}
            </td>
        </tr>`;
    }).join('');
}

window.toggleUserForm = function() {
    const panel = document.getElementById('userFormPanel');
    if (panel) panel.classList.toggle('open');
};

window.saveUser = function() {
    const name = document.getElementById('userFormName').value.trim();
    const email = document.getElementById('userFormEmail').value.trim();
    const role = document.getElementById('userFormRole').value;
    if (!name || !email) { alert('Užpildykite vardą ir el. paštą'); return; }
    const users = JSON.parse(localStorage.getItem('dk_users') || '[]');
    users.push({ id: Date.now(), name, email, role, lastLogin: null, active: true });
    localStorage.setItem('dk_users', JSON.stringify(users));
    document.getElementById('userFormName').value = '';
    document.getElementById('userFormEmail').value = '';
    document.getElementById('userFormPass').value = '';
    toggleUserForm();
    renderUsers();
    if (window.addLogEntry) addLogEntry(null, 'system', 'Naujas vartotojas pridėtas', name + ' (' + email + ')');
};

window.toggleUserActive = function(idx) {
    const users = JSON.parse(localStorage.getItem('dk_users') || '[]');
    if (users[idx]) { users[idx].active = !users[idx].active; localStorage.setItem('dk_users', JSON.stringify(users)); renderUsers(); }
};

window.deleteUser = function(idx) {
    if (!confirm('Ar tikrai norite pašalinti šį vartotoją?')) return;
    const users = JSON.parse(localStorage.getItem('dk_users') || '[]');
    users.splice(idx, 1);
    localStorage.setItem('dk_users', JSON.stringify(users));
    renderUsers();
};

window.renderUsers = renderUsers;

})();
