export const EDITOR_SCRIPT = `
(function() {
    console.log("Website Editor: Injected script active (v2)");

    if (window.__editorRuntimeActive) return;
    window.__editorRuntimeActive = true;

    class EditorRuntime {
        constructor() {
            this.selectedElement = null;
            this.styleBlockId = "editor-generated-styles";
            
            // Check if running in iframe or standalone
            this.isStandalone = window.self === window.top;
            
            // Seed from URL if present
            if (window.location.search.includes('preview=true')) {
                sessionStorage.setItem('editor_preview_mode', 'true');
            } else if (window.location.search.includes('preview=false')) {
                sessionStorage.setItem('editor_preview_mode', 'false');
            }

            this.isPreview = this.isStandalone || sessionStorage.getItem('editor_preview_mode') === 'true';

            // Apply mode synchronously — beforeInteractive runs before React hydrates.
            // suppressHydrationWarning on <html> handles the server/client class mismatch.
            this.updateMode(this.isPreview);

            if (this.isStandalone) {
                console.log("Website Editor: Running in standalone mode");
            }

            this.initStyles();
            this.bindEvents();
            this.bindMessageListener();
            this.broadcastHeight();
            if (!this.isPreview) {
                this.scanClasses(); // Initial scan only if in editor
            }
        }

        initStyles() {
            // Highlighting styles - scoped to html.editor-mode
            const style = document.createElement('style');
            style.textContent = \`
                html.editor-mode [data-editor-highlight] {
                    outline: 2px solid rgba(0, 153, 255, 0.4) !important;
                    box-shadow: inset 0 0 0 1000px rgba(0, 153, 255, 0.05) !important;
                    cursor: default !important;
                    transition: all 0.1s ease-out;
                }
                html.editor-mode [data-editor-selected] {
                    outline: 2px solid #0099ff !important;
                    box-shadow: inset 0 0 0 1000px rgba(0, 153, 255, 0.15) !important;
                    transition: all 0.2s ease-out;
                    z-index: 10;
                }
            \`;
            document.head.appendChild(style);
        }

        bindEvents() {
            // Hover effects
            document.addEventListener('mouseover', (e) => {
                if (this.isPreview) return;
                e.preventDefault();
                e.stopPropagation();
                if (e.target instanceof HTMLElement) {
                    e.target.setAttribute('data-editor-highlight', 'true');
                }
            }, true);

            document.addEventListener('mouseout', (e) => {
                if (this.isPreview) return;
                if (e.target instanceof HTMLElement) {
                    e.target.removeAttribute('data-editor-highlight');
                }
            }, true);

            // Click selection
            document.addEventListener('click', (e) => {
                if (this.isPreview) return;
                e.preventDefault();
                e.stopPropagation();
                this.selectElement(e.target);
            }, true);

            // Wheel / Scroll forwarding
            window.addEventListener('wheel', (e) => {
                if (this.isPreview) return;
                e.preventDefault();
                e.stopPropagation();
                
                window.parent.postMessage({
                    type: 'IFRAME_WHEEL',
                    deltaX: e.deltaX,
                    deltaY: e.deltaY,
                    ctrlKey: e.ctrlKey,
                    metaKey: e.metaKey
                }, '*');
            }, { passive: false });

            // Keyboard blocks
            window.addEventListener('keydown', (e) => {
                if (this.isPreview) return;
                if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '-' || e.key === '0')) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }, true);

            // Navigation Sync
            let lastPath = window.location.pathname;
            const checkNav = () => {
                const currentPath = window.location.pathname;
                if (currentPath !== lastPath) {
                    lastPath = currentPath;
                    window.parent.postMessage({
                        type: 'PAGE_NAVIGATED',
                        path: currentPath
                    }, '*');
                }
            };
            
            // Observe pushState/replaceState
            const originalPushState = window.history.pushState;
            const originalReplaceState = window.history.replaceState;
            window.history.pushState = function() {
                originalPushState.apply(this, arguments);
                setTimeout(checkNav, 0);
            };
            window.history.replaceState = function() {
                originalReplaceState.apply(this, arguments);
                setTimeout(checkNav, 0);
            };
            window.addEventListener('popstate', checkNav);
            
            // Intercept link clicks as a backup
            document.addEventListener('click', (e) => {
                const link = e.target.closest('a');
                if (link && link.href && link.target !== '_blank') {
                    // Navigate and check after a tick
                    setTimeout(checkNav, 100);
                }
            }, true);

            // Resize observer
            const observer = new ResizeObserver(() => this.broadcastHeight());
            if(document.body) observer.observe(document.body);
        }

        bindMessageListener() {
            window.addEventListener('message', (event) => {
                if (!event.data) return;
                try {
                    this.handleMessage(event.data);
                } catch (e) {
                    console.warn("Editor Script: Message handling failed", e);
                }
            });
        }

        handleMessage(data) {
            switch(data.type) {
                case 'TOGGLE_PREVIEW':
                    this.updateMode(data.value);
                    if (this.isPreview && this.selectedElement) {
                        this.selectedElement = null;
                    }
                    break;
                case 'UPDATE_TEXT':
                    if (this.selectedElement) this.selectedElement.innerText = data.value;
                    break;
                case 'UPDATE_ATTRIBUTE':
                    if (this.selectedElement) this.selectedElement.setAttribute(data.attribute, data.value);
                    break;
                case 'UPDATE_STYLE':
                    if (this.selectedElement) {
                        this.selectedElement.style.setProperty(data.property, data.value);
                        // Resend selection to update computed values in UI (optimistic check + confirmation)
                        setTimeout(() => this.selectElement(this.selectedElement), 0);
                    }
                    break;
                case 'UPDATE_CLASS':
                    if (this.selectedElement) {
                        this.selectedElement.className = data.className;
                        this.scanClasses(); // Re-scan as classes might use new combinations?
                        setTimeout(() => this.selectElement(this.selectedElement), 0);
                    }
                    break;
                case 'UPDATE_CSS_RULE':
                    this.updateCssRule(data.selector, data.property, data.value);
                    // Force refresh to catch CSS rule changes
                    if (this.selectedElement && this.selectedElement.matches(data.selector)) {
                        setTimeout(() => this.selectElement(this.selectedElement), 0);
                    }
                    break;
                case 'REQUEST_STYLES':
                    const styleEl = document.getElementById(this.styleBlockId);
                    window.parent.postMessage({
                        type: 'STYLES_GENERATED',
                        css: styleEl ? styleEl.textContent : ""
                    }, '*');
                    break;
                case 'REQUEST_HTML':
                    window.parent.postMessage({
                        type: 'HTML_GENERATED',
                        html: document.documentElement.outerHTML
                    }, '*');
                    break;
            }
        }

        updateMode(isPreview) {
            this.isPreview = isPreview;
            sessionStorage.setItem('editor_preview_mode', this.isPreview ? 'true' : 'false');
            
            if (this.isPreview) {
                document.documentElement.classList.remove('editor-mode');
                // Proactive cleanup of all editor attributes
                document.querySelectorAll('[data-editor-highlight], [data-editor-selected]').forEach(el => {
                    el.removeAttribute('data-editor-highlight');
                    el.removeAttribute('data-editor-selected');
                });
            } else {
                document.documentElement.classList.add('editor-mode');
            }
        }

        selectElement(element) {
            if (this.selectedElement) {
                this.selectedElement.removeAttribute('data-editor-selected');
            }
            this.selectedElement = element;
            this.selectedElement.setAttribute('data-editor-selected', 'true');

            // Compute Styles
            const computed = window.getComputedStyle(element);
            const explicit = element.style; // CSSStyleDeclaration

            // Helper to get computed value
            const getComp = (prop) => computed.getPropertyValue(prop);
            
            // Map relevant styles
            const styles = {
                // Typography
                color: getComp('color'),
                fontSize: getComp('font-size'),
                fontWeight: getComp('font-weight'),
                fontFamily: getComp('font-family'),
                textAlign: getComp('text-align'),
                lineHeight: getComp('line-height'),
                letterSpacing: getComp('letter-spacing'),
                textDecoration: getComp('text-decoration-line'),

                // Spacing & Layout
                display: getComp('display'),
                flexDirection: getComp('flex-direction'),
                justifyContent: getComp('justify-content'),
                alignItems: getComp('align-items'),
                flexWrap: getComp('flex-wrap'),
                gap: getComp('gap'),
                
                marginTop: getComp('margin-top'),
                marginRight: getComp('margin-right'),
                marginBottom: getComp('margin-bottom'),
                marginLeft: getComp('margin-left'),
                
                paddingTop: getComp('padding-top'),
                paddingRight: getComp('padding-right'),
                paddingBottom: getComp('padding-bottom'),
                paddingLeft: getComp('padding-left'),

                // Size
                width: getComp('width'),
                height: getComp('height'),
                minWidth: getComp('min-width'),
                minHeight: getComp('min-height'),
                maxWidth: getComp('max-width'),
                maxHeight: getComp('max-height'),
                overflow: getComp('overflow'),

                // Position
                position: getComp('position'),
                zIndex: getComp('z-index'),
                top: getComp('top'),
                right: getComp('right'),
                bottom: getComp('bottom'),
                left: getComp('left'),

                // Visuals
                backgroundColor: getComp('background-color'),
                opacity: getComp('opacity'),
                borderRadius: getComp('border-radius'), // simplified
                borderWidth: getComp('border-width'),
                borderColor: getComp('border-color'),
                borderStyle: getComp('border-style'),
                boxShadow: getComp('box-shadow'),
                cursor: getComp('cursor'),
            };

            // Explicit Styles check
            // Convert kebab-case (CSS) to camelCase (JS) to match 'styles' object keys
            const toCamelCase = (s) => s.replace(/-./g, x => x[1].toUpperCase());
            const explicitStyle = {};
            for (let i = 0; i < explicit.length; i++) {
                const prop = explicit[i]; // e.g. "margin-left"
                const val = explicit.getPropertyValue(prop);
                explicitStyle[toCamelCase(prop)] = val;
                // Also keep kebab-case just in case some panels query it directly (though mostly they use camel)
                explicitStyle[prop] = val;
            }

            // Robust LID lookup: Traverse up if current element has no LID
            let lid = element.getAttribute('data-lid');
            if (!lid) {
                const closest = element.closest('[data-lid]');
                if (closest) {
                    lid = closest.getAttribute('data-lid');
                }
            }

            // Calculate context rects for relative units
            const parent = element.parentElement;
            const parentRect = parent ? {
                width: parent.getBoundingClientRect().width,
                height: parent.getBoundingClientRect().height
            } : { width: 0, height: 0 };
            
            const viewportRect = {
                width: window.innerWidth,
                height: window.innerHeight
            };

            window.parent.postMessage({
                type: 'ELEMENT_SELECTED',
                tagName: element.tagName,
                textContent: element.innerText,
                id: element.id,
                className: element.className,
                href: element.getAttribute('href') || undefined,
                lid: lid || undefined,
                parentRect: parentRect,
                viewportRect: viewportRect,
                styles: styles,
                explicitStyle: explicitStyle
            }, '*');
        }

        updateCssRule(selector, property, value) {
            // Find or create our style block
            let styleSheet = document.getElementById(this.styleBlockId);
            if (!styleSheet) {
                const styleEl = document.createElement('style');
                styleEl.id = this.styleBlockId;
                document.head.appendChild(styleEl);
                styleSheet = styleEl;
            }
            
            const sheet = styleSheet.sheet;
            const rules = sheet.cssRules || sheet.rules;
            
            // Check if rule exists
            let ruleIndex = -1;
            for (let i = 0; i < rules.length; i++) {
                if (rules[i].selectorText === selector) {
                    ruleIndex = i;
                    break;
                }
            }

            if (ruleIndex !== -1) {
                // Update existing
                rules[ruleIndex].style.setProperty(property, value);
            } else {
                // Create new rule
                // We typically need to set the property after insertion
                // Use string concatenation to avoid template literal escaping issues during injection
                const rule = selector + " { " + property + ": " + value + "; }";
                try {
                    sheet.insertRule(rule, rules.length);
                } catch (e) {
                    console.warn("Failed to insert rule:", rule, e);
                }
            }
        }

        scanClasses() {
            const classes = new Set();
            // Scan all stylesheets
            // Note: Accessing cross-origin sheets might block this
            try {
                for (const sheet of document.styleSheets) {
                    try {
                        for (const rule of sheet.cssRules) {
                            if (rule.type === 1 && rule.selectorText) { // STYLE_RULE
                                // Extract class names from selector
                                const matches = rule.selectorText.match(/\\.[a-zA-Z0-9_-]+/g);
                                if (matches) {
                                    matches.forEach(cls => classes.add(cls.substring(1)));
                                }
                            }
                        }
                    } catch (e) {
                         // Likely CORS access to stylesheet
                        console.warn("Skipping stylesheet scan", e);
                    }
                }
            } catch (e) {}

            window.parent.postMessage({
                type: 'AVAILABLE_CLASSES',
                classes: Array.from(classes)
            }, '*');
        }

        broadcastHeight() {
            const height = document.documentElement.scrollHeight;
            window.parent.postMessage({ type: 'CONTENT_RESIZE', height }, '*');
        }
    }

    // Initialize logic when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new EditorRuntime());
    } else {
        new EditorRuntime();
    }
})();
`;
