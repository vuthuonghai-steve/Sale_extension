/**
 * SearchBar Component
 * Ô tìm kiếm từ khóa hỗ trợ Debounce 300ms cho địa chỉ, mã quản lý, và mã tham chiếu tin thô.
 */
export class SearchBar {
  private container: HTMLElement;
  private onSearchCallback: (keyword: string) => void;
  private debounceTimer: number | null = null;
  private debounceMs: number;

  constructor(
    container: HTMLElement,
    onSearch: (keyword: string) => void,
    debounceMs = 300
  ) {
    this.container = container;
    this.onSearchCallback = onSearch;
    this.debounceMs = debounceMs;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="search-bar-wrapper">
        <span class="search-icon">🔍</span>
        <input 
          type="text" 
          id="search-input" 
          class="search-input" 
          placeholder="Tìm địa chỉ, đường, mã QL, mã tin..." 
          autocomplete="off"
        />
        <button id="search-clear-btn" class="search-clear-btn hidden" title="Xóa từ khóa">&times;</button>
      </div>
    `;

    const inputEl = this.container.querySelector<HTMLInputElement>('#search-input');
    const clearBtn = this.container.querySelector<HTMLButtonElement>('#search-clear-btn');

    inputEl?.addEventListener('input', (e) => {
      const val = (e.target as HTMLInputElement).value;
      if (clearBtn) {
        clearBtn.classList.toggle('hidden', !val);
      }
      this.handleInput(val);
    });

    clearBtn?.addEventListener('click', () => {
      if (inputEl) {
        inputEl.value = '';
        clearBtn.classList.add('hidden');
        this.handleInput('');
      }
    });
  }

  private handleInput(value: string): void {
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = window.setTimeout(() => {
      this.onSearchCallback(value.trim());
    }, this.debounceMs);
  }

  public setValue(val: string): void {
    const inputEl = this.container.querySelector<HTMLInputElement>('#search-input');
    const clearBtn = this.container.querySelector<HTMLButtonElement>('#search-clear-btn');
    if (inputEl) {
      inputEl.value = val;
      if (clearBtn) {
        clearBtn.classList.toggle('hidden', !val);
      }
    }
  }
}
