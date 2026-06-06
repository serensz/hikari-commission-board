export function renderAdminSetup() {
    return `
  <div class="admin-setup">
    <div class="setup-card">
      <div class="setup-icon">🔐</div>
      <h1>Hikari's Commission Board</h1>
      <p>Setup GitHub Gist API to sync your queue with public viewers</p>

      <div class="setup-form">
        <div class="form-group">
          <label>GitHub Personal Access Token</label>
          <p class="form-hint">
            Create a token at <a href="https://github.com/settings/tokens" target="_blank">github.com/settings/tokens</a> with 'gist' scope
          </p>
          <input 
            type="password" 
            id="githubToken" 
            class="search-input" 
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          >
        </div>

        <div class="form-actions">
          <button class="btn btn-primary" id="testTokenBtn">Test & Setup</button>
          <button class="btn btn-ghost" id="skipSetupBtn">Skip for Now</button>
        </div>

        <div id="setupStatus" style="display: none; margin-top: 1rem; padding: 0.75rem; border-radius: 6px; font-size: 0.9rem;"></div>
      </div>

      <div class="setup-info">
        <h3>What happens next?</h3>
        <ul>
          <li>✓ Your GitHub account is verified</li>
          <li>✓ A public Gist is created for your queue</li>
          <li>✓ A public link is generated for clients</li>
          <li>✓ Admin updates publish to the Gist automatically</li>
        </ul>
      </div>
    </div>
  </div>
  `;
}
export function renderAdminSettings(gistUsername, gistEmail, gistId) {
    return `
  <div class="admin-settings">
    <div class="settings-section">
      <h2>GitHub Gist Integration</h2>
      
      ${gistUsername ? `
        <div class="settings-card">
          <div class="settings-connected">
            <div class="connected-icon">✓</div>
            <div class="connected-info">
              <div class="connected-label">Connected to GitHub</div>
              <div class="connected-username">@${gistUsername}</div>
              ${gistEmail ? `<div class="connected-email">${gistEmail}</div>` : ''}
            </div>
          </div>

          ${gistId ? `
            <div class="gist-link-section">
              <label>Public Queue Link:</label>
              <div class="gist-link-display">
                <input 
                  type="text" 
                  readonly 
                  value="https://gist.github.com/${gistUsername}/${gistId}"
                  class="search-input"
                  style="margin-bottom: 0.5rem;"
                >
                <button class="btn btn-sm btn-ghost" id="copyGistLinkBtn">Copy Link</button>
              </div>
            </div>
          ` : ''}

          <button class="btn btn-danger" id="disconnectGistBtn" style="margin-top: 1rem;">Disconnect GitHub</button>
        </div>
      ` : `
        <div class="settings-empty">
          <p>Not configured. <a href="#admin-setup">Setup GitHub Gist</a></p>
        </div>
      `}
    </div>

    <div class="settings-section">
      <h2>Data Management</h2>
      
      <div class="settings-actions">
        <button class="btn btn-ghost" id="exportDataBtn">Export Data (JSON)</button>
        <button class="btn btn-ghost" id="importDataBtn">Import Data (JSON)</button>
        <input type="file" id="importFile" accept=".json" style="display: none;">
      </div>
    </div>
  </div>
  `;
}
export function renderPublishModal(clientCount, publicClientCount) {
    return `
  <div class="modal-overlay" id="publishModal">
    <div class="modal">
      <div class="modal-header">
        <h2>📤 Publish Queue to Gist</h2>
        <button class="modal-close" id="closePublishModal">✕</button>
      </div>
      <div class="modal-body">
        <p>This will publish <strong>${publicClientCount}</strong> clients (excluding "On Hold" statuses) to your public Gist.</p>
        
        <div class="publish-summary">
          <div class="summary-row">
            <span>Total Clients:</span>
            <strong>${clientCount}</strong>
          </div>
          <div class="summary-row">
            <span>Publishing:</span>
            <strong>${publicClientCount}</strong>
          </div>
          <div class="summary-row">
            <span>Not Published:</span>
            <strong>${clientCount - publicClientCount} (On Hold)</strong>
          </div>
        </div>

        <p style="color: var(--text3); font-size: 0.85rem; margin-top: 1rem;">
          ℹ️ Public viewers can search and lookup clients by name or ID. Your income data is never published.
        </p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" id="cancelPublishBtn">Cancel</button>
        <button class="btn btn-primary" id="confirmPublishBtn">Publish Now</button>
      </div>
    </div>
  </div>
  `;
}
