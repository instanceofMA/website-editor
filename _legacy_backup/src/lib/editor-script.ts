export const EDITOR_SCRIPT = `
(function() {
    console.log("Website Editor: Injected script active");

    class EditorRuntime {
        constructor() {
            this.selectedElement = null;
            this.isPreview = false;
            this.styleBlockId = "editor-generated-styles";
            
            this.initStyles();
            this.bindEvents();
            this.bindMessageListener();
            this.broadcastHeight();
            this.scanClasses(); // Initial scan
        }

        initStyles() {
            // Highlighting styles
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
        }

        bindEvents() {
            // Hover effects
            document.addEventListener('mouseover', (e) => {
                if (this.isPreview) return;
                e.preventDefault();
                e.stopPropagation();
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

            // Resize observer
            const observer = new ResizeObserver(() => this.broadcastHeight());
            if(document.body) observer.observe(document.body);
        }

        bindMessageListener() {
            window.addEventListener('message', (event) => {
                if (!event.data) return;
                this.handleMessage(event.data);
            });
        }

        handleMessage(data) {
            switch(data.type) {
                case 'TOGGLE_PREVIEW':
                    this.isPreview = data.value;
                    if (this.isPreview && this.selectedElement) {
                        this.selectedElement.removeAttribute('data-editor-selected');
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
                        this.selectedElement.style[data.property] = data.value;
                        // Resend selection to update computed values in UI (optimistic check)
                        // setTimeout(() => this.selectElement(this.selectedElement), 0);
                    }
                    break;
                case 'UPDATE_CLASS':
                    if (this.selectedElement) {
                        this.selectedElement.className = data.className;
                        this.scanClasses(); // Re-scan as classes might use new combinations?
                    }
                    break;
                case 'UPDATE_CSS_RULE':
                    this.updateCssRule(data.selector, data.property, data.value);
                    break;
                case 'REQUEST_STYLES':
                    const styleEl = document.getElementById(this.styleBlockId);
                    window.parent.postMessage({
                        type: 'STYLES_GENERATED',
                        css: styleEl ? styleEl.textContent : ""
                    }, '*');
                    break;
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

            // Capture explicit inline styles
            // We iterate explicit properties to know what is 'set' on the element
            const explicitStyle = {};
            for (let i = 0; i < explicit.length; i++) {
                const prop = explicit[i];
                explicitStyle[prop] = explicit.getPropertyValue(prop);
            }

            window.parent.postMessage({
                type: 'ELEMENT_SELECTED',
                tagName: element.tagName,
                textContent: element.innerText,
                id: element.id,
                className: element.className,
                href: element.getAttribute('href') || undefined,
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
                rules[ruleIndex].style[property] = value;
            } else {
                // Create new rule
                // We typically need to set the property after insertion
                const newIndex = sheet.insertRule(\`\${selector} { \${property}: \${value}; }\`, rules.length);
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
