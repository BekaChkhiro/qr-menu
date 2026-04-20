
(function() {
  'use strict';

  // State
  let inspectorEnabled = false;
  let hoveredElement = null;
  let selectedElement = null;

  // Highlight overlay elements
  let hoverOverlay = null;
  let selectOverlay = null;

  // Ignore these elements from inspection
  const IGNORED_TAGS = ['HTML', 'BODY', 'HEAD', 'SCRIPT', 'STYLE', 'META', 'LINK', 'NOSCRIPT'];
  const INSPECTOR_CLASS = 'specta-inspector-overlay';

  /**
   * Create overlay element for highlighting
   */
  function createOverlay(type) {
    const overlay = document.createElement('div');
    overlay.className = INSPECTOR_CLASS;
    overlay.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 999999;
      border: 2px solid ${type === 'hover' ? '#3b82f6' : '#22c55e'};
      background: ${type === 'hover' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)'};
      transition: all 0.1s ease-out;
      display: none;
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  /**
   * Initialize overlay elements
   */
  function initOverlays() {
    if (!hoverOverlay) {
      hoverOverlay = createOverlay('hover');
    }
    if (!selectOverlay) {
      selectOverlay = createOverlay('select');
    }
  }

  /**
   * Remove overlay elements
   */
  function removeOverlays() {
    if (hoverOverlay) {
      hoverOverlay.remove();
      hoverOverlay = null;
    }
    if (selectOverlay) {
      selectOverlay.remove();
      selectOverlay = null;
    }
  }

  /**
   * Position overlay over element
   */
  function positionOverlay(overlay, element) {
    if (!overlay || !element) return;

    const rect = element.getBoundingClientRect();
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
    overlay.style.display = 'block';
  }

  /**
   * Hide overlay
   */
  function hideOverlay(overlay) {
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  /**
   * Check if element should be inspectable
   */
  function isInspectable(element) {
    if (!element || element.nodeType !== 1) return false;
    if (IGNORED_TAGS.includes(element.tagName)) return false;
    if (element.classList && element.classList.contains(INSPECTOR_CLASS)) return false;
    return true;
  }

  /**
   * Get unique CSS selector for element
   */
  function getUniqueSelector(element) {
    if (!element || element.nodeType !== 1) return '';

    // If element has ID, use it
    if (element.id) {
      return '#' + element.id;
    }

    // Build a path from root
    const path = [];
    let current = element;

    while (current && current.nodeType === 1 && current.tagName !== 'HTML') {
      let selector = current.tagName.toLowerCase();

      // Add ID if present
      if (current.id) {
        selector = '#' + current.id;
        path.unshift(selector);
        break; // ID is unique, stop here
      }

      // Add meaningful classes (not utility classes)
      if (current.className && typeof current.className === 'string') {
        const meaningfulClasses = current.className.split(' ')
          .filter(c => c.trim() && !c.match(/^(p-|m-|w-|h-|flex|grid|text-|bg-|border|rounded|shadow|hover:|focus:)/))
          .slice(0, 2);
        if (meaningfulClasses.length > 0) {
          selector += '.' + meaningfulClasses.join('.');
        }
      }

      // Add nth-child if needed for uniqueness
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(c => c.tagName === current.tagName);
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += ':nth-child(' + index + ')';
        }
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  }

  /**
   * Get all attributes of an element
   */
  function getElementAttributes(element) {
    const attrs = {};
    for (const attr of element.attributes) {
      if (!attr.name.startsWith('data-specta')) {
        attrs[attr.name] = attr.value;
      }
    }
    return attrs;
  }

  /**
   * Get parent context (up to 3 levels)
   */
  function getParentContext(element) {
    const parents = [];
    let current = element.parentElement;
    let depth = 0;

    while (current && depth < 3 && current.tagName !== 'BODY') {
      const info = {
        tagName: current.tagName.toLowerCase(),
        id: current.id || null,
        className: current.className || null,
      };
      parents.push(info);
      current = current.parentElement;
      depth++;
    }

    return parents;
  }

  /**
   * Get element info for messaging
   */
  function getElementInfo(element) {
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);

    // Try to get source file info from data attribute
    const sourceFile = element.getAttribute('data-specta-source') ||
                       findSourceAttribute(element) ||
                       null;
    const sourceLine = element.getAttribute('data-specta-line')
      ? parseInt(element.getAttribute('data-specta-line'), 10)
      : null;

    // Get meaningful text content (first 100 chars)
    let textContent = '';
    if (element.childNodes.length > 0) {
      for (const child of element.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          textContent += child.textContent.trim() + ' ';
        }
      }
    }
    textContent = textContent.trim().substring(0, 100);

    // Get unique selector path
    const uniqueSelector = getUniqueSelector(element);

    // Get all attributes
    const attributes = getElementAttributes(element);

    // Get parent context
    const parentContext = getParentContext(element);

    return {
      tagName: element.tagName.toLowerCase(),
      className: element.className || '',
      id: element.id || '',
      textContent: textContent,
      sourceFile: sourceFile,
      sourceLine: sourceLine,
      // NEW: More context for precise identification
      uniqueSelector: uniqueSelector,
      attributes: attributes,
      parentContext: parentContext,
      href: element.href || element.getAttribute('href') || null,
      innerHtml: element.innerHTML.substring(0, 200),
      outerHtml: element.outerHTML.substring(0, 300),
      boundingRect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
      computedStyles: {
        backgroundColor: computedStyle.backgroundColor,
        color: computedStyle.color,
        fontSize: computedStyle.fontSize,
        padding: computedStyle.padding,
        margin: computedStyle.margin,
        display: computedStyle.display,
        position: computedStyle.position,
      },
    };
  }

  /**
   * Try to find source attribute from parent elements
   */
  function findSourceAttribute(element) {
    let current = element;
    let depth = 0;
    const maxDepth = 5;

    while (current && depth < maxDepth) {
      const source = current.getAttribute('data-specta-source');
      if (source) return source;
      current = current.parentElement;
      depth++;
    }

    return null;
  }

  /**
   * Send message to parent window
   */
  function sendMessage(type, data) {
    const message = { type, ...data };
    window.parent.postMessage(message, '*');
  }

  /**
   * Send element info message
   */
  function sendElementMessage(type, element) {
    sendMessage(type, { element: element ? getElementInfo(element) : null });
  }

  /**
   * Handle mouse move
   */
  function handleMouseMove(e) {
    if (!inspectorEnabled) return;

    const target = e.target;
    if (!isInspectable(target)) {
      if (hoveredElement) {
        hideOverlay(hoverOverlay);
        hoveredElement = null;
        sendElementMessage('specta-inspector-hover', null);
      }
      return;
    }

    if (target !== hoveredElement && target !== selectedElement) {
      hoveredElement = target;
      positionOverlay(hoverOverlay, target);
      sendElementMessage('specta-inspector-hover', target);
    }
  }

  /**
   * Handle click
   */
  function handleClick(e) {
    if (!inspectorEnabled) return;

    const target = e.target;
    if (!isInspectable(target)) return;

    e.preventDefault();
    e.stopPropagation();

    // Clear previous selection
    if (selectedElement) {
      hideOverlay(selectOverlay);
    }

    // Set new selection
    selectedElement = target;
    positionOverlay(selectOverlay, target);
    hideOverlay(hoverOverlay);
    hoveredElement = null;

    sendElementMessage('specta-inspector-select', target);
  }

  /**
   * Handle keydown (Escape to clear selection)
   */
  function handleKeyDown(e) {
    if (!inspectorEnabled) return;

    if (e.key === 'Escape') {
      clearSelection();
      sendElementMessage('specta-inspector-clear', null);
    }
  }

  /**
   * Clear selection
   */
  function clearSelection() {
    selectedElement = null;
    hoveredElement = null;
    hideOverlay(selectOverlay);
    hideOverlay(hoverOverlay);
  }

  /**
   * Enable inspector mode
   */
  function enableInspector() {
    if (inspectorEnabled) return;

    inspectorEnabled = true;
    initOverlays();

    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);

    // Add cursor style
    document.body.style.cursor = 'crosshair';

    console.log('[Specta Inspector] Enabled');
  }

  /**
   * Disable inspector mode
   */
  function disableInspector() {
    if (!inspectorEnabled) return;

    inspectorEnabled = false;
    clearSelection();
    removeOverlays();

    document.removeEventListener('mousemove', handleMouseMove, true);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('keydown', handleKeyDown, true);

    // Reset cursor
    document.body.style.cursor = '';

    console.log('[Specta Inspector] Disabled');
  }

  /**
   * Handle messages from parent window
   */
  function handleMessage(e) {
    const { type } = e.data || {};

    switch (type) {
      case 'specta-inspector-enable':
        enableInspector();
        break;
      case 'specta-inspector-disable':
        disableInspector();
        break;
      case 'specta-inspector-clear':
        clearSelection();
        break;
    }
  }

  // Listen for messages from parent
  window.addEventListener('message', handleMessage);

  // Notify parent that inspector script is ready
  window.parent.postMessage({ type: 'specta-inspector-ready' }, '*');

  console.log('[Specta Inspector] Script loaded');
})();
