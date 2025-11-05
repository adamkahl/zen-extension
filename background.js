// Minimal click-to-tidy: rename tabs using saved pairings and organize by groups

// Find a pairing for a URL
function findPairing(pairings, url) {
  return pairings.find(p => p.url && url && url.includes(p.url));
}

// Find a group by name
function findGroup(groups, groupName) {
  if (!groupName) return null;
  return groups.find(g => {
    const name = typeof g === 'string' ? g : g.name;
    return name === groupName;
  });
}

// Main action: rename tabs based on pairings and organize by groups
async function tidy() {
  const [{ pairings, groups }, currentWindow] = await Promise.all([
    browser.storage.local.get({ pairings: [], groups: [] }),
    browser.windows.getLastFocused()
  ]);

  const tabs = await browser.tabs.query({ 
    windowId: currentWindow.id,
    currentWindow: true 
  });

  // Separate pinned and unpinned tabs
  const pinnedTabs = tabs.filter(tab => tab.pinned);
  const unpinnedTabs = tabs.filter(tab => !tab.pinned);

  if (unpinnedTabs.length === 0) return;

  const firstUnpinnedIndex = unpinnedTabs[0].index;

  // Create a map of group names to their order based on groups array
  const groupOrderMap = new Map();
  groups.forEach((group, index) => {
    const groupName = typeof group === 'string' ? group : group.name;
    groupOrderMap.set(groupName, index);
  });

  // Associate tabs with their pairings and groups
  const tabsWithGroups = unpinnedTabs.map(tab => {
    const pairing = findPairing(pairings, tab.url);
    const groupName = pairing?.group || '';
    const group = findGroup(groups, groupName);
    
    // Only rename if pairing has a name, otherwise keep original title
    const shouldRename = pairing && pairing.name && pairing.name.trim();
    
    let displayTitle = tab.title;
    if (shouldRename) {
      // Build title with group category, color emoji, and name
      const parts = [];
      
      // Add group category if group exists
      if (group && typeof group === 'object' && group.category) {
        parts.push(group.category);
      }
      
      // Add color emoji from pairing
      if (pairing.emoji) {
        parts.push(pairing.emoji);
      }
      
      // Add the name
      parts.push(pairing.name);
      
      displayTitle = parts.join(' ');
    }
    
    // Get group order (ungrouped tabs go to end)
    const groupOrder = groupName ? (groupOrderMap.get(groupName) ?? groups.length) : groups.length;
    
    return {
      tab,
      pairing,
      group: groupName,
      displayTitle,
      groupOrder,
      shouldRename
    };
  });

  // Sort tabs: first by group order, then alphabetically within groups
  tabsWithGroups.sort((a, b) => {
    // First, sort by group order
    if (a.groupOrder !== b.groupOrder) {
      return a.groupOrder - b.groupOrder;
    }
    
    // Within same group, sort alphabetically by display title
    return a.displayTitle.toLowerCase().localeCompare(b.displayTitle.toLowerCase());
  });

  // Rename tabs that match pairings (only if they have a name)
  await Promise.allSettled(
    tabsWithGroups.map(({ tab, shouldRename, displayTitle }) => {
      if (!shouldRename) return Promise.resolve();
      
      return browser.tabs.executeScript(tab.id, {
        code: `document.title = ${JSON.stringify(displayTitle)};`
      }).catch(() => {});
    })
  );

  // Move tabs into their sorted order
  const tabIds = tabsWithGroups.map(({ tab }) => tab.id);
  await browser.tabs.move(tabIds, { index: firstUnpinnedIndex });
}

// Toolbar button click handler
browser.browserAction.onClicked.addListener(() => {
  tidy();
});
