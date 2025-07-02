/**
 * S0Fractal Intent Capture - Background Service Worker
 * Captures intents from AI tools and forwards to consciousness
 */

const CONSCIOUSNESS_API = 'http://127.0.0.1:8432';

// Track captured intents
let capturedIntents = [];
let isConnected = false;

// Check consciousness API connection
async function checkConnection() {
    try {
        const response = await fetch(`${CONSCIOUSNESS_API}/consciousness/collective`);
        isConnected = response.ok;
        console.log('🧬 Consciousness API connected:', isConnected);
    } catch (error) {
        isConnected = false;
        console.error('❌ Consciousness API not reachable');
    }
}

// Send intent to consciousness
async function recordIntent(intent) {
    if (!isConnected) {
        // Store locally if not connected
        capturedIntents.push(intent);
        chrome.storage.local.set({ pendingIntents: capturedIntents });
        return;
    }

    try {
        const params = new URLSearchParams({
            agent: intent.source || 'browser-extension',
            intent: intent.type || 'capture',
            memory: JSON.stringify(intent),
            resonance: intent.confidence || 0.5
        });

        const response = await fetch(`${CONSCIOUSNESS_API}/consciousness/intent?${params}`);
        
        if (response.ok) {
            console.log('✅ Intent recorded:', intent);
            // Update badge
            chrome.action.setBadgeText({ text: '✓' });
            setTimeout(() => chrome.action.setBadgeText({ text: '' }), 1000);
        }
    } catch (error) {
        console.error('Failed to record intent:', error);
        capturedIntents.push(intent);
    }
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'INTENT_CAPTURED') {
        recordIntent(message.intent);
        sendResponse({ success: true });
    } else if (message.type === 'GET_STATUS') {
        sendResponse({ 
            connected: isConnected,
            pendingCount: capturedIntents.length
        });
    }
});

// Intercept GitHub Copilot suggestions
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        if (details.url.includes('copilot') && details.requestBody) {
            try {
                const decoder = new TextDecoder('utf-8');
                const body = JSON.parse(
                    decoder.decode(new Uint8Array(details.requestBody.raw[0].bytes))
                );
                
                // Extract intent from Copilot request
                if (body.prompt || body.code) {
                    recordIntent({
                        source: 'github-copilot',
                        type: 'code-suggestion',
                        content: body.prompt || body.code,
                        context: details.url,
                        timestamp: new Date().toISOString(),
                        confidence: 0.7
                    });
                }
            } catch (error) {
                console.error('Error parsing Copilot request:', error);
            }
        }
    },
    {
        urls: [
            "*://*.github.com/*",
            "*://*.githubusercontent.com/*"
        ]
    },
    ["requestBody"]
);

// Listen for tab updates to detect AI tool usage
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        // Check for AI tool URLs
        if (tab.url?.includes('cursor.sh') || 
            tab.url?.includes('github.com') ||
            tab.url?.includes('openai.com') ||
            tab.url?.includes('anthropic.com')) {
            
            // Inject content script if needed
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['content-general.js']
            }).catch(err => console.log('Script already injected'));
        }
    }
});

// Sync pending intents when connection restored
async function syncPendingIntents() {
    if (!isConnected || capturedIntents.length === 0) return;
    
    console.log(`📤 Syncing ${capturedIntents.length} pending intents...`);
    
    for (const intent of capturedIntents) {
        await recordIntent(intent);
    }
    
    capturedIntents = [];
    chrome.storage.local.remove('pendingIntents');
}

// Initialize
chrome.runtime.onInstalled.addListener(() => {
    console.log('🧬 S0Fractal Intent Capture installed');
    checkConnection();
    
    // Load pending intents
    chrome.storage.local.get('pendingIntents', (data) => {
        if (data.pendingIntents) {
            capturedIntents = data.pendingIntents;
        }
    });
});

// Check connection periodically
setInterval(async () => {
    await checkConnection();
    if (isConnected) {
        await syncPendingIntents();
    }
}, 30000); // Every 30 seconds

// Initial connection check
checkConnection();