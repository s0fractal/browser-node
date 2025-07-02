/**
 * GitHub Content Script
 * Captures Copilot suggestions and user interactions
 */

console.log('🧬 S0Fractal Intent Capture active on GitHub');

// Track Copilot suggestions
let lastSuggestion = '';
let suggestionObserver = null;

// Function to capture intent
function captureIntent(type, content, context = {}) {
    const intent = {
        source: 'github',
        type: type,
        content: content,
        context: {
            url: window.location.href,
            ...context
        },
        timestamp: new Date().toISOString(),
        confidence: 0.8
    };
    
    chrome.runtime.sendMessage({
        type: 'INTENT_CAPTURED',
        intent: intent
    });
}

// Monitor Copilot suggestions
function monitorCopilot() {
    // Look for Copilot suggestion elements
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                // Check for Copilot suggestion elements
                if (node.nodeType === 1) { // Element node
                    const suggestion = node.querySelector?.('[class*="copilot-suggestion"]');
                    if (suggestion) {
                        const suggestionText = suggestion.textContent;
                        if (suggestionText && suggestionText !== lastSuggestion) {
                            lastSuggestion = suggestionText;
                            captureIntent('copilot-suggestion', suggestionText, {
                                action: 'suggested'
                            });
                        }
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    return observer;
}

// Monitor code editor changes
function monitorCodeEditor() {
    // GitHub's code editor
    document.addEventListener('input', (event) => {
        const target = event.target;
        
        // Check if it's a code editor
        if (target.classList.contains('CodeMirror') || 
            target.querySelector?.('.CodeMirror') ||
            target.closest('.file-editor-textarea')) {
            
            // Debounce to avoid too many captures
            clearTimeout(window.codeEditTimeout);
            window.codeEditTimeout = setTimeout(() => {
                captureIntent('code-edit', target.value || target.textContent, {
                    file: document.querySelector('.final-path')?.textContent
                });
            }, 2000);
        }
    });
}

// Monitor commit messages
function monitorCommits() {
    document.addEventListener('submit', (event) => {
        const form = event.target;
        
        // Check for commit form
        if (form.querySelector('[name="commit[message]"]')) {
            const message = form.querySelector('[name="commit[message]"]').value;
            const description = form.querySelector('[name="commit[description]"]')?.value;
            
            captureIntent('git-commit', message, {
                description: description,
                branch: document.querySelector('.branch-name')?.textContent
            });
        }
    });
}

// Monitor pull request creation
function monitorPullRequests() {
    // Check if we're on a PR page
    if (window.location.pathname.includes('/pull/') || 
        window.location.pathname.includes('/compare/')) {
        
        const prTitle = document.querySelector('[name="pull_request[title]"]');
        const prBody = document.querySelector('[name="pull_request[body]"]');
        
        if (prTitle) {
            prTitle.addEventListener('blur', () => {
                captureIntent('pr-title', prTitle.value);
            });
        }
        
        if (prBody) {
            prBody.addEventListener('blur', () => {
                captureIntent('pr-description', prBody.value);
            });
        }
    }
}

// Monitor issue creation
function monitorIssues() {
    if (window.location.pathname.includes('/issues/new')) {
        const issueTitle = document.querySelector('[name="issue[title]"]');
        const issueBody = document.querySelector('[name="issue[body]"]');
        
        if (issueTitle) {
            issueTitle.addEventListener('blur', () => {
                captureIntent('issue-title', issueTitle.value);
            });
        }
        
        if (issueBody) {
            issueBody.addEventListener('blur', () => {
                captureIntent('issue-description', issueBody.value);
            });
        }
    }
}

// Initialize monitoring
function initialize() {
    monitorCopilot();
    monitorCodeEditor();
    monitorCommits();
    monitorPullRequests();
    monitorIssues();
    
    // Also monitor for Copilot acceptance/rejection
    document.addEventListener('keydown', (event) => {
        // Tab key often accepts Copilot suggestions
        if (event.key === 'Tab' && lastSuggestion) {
            // Check if cursor is in code editor
            if (document.activeElement?.closest('.CodeMirror') || 
                document.activeElement?.closest('.file-editor-textarea')) {
                
                captureIntent('copilot-acceptance', lastSuggestion, {
                    action: 'accepted'
                });
            }
        }
        
        // Esc key often rejects suggestions
        if (event.key === 'Escape' && lastSuggestion) {
            captureIntent('copilot-rejection', lastSuggestion, {
                action: 'rejected'
            });
            lastSuggestion = '';
        }
    });
}

// Wait for page to load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

// Re-initialize on navigation (GitHub is a SPA)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        setTimeout(initialize, 1000);
    }
}).observe(document, { subtree: true, childList: true });