// Lightweight Hot Reload script for Chrome/Brave Extension Development
// Automatically reloads extension and active tab whenever you edit and save any file.

const filesInDirectory = dir => new Promise(resolve => {
  dir.createReader().readEntries(entries => {
    Promise.all(entries.map(e =>
      e.isDirectory
        ? filesInDirectory(e)
        : new Promise(resolve => e.file(resolve))
    ))
    .then(files => [].concat(...files))
    .then(resolve);
  });
});

const timestampForFilesInDirectory = dir =>
  filesInDirectory(dir).then(files =>
    files.map(f => f.name + (f.lastModifiedDate ? f.lastModifiedDate.getTime() : f.lastModified)).join('')
  );

const watchChanges = (dir, lastTimestamp) => {
  timestampForFilesInDirectory(dir).then(timestamp => {
    if (!lastTimestamp || lastTimestamp === timestamp) {
      setTimeout(() => watchChanges(dir, timestamp), 1000);
    } else {
      console.log('[Hot Reload] 🔄 Changes detected! Reloading extension & active tab...');
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (tabs[0] && tabs[0].id && /^https?:\/\//.test(tabs[0].url || '')) {
          try {
            chrome.tabs.reload(tabs[0].id);
          } catch (e) {}
        }
        chrome.runtime.reload();
      });
    }
  }).catch(err => {
    console.log('[Hot Reload] Timestamp check error:', err);
  });
};

if (chrome.management) {
  chrome.management.getSelf(self => {
    if (self.installType === 'development') {
      chrome.runtime.getPackageDirectoryEntry(dir => watchChanges(dir));
      console.log('[Hot Reload] 🔥 Dev Mode Watcher active.');
    }
  });
} else {
  chrome.runtime.getPackageDirectoryEntry(dir => watchChanges(dir));
}
