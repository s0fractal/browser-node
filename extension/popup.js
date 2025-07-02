/**
 * Extension Popup Script
 */

// Get status from background
async function updateStatus() {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
    
    // Update connection status
    const statusEl = document.getElementById('connectionStatus');
    const indicatorEl = document.getElementById('statusIndicator');
    
    if (response.connected) {
        statusEl.textContent = 'Connected';
        indicatorEl.className = 'status-indicator connected';
    } else {
        statusEl.textContent = 'Disconnected';
        indicatorEl.className = 'status-indicator disconnected';
    }
    
    // Update pending count
    document.getElementById('pendingCount').textContent = response.pendingCount || 0;
}

// Load recent intents from storage
async function loadRecentIntents() {
    const data = await chrome.storage.local.get(['capturedIntents', 'capturedToday']);
    
    // Update captured count
    document.getElementById('capturedCount').textContent = data.capturedToday || 0;
    
    // Update recent intents list
    const intents = data.capturedIntents || [];
    const recentIntents = intents.slice(-5).reverse(); // Last 5, newest first
    
    const container = document.getElementById('recentIntents');
    if (recentIntents.length > 0) {
        container.innerHTML = recentIntents.map(intent => `
            <div class="intent-item">
                <strong>${intent.source}:</strong> ${intent.type}
                <br><small>${new Date(intent.timestamp).toLocaleTimeString()}</small>
            </div>
        `).join('');
    }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    await updateStatus();
    await loadRecentIntents();
    
    // Sync button
    document.getElementById('syncBtn').addEventListener('click', async () => {
        // Trigger sync in background
        chrome.runtime.sendMessage({ type: 'SYNC_NOW' });
        
        // Update UI
        document.getElementById('syncBtn').textContent = 'Syncing...';
        setTimeout(() => {
            document.getElementById('syncBtn').textContent = 'Sync Now';
            updateStatus();
        }, 2000);
    });
    
    // Dashboard button
    document.getElementById('openDashboard').addEventListener('click', () => {
        window.open('http://localhost:8080', '_blank');
    });
    
    // Clear button
    document.getElementById('clearBtn').addEventListener('click', async () => {
        if (confirm('Clear all captured intents?')) {
            await chrome.storage.local.clear();
            await loadRecentIntents();
        }
    });
});

// Update status every 5 seconds
setInterval(updateStatus, 5000);