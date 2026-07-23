import './style.css';

const btnFill = document.querySelector<HTMLButtonElement>('#btn-fill');
const btnScrape = document.querySelector<HTMLButtonElement>('#btn-scrape');
const btnClick = document.querySelector<HTMLButtonElement>('#btn-click');
const statusLog = document.querySelector<HTMLDivElement>('#status-log');

function log(message: string, isError = false) {
  if (!statusLog) return;
  statusLog.textContent = message;
  statusLog.style.color = isError ? '#f87171' : '#cbd5e1';
}

async function sendTabAction(action: string) {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      log('Không tìm thấy tab đang hoạt động', true);
      return;
    }

    log(`Đang gửi lệnh: ${action}...`);
    const response = await browser.tabs.sendMessage(tab.id, { action });

    if (response?.data) {
      log(`[Cào Data Thành công]\nTiêu đề: ${response.data.title}\nSố Input: ${response.data.inputsFound}`);
    } else if (response?.status) {
      log(`[Kết quả]: ${response.status}`);
    } else {
      log('Đã thực thi thành công');
    }
  } catch (err: any) {
    log(`Lỗi: ${err.message || 'Không gửi được message tới trang hiện tại'}`, true);
  }
}

btnFill?.addEventListener('click', () => sendTabAction('AUTO_FILL'));
btnScrape?.addEventListener('click', () => sendTabAction('SCRAPE_DATA'));
btnClick?.addEventListener('click', () => sendTabAction('AUTO_CLICK'));
