/* ============================================
   KREPŠELIO MODULIS — Cart.js
   localStorage pagrindu veikiantis krepšelis
   ============================================ */

const Cart = (function() {
  const STORAGE_KEY = 'dazaikirpejams_cart';
  const FREE_SHIPPING_THRESHOLD = 50;

  function _getCart() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function _saveCart(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      // localStorage not available
    }
    _dispatch();
  }

  function _dispatch() {
    window.dispatchEvent(new CustomEvent('cart-updated'));
  }

  function getItems() {
    return _getCart();
  }

  function addItem(shadeId, qty) {
    if (!shadeId || !qty || qty < 1) return;
    const product = (typeof PRODUCTS !== 'undefined') ? PRODUCTS[shadeId] : null;
    if (!product) return;

    const items = _getCart();
    const existing = items.find(item => item.shadeId === shadeId);

    if (existing) {
      existing.quantity += qty;
    } else {
      items.push({
        shadeId: shadeId,
        name: product.name,
        shade: product.shade,
        hex: product.color,
        price: product.price,
        quantity: qty
      });
    }

    _saveCart(items);
    updateBadge();
  }

  function removeItem(shadeId) {
    const items = _getCart().filter(item => item.shadeId !== shadeId);
    _saveCart(items);
    updateBadge();
  }

  function updateQuantity(shadeId, qty) {
    if (qty <= 0) {
      removeItem(shadeId);
      return;
    }
    const items = _getCart();
    const item = items.find(i => i.shadeId === shadeId);
    if (item) {
      item.quantity = qty;
      _saveCart(items);
      updateBadge();
    }
  }

  function getTotal() {
    return _getCart().reduce(function(sum, item) {
      return sum + (item.price * item.quantity);
    }, 0);
  }

  function getCount() {
    return _getCart().reduce(function(sum, item) {
      return sum + item.quantity;
    }, 0);
  }

  function clear() {
    _saveCart([]);
    updateBadge();
  }

  function updateBadge() {
    var count = getCount();
    var badges = document.querySelectorAll('.nav-cart-count');
    badges.forEach(function(badge) {
      badge.textContent = count;
      if (count > 0) {
        badge.style.display = '';
      } else {
        badge.style.display = 'none';
      }
    });
  }

  function getFreeShippingThreshold() {
    return FREE_SHIPPING_THRESHOLD;
  }

  // Auto-update badge on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateBadge);
  } else {
    updateBadge();
  }

  return {
    getItems: getItems,
    addItem: addItem,
    removeItem: removeItem,
    updateQuantity: updateQuantity,
    getTotal: getTotal,
    getCount: getCount,
    clear: clear,
    updateBadge: updateBadge,
    getFreeShippingThreshold: getFreeShippingThreshold
  };
})();
