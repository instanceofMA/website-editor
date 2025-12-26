export const EDITOR_SCRIPT = `
(function() {
  console.log("Website Editor: Injected script active");

  // Styles for the focused element
  const style = document.createElement('style');
  style.textContent = \`
    [data-editor-highlight] {
      outline: 2px solid #0099ff !important;
      cursor: default !important;
    }
    [data-editor-selected] {
      outline: 2px solid #0099ff !important;
      background: rgba(0, 153, 255, 0.1) !important;
    }
  \`;
  document.head.appendChild(style);

  let selectedElement = null;
  let isPreview = false;

  document.addEventListener('mouseover', (e) => {
    if (isPreview) return;
    e.stopPropagation();
    if(selectedElement && e.target === selectedElement) return;
    // e.target.setAttribute('data-editor-highlight', 'true');
  }, true);

  document.addEventListener('mouseout', (e) => {
    if (isPreview) return;
    e.stopPropagation();
    // e.target.removeAttribute('data-editor-highlight');
  }, true);

  document.addEventListener('click', (e) => {
    if (isPreview) {
        // In preview mode, allow default behavior (link navigation etc)
        // But we are in an iframe, so links might navigate the iframe.
        return; 
    }

    e.preventDefault();
    e.stopPropagation();
    
    // Remove previous selection
    if (selectedElement) {
      selectedElement.removeAttribute('data-editor-selected');
    }

    selectedElement = e.target;
    selectedElement.setAttribute('data-editor-selected', 'true');

    // Send info to parent
    window.parent.postMessage({
      type: 'ELEMENT_SELECTED',
      tagName: selectedElement.tagName,
      textContent: selectedElement.innerText,
      id: selectedElement.id,
      className: selectedElement.className,
      href: selectedElement.getAttribute('href') || undefined
    }, '*');
  }, true);

  // Listen for messages from parent
  window.addEventListener('message', (event) => {
    if (!event.data) return;

    if (event.data.type === 'TOGGLE_PREVIEW') {
        isPreview = event.data.value;
        // Clear selection when entering preview
        if (isPreview && selectedElement) {
             selectedElement.removeAttribute('data-editor-selected');
             selectedElement = null;
        }
    }

    if (event.data.type === 'UPDATE_TEXT') {
       if (selectedElement) {
         selectedElement.innerText = event.data.value;
       }
    }

    if (event.data.type === 'UPDATE_ATTRIBUTE') {
       if (selectedElement) {
         selectedElement.setAttribute(event.data.attribute, event.data.value);
       }
    }
  });

  // Forward ALL Wheel events to parent for Canvas Panning/Zooming
  // Since the iframe is full-height, it has no internal scroll. All scroll gestures should pan the canvas.
  window.addEventListener('wheel', (e) => {
       if (isPreview) return; // Allow native scroll in preview
       
       // CRITICAL: Prevent browser native zoom (Ctrl+Wheel) and swipe navigation
       e.preventDefault();
       e.stopPropagation();
       e.stopImmediatePropagation();

       window.parent.postMessage({
           type: 'IFRAME_WHEEL',
           deltaX: e.deltaX,
           deltaY: e.deltaY,
           ctrlKey: e.ctrlKey,
           metaKey: e.metaKey
       }, '*');
  }, { passive: false });

  // Broadcast content height for "Full Height" canvas
  const sendHeight = () => {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({
          type: 'CONTENT_RESIZE',
          height: height
      }, '*');
  };

  // Prevent keyboard zoom shortcuts
  window.addEventListener('keydown', (e) => {
      if (isPreview) return; // Allow shortcuts in preview
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '-' || e.key === '0')) {
          e.preventDefault();
          e.stopPropagation();
      }
  }, true);

  // Prevent native browser zoom (pinch) inside iframe
  const preventDefault = (e) => {
      if (isPreview) return; // Allow gestures in preview
      e.preventDefault();
      e.stopPropagation();
  };
  document.addEventListener("gesturestart", preventDefault);
  document.addEventListener("gesturechange", preventDefault);
  document.addEventListener("gestureend", preventDefault);

  window.addEventListener('load', sendHeight);
  window.addEventListener('resize', sendHeight);
  const observer = new ResizeObserver(sendHeight);
  
  // Ensure body exists before observing (critical for static sites where script is in head)
  const observeBody = () => { 
      if (document.body) {
          observer.observe(document.body); 
          sendHeight();
      }
  };

  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', observeBody);
  } else {
      observeBody();
  }

})();
`;
