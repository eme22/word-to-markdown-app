import { invoke } from '@tauri-apps/api/core';
import { join, dirname, basename } from '@tauri-apps/api/path';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { open } from '@tauri-apps/plugin-dialog';
import './dark-mode.css';

const appWindow = getCurrentWebviewWindow();
const worker = new Worker(new URL('./worker.ts', import.meta.url), {
  type: 'module',
});

interface FileEntry {
  path: string;
  name: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  error?: string;
}

let files: FileEntry[] = [];
let isProcessing = false;

const dropArea = document.getElementById('drop-area')!;
const fileList = document.getElementById('file-list')!;
const fileListCard = document.getElementById('file-list-card')!;
const fileCountBadge = document.getElementById('file-count')!;
const startBtn = document.getElementById('start-btn') as HTMLButtonElement;
const clearBtn = document.getElementById('clear-btn') as HTMLButtonElement;
const progressSection = document.getElementById('progress-section')!;
const progressBar = document.getElementById('progress-bar')!;
const progressText = document.getElementById('progress-text')!;
const alertContainer = document.getElementById('alert-container')!;

// Handle native Tauri drag and drop
appWindow.onDragDropEvent((event) => {
  if (event.payload.type === 'drop') {
    const paths = event.payload.paths;
    addFiles(paths);
  } else if (event.payload.type === 'enter') {
    dropArea.classList.add('active');
  } else if (event.payload.type === 'leave' || event.payload.type === 'cancelled') {
    dropArea.classList.remove('active');
  }
});

dropArea.addEventListener('click', async () => {
  const selected = await open({
    multiple: true,
    filters: [
      {
        name: 'Word Documents',
        extensions: ['docx'],
      },
    ],
  });

  if (Array.isArray(selected)) {
    addFiles(selected);
  } else if (selected) {
    addFiles([selected]);
  }
});

function addFiles(paths: string[]) {
  const newFiles = paths
    .filter(path => path.toLowerCase().endsWith('.docx'))
    .map(path => ({
      path,
      name: path.split(/[\\/]/).pop() || path,
      status: 'pending' as const
    }));

  if (newFiles.length === 0) {
    showAlert('No valid .docx files found.', 'danger');
    return;
  }

  files = [...files, ...newFiles];
  renderFileList();
}

function renderFileList() {
  fileList.innerHTML = '';
  files.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML = `
      <span class="text-truncate" style="max-width: 80%">${file.name}</span>
      <span class="status-${file.status} small fw-bold">${file.status.toUpperCase()}</span>
    `;
    fileList.appendChild(item);
  });

  fileCountBadge.textContent = files.length.toString();

  if (files.length > 0) {
    fileListCard.classList.remove('d-none');
    startBtn.classList.remove('d-none');
    clearBtn.classList.remove('d-none');
  } else {
    fileListCard.classList.add('d-none');
    startBtn.classList.add('d-none');
    clearBtn.classList.add('d-none');
  }
}

clearBtn.addEventListener('click', () => {
  if (isProcessing) return;
  files = [];
  renderFileList();
  progressSection.classList.add('d-none');
  alertContainer.innerHTML = '';
});

startBtn.addEventListener('click', async () => {
  if (isProcessing || files.length === 0) return;

  isProcessing = true;
  startBtn.disabled = true;
  clearBtn.disabled = true;
  progressSection.classList.remove('d-none');

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    file.status = 'processing';
    renderFileList();
    updateProgress(i, files.length, file.name);

    try {
      const content = await invoke<number[]>('read_file_binary', { path: file.path });
      const buffer = new Uint8Array(content).buffer;
      const result = await convertFile(buffer);

      const dir = await dirname(file.path);
      const fileName = await basename(file.path);
      const base = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
      const outPath = await join(dir, `${base}.md`);

      await invoke('write_file', { path: outPath, content: result.markdown });

      file.status = 'success';
      successCount++;
    } catch (err) {
      console.error(`Error converting ${file.name}:`, err);
      file.status = 'error';
      file.error = err instanceof Error ? err.message : String(err);
      errorCount++;
    }

    renderFileList();
  }

  isProcessing = false;
  startBtn.disabled = false;
  clearBtn.disabled = false;
  updateProgress(files.length, files.length, 'Finished');

  showAlert(`Conversion complete! ${successCount} succeeded, ${errorCount} failed.`, errorCount > 0 ? 'warning' : 'success');
});

function updateProgress(current: number, total: number, filename: string) {
  const percent = Math.round((current / total) * 100);
  progressBar.style.width = `${percent}%`;
  progressText.textContent = `Processing: ${filename} (${current}/${total})`;
}

async function convertFile(buffer: ArrayBuffer): Promise<any> {
  return new Promise((resolve, reject) => {
    const onMessage = (e: MessageEvent) => {
      const { type, result, error } = e.data;
      if (type === 'success') {
        worker.removeEventListener('message', onMessage);
        resolve(result);
      } else {
        worker.removeEventListener('message', onMessage);
        reject(new Error(error));
      }
    };
    worker.addEventListener('message', onMessage);
    worker.postMessage({ input: buffer });
  });
}

function showAlert(message: string, type: 'success' | 'danger' | 'warning') {
  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  alertContainer.appendChild(alert);
}
