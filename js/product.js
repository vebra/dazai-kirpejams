/* ============================================
   PRODUKTO PUSLAPIS — JS
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // Tabs
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;

      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById('tab-' + tabId).classList.add('active');
    });
  });

  // Quantity selector
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus = document.getElementById('qtyPlus');
  const qtyInput = document.getElementById('qtyInput');

  if (qtyMinus && qtyPlus && qtyInput) {
    qtyMinus.addEventListener('click', () => {
      const val = parseInt(qtyInput.value);
      if (val > 1) qtyInput.value = val - 1;
    });

    qtyPlus.addEventListener('click', () => {
      const val = parseInt(qtyInput.value);
      if (val < 99) qtyInput.value = val + 1;
    });
  }

  // Shade selector
  document.querySelectorAll('.shade-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.shade-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Add to cart button
  const addCartBtn = document.querySelector('.product-add-cart');
  if (addCartBtn) {
    addCartBtn.addEventListener('click', () => {
      // Get shade ID from URL
      const params = new URLSearchParams(window.location.search);
      const shadeId = params.get('shade');
      const qty = parseInt(document.getElementById('qtyInput')?.value) || 1;

      if (shadeId && typeof Cart !== 'undefined') {
        Cart.addItem(shadeId, qty);
      }

      const original = addCartBtn.innerHTML;
      addCartBtn.innerHTML = '&#10003; Pridėta į krepšelį!';
      addCartBtn.style.background = '#1A1A1A';
      setTimeout(() => {
        addCartBtn.innerHTML = original;
        addCartBtn.style.background = '';
      }, 2000);
    });
  }

  // Wishlist toggle
  const wishlistBtn = document.querySelector('.product-wishlist');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', () => {
      wishlistBtn.classList.toggle('wishlisted');
      if (wishlistBtn.classList.contains('wishlisted')) {
        wishlistBtn.innerHTML = '&#9829;';
        wishlistBtn.style.background = 'var(--magenta)';
        wishlistBtn.style.color = 'var(--white)';
        wishlistBtn.style.borderColor = 'var(--magenta)';
      } else {
        wishlistBtn.innerHTML = '&#9825;';
        wishlistBtn.style.background = '';
        wishlistBtn.style.color = '';
        wishlistBtn.style.borderColor = '';
      }
    });
  }

  // Image gallery
  window.changeImage = function(thumb) {
    const src = thumb.dataset.src;
    const mainImg = document.getElementById('mainImage');
    if (mainImg && src) {
      mainImg.src = src;
      document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    }
  };

  // Zoom — click to zoom in place, move mouse to pan
  const galleryMain = document.querySelector('.gallery-main');
  const mainImg = document.getElementById('mainImage');

  if (galleryMain && mainImg) {
    let zoomed = false;

    galleryMain.addEventListener('click', (e) => {
      if (e.target.closest('.gallery-badge')) return;
      zoomed = !zoomed;
      galleryMain.classList.toggle('zoomed', zoomed);

      if (zoomed) {
        const rect = galleryMain.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        mainImg.style.transformOrigin = x + '% ' + y + '%';
      }
    });

    galleryMain.addEventListener('mousemove', (e) => {
      if (!zoomed) return;
      const rect = galleryMain.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      mainImg.style.transformOrigin = x + '% ' + y + '%';
    });

    galleryMain.addEventListener('mouseleave', () => {
      zoomed = false;
      galleryMain.classList.remove('zoomed');
    });
  }

  // ============================================
  // RECENTLY VIEWED PRODUCTS
  // ============================================
  (function initRecentlyViewed() {
    const params = new URLSearchParams(window.location.search);
    const currentShade = params.get('shade');

    // Save current product to recently viewed
    if (currentShade && typeof PRODUCTS !== 'undefined' && PRODUCTS[currentShade]) {
      let recentlyViewed = [];
      try {
        recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed')) || [];
      } catch (e) {
        recentlyViewed = [];
      }

      // Remove current shade if already in array (to move it to front)
      recentlyViewed = recentlyViewed.filter(id => id !== currentShade);

      // Add current shade to beginning
      recentlyViewed.unshift(currentShade);

      // Keep max 8 items
      recentlyViewed = recentlyViewed.slice(0, 8);

      // Save back to localStorage
      localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
    }

    // Render recently viewed section
    let stored = [];
    try {
      stored = JSON.parse(localStorage.getItem('recentlyViewed')) || [];
    } catch (e) {
      stored = [];
    }

    // Filter out current product and invalid entries
    const toShow = stored
      .filter(id => id !== currentShade && typeof PRODUCTS !== 'undefined' && PRODUCTS[id])
      .slice(0, 4);

    if (toShow.length === 0) return;

    const section = document.getElementById('recentlyViewed');
    const grid = document.getElementById('recentlyViewedGrid');
    if (!section || !grid) return;

    section.style.display = '';

    grid.innerHTML = toShow.map(id => {
      const p = PRODUCTS[id];
      return `
        <a href="product.html?shade=${encodeURIComponent(id)}" class="recent-card">
          <div class="recent-card-color" style="background: ${p.color};"></div>
          <div class="recent-card-shade">${p.name}</div>
          <div class="recent-card-name">${p.shade}</div>
          <div class="recent-card-price">&euro;${p.price.toFixed(2)}</div>
        </a>
      `;
    }).join('');
  })();
});
