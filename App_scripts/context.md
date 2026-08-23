
## Các cách phát triển Apps Script

### 1. **Web Editor (Google Apps Script IDE)** — Cách truyền thống

- URL: `script.google.com`
- Editor online ngay trong browser
- **Ưu điểm:** Không cần setup, tích hợp sẵn với Google Workspace
- **Nhược điểm:** Không có Git, không có IntelliSense mạnh, khó review code, không có unit test [developers.google](https://developers.google.com/apps-script/guides/clasp)

### 2. **VS Code + CLASP** — Cách chuyên nghiệp (khuyến nghị)

**CLASP** (Command Line Apps Script Projects) là CLI chính chủ của Google, cho phép:

- Dev local trên máy tính
- Dùng VS Code với full extension (Prettier, ESLint, GitLens, AI copilot)
- Sync code lên Google khi ready
- Version control với Git [developers.google](https://developers.google.com/apps-script/guides/clasp)

**Setup:**

```bash
# 1. Cài Node.js + npm
# 2. Cài clasp
npm install -g @google/clasp

# 3. Login vào Google account
clasp login

# 4. Clone project hiện có từ Google về
clasp clone <SCRIPT_ID> --rootDir ./src

# 5. Hoặc tạo project mới
clasp create --title "My Project" --type standalone

# 6. Push code lên Google
clasp push

# 7. Pull code từ Google về
clasp pull
```

**File cấu hình `.clasp.json`:**

```json
{
  "scriptId": "YOUR_SCRIPT_ID",
  "rootDir": "./src"
}
```

**Cấu trúc project mẫu:**

```
my-apps-script-project/
├── .clasp.json
├── src/
│   ├── Code.gs
│   ├── Sidebar.html
│   └── utils.js
├── .gitignore
└── package.json
```

### 3. **Apps Script Starter Kit** — Boilerplate cho VS Code

Đây là template của Amit Agarwal (labnol) với:

- Babel, Webpack, Prettier, ESLint tích hợp sẵn
- Hot reload khi dev
- CI/CD ready [labnol](https://www.labnol.org/internet/google-apps-script-developers/32305)

```bash
git clone https://github.com/labnol/apps-script-starter my-project
cd my-project
npm install
npx clasp login
npx clasp create --title "My Project" --rootDir ./dist --type standalone
```

### 4. **Gitpod / Online IDE**

- Gitpod cung cấp online VS Code environment
- Tích hợp clasp sẵn
- Dev từ browser nhưng vẫn có full VS Code experience [github](https://github.com/google/clasp)

### 5. **AI Copilot Integration**

- CLASP có thể install như extension cho Gemini CLI hoặc Claude Code
- AI hỗ trợ viết code Apps Script ngay trong terminal [github](https://github.com/google/clasp)

***

## Testing & Debugging

### Unit Test

Apps Script không có built-in test framework, nhưng có thể dùng:

- **QUnit** (JavaScript test framework)
- **Custom test runner** với `console.log()` và `Logger.log()`
- **Clasp + Jest** (cho logic thuần JS không gọi Google API) [theappsscriptlab](https://theappsscriptlab.com/google-apps-script-in-vs-code-with-clasp-local-dev-git-and-ci-cd-the-right-way/)

```javascript
// test.gs
function testNormalizeData() {
  const input = { textData: 'Name: John', phone: '0901234567' };
  const expected = { driver_name: 'John', driver_phone: '0901234567' };
  const result = normalizeData(input);
  
  if (JSON.stringify(result) === JSON.stringify(expected)) {
    Logger.log('✅ Test passed');
  } else {
    Logger.log('❌ Test failed');
  }
}
```

### Debugging

- **Web editor:** Dùng `Logger.log()` và xem Execution History
- **VS Code:** Dùng `console.log()` → push lên → xem logs trên Google
- **Chrome DevTools:** Nếu có HTML sidebar, debug như web app thường

***

## So sánh các cách tiếp cận

| Tiêu chí | Web Editor | VS Code + CLASP |
| ---------- | ----------- | ----------------- |
| Setup | Không cần | Cần Node.js + clasp |
| IntelliSense | Cơ bản | Full (với extension) |
| Git version control | ❌ Không | ✅ Hoàn toàn được |
| AI copilot (Cursor, Copilot) | ⚠️ Giới hạn | ✅ Full support |
| Unit testing | ⚠️ Khó | ✅ Dễ (Jest, QUnit) |
| CI/CD | ❌ Không | ✅ Được (GitHub Actions) |
| Debug HTML sidebar | ✅ Được | ✅ Được (browser DevTools) |
| Offline development | ❌ Không | ✅ Được |

***

## Khuyến nghị cho bạn

Vì bạn là developer quen terminal và text editor, **VS Code + CLASP** là lựa chọn tối ưu:

1. Cài `@google/clasp` global
2. Dùng VS Code với extensions:
   - Prettier
   - ESLint
   - GitLens
   - AI copilot (Cursor, Continue, etc.)
3. Setup `.clasp.json` để sync với Google
4. Dùng Git để version control
5. Test logic thuần với Jest, test Google API với custom test runner

Bạn hoàn toàn có thể dev như một project JavaScript bình thường, chỉ khác là deploy lên Google thay vì Node.js server. [developers.google](https://developers.google.com/apps-script/guides/clasp)
