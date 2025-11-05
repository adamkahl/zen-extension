// Load saved pairings and groups
async function loadPairings() {
  const result = await browser.storage.local.get({ pairings: [], groups: [] });
  const pairings = result.pairings;
  const groups = result.groups;
  
  const container = document.getElementById('pairings-container');
  container.innerHTML = '';
  
  if (pairings.length === 0) {
    addPairingRow('', '', '', '', groups);
  } else {
    pairings.forEach(p => addPairingRow(p.url, p.name, p.emoji || '', p.group || '', groups));
  }
}

// Load settings
async function loadSettings() {
  const { autoTidyEnabled } = await browser.storage.local.get({ autoTidyEnabled: false });
  document.getElementById('auto-tidy-toggle').checked = autoTidyEnabled;
}

// Debounce function to prevent excessive saves
let saveTimeout = null;
function debouncedSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    savePairings();
  }, 500);
}

// Add a new pairing row to the form
function addPairingRow(url = '', name = '', emoji = '', group = '', groups = []) {
  const container = document.getElementById('pairings-container');
  const div = document.createElement('div');
  div.className = 'pairing-item';
  
  const groupOptions = groups.map(g => {
    const groupName = typeof g === 'string' ? g : g.name;
    return `<option value="${escapeHtml(groupName)}" ${group === groupName ? 'selected' : ''}>${escapeHtml(groupName)}</option>`;
  }).join('');
  
  div.innerHTML = `
    <div class="pairing-inputs">
        <div class="input-group-custom">
            <label class="form-label">
                <span class="icon-label">
                    <i class="fas fa-link"></i> URL Pattern
                </span>
            </label>
            <input type="text" class="form-control url-input" placeholder="github.com" value="${escapeHtml(url)}">
        </div>
        <div class="input-group-custom">
            <label class="form-label">
                <span class="icon-label">
                    <i class="fas fa-tag"></i> Tab Name
                </span>
            </label>
            <input type="text" class="form-control name-input" placeholder="GitHub" value="${escapeHtml(name)}">
        </div>
        <div class="input-group-custom">
            <label class="form-label">
                <span class="icon-label">
                    <i class="fas fa-palette"></i> Color
                </span>
            </label>
            <select class="form-control emoji-input">
                <option value="">None</option>
                <option value="🟢" ${emoji === '🟢' ? 'selected' : ''}>🟢</option>
                <option value="🟡" ${emoji === '🟡' ? 'selected' : ''}>🟡</option>
                <option value="🔴" ${emoji === '🔴' ? 'selected' : ''}>🔴</option>
                <option value="🔵" ${emoji === '🔵' ? 'selected' : ''}>🔵</option>
                <option value="🟣" ${emoji === '🟣' ? 'selected' : ''}>🟣</option>
            </select>
        </div>
        <div class="input-group-custom">
            <label class="form-label">
                <span class="icon-label">
                    <i class="fas fa-folder"></i> Group
                </span>
            </label>
            <select class="form-control group-input">
                <option value="">None</option>
                ${groupOptions}
            </select>
        </div>
        <div class="input-group-custom" style="flex: 0 0 auto; min-width: auto;">
            <label class="form-label" style="visibility: hidden;">
                Remove
            </label>
            <button class="btn btn-remove" type="button">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    </div>
  `;
  
  div.querySelector('.url-input').addEventListener('input', debouncedSave);
  div.querySelector('.name-input').addEventListener('input', debouncedSave);
  div.querySelector('.emoji-input').addEventListener('change', debouncedSave);
  div.querySelector('.group-input').addEventListener('change', debouncedSave);
  
  div.querySelector('.btn-remove').onclick = () => {
    div.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      div.remove();
      debouncedSave();
    }, 300);
  };
  
  container.appendChild(div);
}

// Load and render groups
async function loadGroups() {
  const result = await browser.storage.local.get({ groups: [] });
  const groups = result.groups;
  
  const container = document.getElementById('groups-container');
  container.innerHTML = '';
  
  if (groups.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding: 1rem; color: #6b7280;">No groups created yet</div>';
    return;
  }
  
  groups.forEach((group, index) => {
    const groupName = typeof group === 'string' ? group : group.name;
    const groupCategory = typeof group === 'object' ? group.category : '';
    const keywordCount = typeof group === 'object' && group.keywords ? group.keywords.length : 0;
    
    const div = document.createElement('div');
    div.className = 'group-item';
    div.draggable = true;
    div.dataset.index = index;
    div.style.cssText = 'display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: #f8f9fa; border-radius: 8px; margin-bottom: 0.5rem; cursor: move;';
    
    div.innerHTML = `
      <i class="fas fa-grip-vertical" style="color: #9ca3af; cursor: grab;"></i>
      <span style="font-size: 1.25rem;">${groupCategory || '📁'}</span>
      <span class="group-name" style="flex: 1; font-weight: 500; cursor: pointer;">${escapeHtml(groupName)}</span>
      ${keywordCount > 0 ? `<span style="background: #6366f1; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">${keywordCount} keyword${keywordCount !== 1 ? 's' : ''}</span>` : ''}
      <button class="btn btn-sm btn-edit" type="button" style="padding: 0.25rem 0.75rem; font-size: 0.85rem; background: transparent; border: 2px solid #6366f1; color: #6366f1; border-radius: 6px; transition: all 0.3s ease;">
        <i class="fas fa-edit"></i>
      </button>
      <button class="btn btn-sm btn-remove" type="button" style="padding: 0.25rem 0.75rem; font-size: 0.85rem;">
        <i class="fas fa-trash"></i>
      </button>
    `;
    
    const editBtn = div.querySelector('.btn-edit');
    const groupNameSpan = div.querySelector('.group-name');
    
    const editGroup = async () => {
      showGroupEditModal(groupName, groupCategory, typeof group === 'object' ? group.keywords : [], false);
    };
    
    editBtn.onclick = editGroup;
    groupNameSpan.onclick = editGroup;
    
    div.querySelector('.btn-remove').onclick = async () => {
      if (confirm(`Delete group "${groupName}"? Pairings in this group will not be deleted.`)) {
        const result = await browser.storage.local.get({ groups: [] });
        const updatedGroups = result.groups.filter((g, i) => i !== index);
        await browser.storage.local.set({ groups: updatedGroups });
        await loadGroups();
        await loadPairings();
        showStatus('Group deleted');
      }
    };
    
    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragover', handleDragOver);
    div.addEventListener('drop', handleDrop);
    div.addEventListener('dragend', handleDragEnd);
    
    container.appendChild(div);
  });
}

// Show group edit modal
function showGroupEditModal(currentName, currentCategory, currentKeywords = [], isAdding) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 2rem;
  `;
  
  const keywordsHtml = currentKeywords.map(kw => 
    `<span class="keyword-tag">${escapeHtml(kw)}<button class="keyword-remove" data-keyword="${escapeHtml(kw)}">×</button></span>`
  ).join('');
  
  modal.innerHTML = `
    <div style="
      background: white;
      border-radius: 16px;
      padding: 2rem;
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    ">
      <h2 style="margin: 0 0 1.5rem 0; color: #1f2937; font-size: 1.5rem;">
        <i class="fas fa-${isAdding ? 'plus' : 'edit'}" style="color: #6366f1;"></i> ${isAdding ? 'Add' : 'Edit'} Group
      </h2>
      
      <div style="margin-bottom: 1rem;">
        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #4b5563;">
          Group Name
        </label>
        <input 
          type="text" 
          id="modal-group-name" 
          value="${escapeHtml(currentName)}"
          style="
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
          "
        />
      </div>
      
      <div style="margin-bottom: 1rem;">
        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #4b5563;">
          Category Icon
        </label>
        <select 
          id="modal-group-category"
          style="
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
          "
        >
          <option value="">None</option>
          <option value="💼" ${currentCategory === '💼' ? 'selected' : ''}>💼 Work</option>
          <option value="📋" ${currentCategory === '📋' ? 'selected' : ''}>📋 Project Management</option>
          <option value="💬" ${currentCategory === '💬' ? 'selected' : ''}>💬 Communication</option>
          <option value="💻" ${currentCategory === '💻' ? 'selected' : ''}>💻 Development & Code</option>
          <option value="📖" ${currentCategory === '📖' ? 'selected' : ''}>📖 Documentation</option>
          <option value="🐞" ${currentCategory === '🐞' ? 'selected' : ''}>🐞 Debugging & Q&A</option>
          <option value="🎮" ${currentCategory === '🎮' ? 'selected' : ''}>🎮 Gaming</option>
          <option value="🛒" ${currentCategory === '🛒' ? 'selected' : ''}>🛒 Shopping</option>
          <option value="📰" ${currentCategory === '📰' ? 'selected' : ''}>📰 News</option>
          <option value="🎵" ${currentCategory === '🎵' ? 'selected' : ''}>🎵 Music</option>
          <option value="🎬" ${currentCategory === '🎬' ? 'selected' : ''}>🎬 Video</option>
          <option value="📚" ${currentCategory === '📚' ? 'selected' : ''}>📚 Reading</option>
          <option value="🔧" ${currentCategory === '🔧' ? 'selected' : ''}>🔧 Tools</option>
          <option value="🎓" ${currentCategory === '🎓' ? 'selected' : ''}>🎓 Education</option>
          <option value="🏥" ${currentCategory === '🏥' ? 'selected' : ''}>🏥 Health</option>
          <option value="💰" ${currentCategory === '💰' ? 'selected' : ''}>💰 Finance</option>
          <option value="🎨" ${currentCategory === '🎨' ? 'selected' : ''}>🎨 Design</option>
          <option value="⚙️" ${currentCategory === '⚙️' ? 'selected' : ''}>⚙️ Settings</option>
          <option value="🖥️" ${currentCategory === '🖥️' ? 'selected' : ''}>🖥️ Apps</option>
        </select>
      </div>
      
      <div style="margin-bottom: 1.5rem;">
        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #4b5563;">
          Keywords for Auto-Matching
          <span style="font-weight: normal; font-size: 0.875rem; color: #6b7280;">(optional)</span>
        </label>
        <p style="margin: 0 0 0.5rem 0; font-size: 0.875rem; color: #6b7280;">
          Tabs matching these keywords will automatically be grouped. Matches in URLs are weighted higher.
        </p>
        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
          <input 
            type="text" 
            id="modal-keyword-input" 
            placeholder="e.g., github.com, pull request"
            style="
              flex: 1;
              padding: 0.5rem;
              border: 2px solid #e5e7eb;
              border-radius: 6px;
              font-size: 0.95rem;
            "
          />
          <button id="modal-add-keyword" style="
            background: #6366f1;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
          ">
            Add
          </button>
        </div>
        <div id="modal-keywords-container" style="
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          min-height: 2rem;
        ">
          ${keywordsHtml}
        </div>
      </div>
      
      <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
        <button id="modal-cancel-btn" style="
          background: #e5e7eb;
          color: #1f2937;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        ">
          Cancel
        </button>
        <button id="modal-save-btn" style="
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        ">
          Save
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Keyword management
  const keywordInput = modal.querySelector('#modal-keyword-input');
  const keywordsContainer = modal.querySelector('#modal-keywords-container');
  
  const addKeyword = () => {
    const keyword = keywordInput.value.trim();
    if (!keyword) return;
    
    // Check for duplicates
    const existingKeywords = Array.from(keywordsContainer.querySelectorAll('.keyword-tag'))
      .map(tag => tag.textContent.replace('×', '').trim());
    
    if (existingKeywords.includes(keyword)) {
      keywordInput.value = '';
      return;
    }
    
    const tag = document.createElement('span');
    tag.className = 'keyword-tag';
    tag.innerHTML = `${escapeHtml(keyword)}<button class="keyword-remove" data-keyword="${escapeHtml(keyword)}">×</button>`;
    keywordsContainer.appendChild(tag);
    
    tag.querySelector('.keyword-remove').onclick = () => tag.remove();
    
    keywordInput.value = '';
  };
  
  modal.querySelector('#modal-add-keyword').onclick = addKeyword;
  keywordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  });
  
  // Remove existing keywords
  keywordsContainer.querySelectorAll('.keyword-remove').forEach(btn => {
    btn.onclick = () => btn.closest('.keyword-tag').remove();
  });
  
  setTimeout(() => {
    document.getElementById('modal-group-name').focus();
    document.getElementById('modal-group-name').select();
  }, 100);
  
  modal.querySelector('#modal-cancel-btn').onclick = () => {
    modal.remove();
  };
  
  modal.querySelector('#modal-save-btn').onclick = async () => {
    const newName = document.getElementById('modal-group-name').value.trim();
    const newCategory = document.getElementById('modal-group-category').value;
    const keywords = Array.from(keywordsContainer.querySelectorAll('.keyword-tag'))
      .map(tag => tag.textContent.replace('×', '').trim());
    
    if (!newName) {
      alert('Group name cannot be empty!');
      return;
    }
    
    const result = await browser.storage.local.get({ groups: [], pairings: [] });
    const groups = result.groups;
    const pairings = result.pairings;
    
    const normalizedGroups = groups.map(g => 
      typeof g === 'string' ? { name: g, category: '', keywords: [] } : g
    );
    
    const nameExistsInAnotherGroup = normalizedGroups.some(g => {
      return g.name === newName && (isAdding || g.name !== currentName);
    });

    if (nameExistsInAnotherGroup) {
      alert('A group with that name already exists!');
      return;
    }
    
    if (isAdding) {
      normalizedGroups.push({ name: newName, category: newCategory, keywords });
    } else {
      const groupIndex = normalizedGroups.findIndex(g => g.name === currentName);
      if (groupIndex === -1) {
        alert('Group not found. It may have been deleted.');
        modal.remove();
        return;
      }
      
      const oldName = normalizedGroups[groupIndex].name;
      normalizedGroups[groupIndex] = { name: newName, category: newCategory, keywords };
      
      if (oldName !== newName) {
        pairings.forEach(pairing => {
          if (pairing.group === oldName) {
            pairing.group = newName;
          }
        });
      }
    }
    
    await browser.storage.local.set({ groups: normalizedGroups, pairings });
    await loadGroups();
    await loadPairings();
    showStatus(isAdding ? 'Group added' : 'Group updated');
    modal.remove();
  };
  
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  };
  
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
}

// Drag and drop state
let draggedElement = null;

function handleDragStart(e) {
  draggedElement = this;
  this.style.opacity = '0.4';
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  
  const draggedOver = e.currentTarget;
  if (draggedElement !== draggedOver) {
    draggedOver.style.borderTop = '3px solid #6366f1';
  }
  
  return false;
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  const draggedOver = e.currentTarget;
  draggedOver.style.borderTop = '';
  
  if (draggedElement !== draggedOver) {
    const fromIndex = parseInt(draggedElement.dataset.index);
    const toIndex = parseInt(draggedOver.dataset.index);
    
    reorderGroups(fromIndex, toIndex);
  }
  
  return false;
}

function handleDragEnd(e) {
  this.style.opacity = '1';
  
  document.querySelectorAll('.group-item').forEach(item => {
    item.style.borderTop = '';
  });
  
  draggedElement = null;
}

async function reorderGroups(fromIndex, toIndex) {
  const result = await browser.storage.local.get({ groups: [] });
  const groups = result.groups;
  
  const [movedGroup] = groups.splice(fromIndex, 1);
  groups.splice(toIndex, 0, movedGroup);
  
  await browser.storage.local.set({ groups });
  await loadGroups();
  await loadPairings();
  showStatus('Groups reordered');
}

async function addGroup() {
  showGroupEditModal('', '', [], true);
}

async function savePairings() {
  const pairingDivs = document.querySelectorAll('.pairing-item');
  const pairings = [];
  
  pairingDivs.forEach(div => {
    const url = div.querySelector('.url-input').value.trim();
    const name = div.querySelector('.name-input').value.trim();
    const emoji = div.querySelector('.emoji-input').value.trim();
    const group = div.querySelector('.group-input').value.trim();
    
    if (url) {
      pairings.push({ url, name, emoji, group });
    }
  });
  
  await browser.storage.local.set({ pairings });
  showStatus('Saved');
}

function showStatus(message = 'Saved') {
  const status = document.getElementById('status');
  status.querySelector('span').textContent = message;
  status.style.display = 'flex';
  
  clearTimeout(status.hideTimeout);
  status.hideTimeout = setTimeout(() => {
    status.style.display = 'none';
  }, 2000);
}

async function exportSettings() {
  const data = await browser.storage.local.get({ pairings: [], groups: [] });
  
  const exportData = {
    version: '1.1',
    exportDate: new Date().toISOString(),
    pairings: data.pairings,
    groups: data.groups
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `zen-tidy-settings-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showStatus('Settings exported');
}

async function importSettings(file) {
  try {
    const text = await file.text();
    const importData = JSON.parse(text);
    
    if (!importData.pairings || !Array.isArray(importData.pairings)) {
      throw new Error('Invalid settings file: missing or invalid pairings');
    }
    
    if (!importData.groups || !Array.isArray(importData.groups)) {
      throw new Error('Invalid settings file: missing or invalid groups');
    }
    
    if (!confirm('This will replace all current settings. Continue?')) {
      return;
    }
    
    await browser.storage.local.set({
      pairings: importData.pairings,
      groups: importData.groups
    });
    
    await loadGroups();
    await loadPairings();
    
    showStatus('Settings imported successfully');
  } catch (error) {
    alert(`Import failed: ${error.message}`);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Auto-tidy toggle handler
document.getElementById('auto-tidy-toggle').addEventListener('change', async (e) => {
  const autoTidyEnabled = e.target.checked;
  await browser.storage.local.set({ autoTidyEnabled });
  showStatus(autoTidyEnabled ? 'Auto-tidy enabled' : 'Auto-tidy disabled');
});

document.getElementById('add-pairing').addEventListener('click', async () => {
  const result = await browser.storage.local.get({ groups: [] });
  addPairingRow('', '', '', '', result.groups);
});

document.getElementById('add-group').addEventListener('click', addGroup);
document.getElementById('export-settings').addEventListener('click', exportSettings);
document.getElementById('import-settings').addEventListener('click', () => {
  document.getElementById('import-file').click();
});
document.getElementById('import-file').addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    importSettings(e.target.files[0]);
    e.target.value = '';
  }
});

loadPairings();
loadGroups();
loadSettings();

const style = document.createElement('style');
style.textContent = `
  @keyframes slideOut {
    to {
      opacity: 0;
      transform: translateX(20px);
    }
  }
  
  .keyword-tag {
    display: inline-flex;
    align-items: center;
    background: #e0e7ff;
    color: #4338ca;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    gap: 0.25rem;
  }
  
  .keyword-remove {
    background: none;
    border: none;
    color: #4338ca;
    cursor: pointer;
    font-size: 1.25rem;
    line-height: 1;
    padding: 0;
    margin-left: 0.25rem;
    font-weight: bold;
  }
  
  .keyword-remove:hover {
    color: #ef4444;
  }
`;
document.head.appendChild(style);