/**
 * Automated Test Runner for Zalo Quick Action Text Filtering
 * Chạy kiểm thử tự động toàn bộ Mock Test Cases để chống Regression.
 * Cách chạy: node tests/run-tests.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bgGreen: '\x1b[42m\x1b[30m',
  bgRed: '\x1b[41m\x1b[37m'
};

function runTestSuite() {
  console.log(`\n${colors.cyan}${colors.bright}========================================================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}  🧪 ZALO QUICK ACTION - REGEX REGRESSION TEST SUITE  🧪${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}========================================================================${colors.reset}\n`);

  // 1. Tạo VM Context mô phỏng trình duyệt (window, globalThis)
  const sandbox = {
    window: {},
    globalThis: {},
    console: console
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);

  // 2. Nạp config/filter-rules.js
  const filterRulesPath = path.resolve(__dirname, '../config/filter-rules.js');
  const filterRulesCode = fs.readFileSync(filterRulesPath, 'utf8');
  vm.runInContext(filterRulesCode, sandbox);

  // 3. Nạp content/content-text.js
  const contentTextPath = path.resolve(__dirname, '../content/content-text.js');
  const contentTextCode = fs.readFileSync(contentTextPath, 'utf8');
  vm.runInContext(contentTextCode, sandbox);

  // 4. Nạp tests/mock-cases.js
  const mockCasesPath = path.resolve(__dirname, 'mock-cases.js');
  const loadedCases = require(mockCasesPath);
  const mockCases = typeof loadedCases === 'function' ? loadedCases() : loadedCases;

  const textService = sandbox.window.ZaloQuickActionText;
  if (!textService || typeof textService.removeSelectiveMetadata !== 'function') {
    console.error(`${colors.red}❌ Error: ZaloQuickActionText.removeSelectiveMetadata not found in sandbox!${colors.reset}`);
    process.exit(1);
  }

  let passedCount = 0;
  let failedCount = 0;

  mockCases.forEach((tc, index) => {
    const actual = textService.removeSelectiveMetadata(tc.input);
    const isPass = actual === tc.expected;

    if (isPass) {
      passedCount++;
      console.log(`  ${colors.green}✔ [PASS]${colors.reset} ${colors.bright}${tc.id}${colors.reset}: ${tc.name}`);
    } else {
      failedCount++;
      console.log(`\n  ${colors.red}✖ [FAIL]${colors.reset} ${colors.bright}${tc.id}${colors.reset}: ${tc.name}`);
      console.log(`    ${colors.yellow}Phân loại:${colors.reset} ${tc.category}`);
      console.log(`    ${colors.gray}--- INPUT ---${colors.reset}\n${tc.input.split('\n').map(l => '      ' + l).join('\n')}`);
      console.log(`    ${colors.red}--- EXPECTED ---${colors.reset}\n${tc.expected.split('\n').map(l => '      ' + l).join('\n')}`);
      console.log(`    ${colors.yellow}--- ACTUAL ---${colors.reset}\n${actual.split('\n').map(l => '      ' + l).join('\n')}`);
      console.log(`    ${colors.gray}----------------------------------------------------------------${colors.reset}\n`);
    }
  });

  console.log(`\n${colors.cyan}------------------------------------------------------------------------${colors.reset}`);
  console.log(`${colors.bright}Test Summary:${colors.reset}`);
  console.log(`  Total Cases: ${mockCases.length}`);
  console.log(`  ${colors.green}Passed:      ${passedCount}${colors.reset}`);
  console.log(`  ${colors.red}Failed:      ${failedCount}${colors.reset}`);
  console.log(`${colors.cyan}------------------------------------------------------------------------${colors.reset}`);

  if (failedCount === 0) {
    console.log(`\n${colors.bgGreen} 🎉 ALL ${passedCount} TEST CASES PASSED 100%! NO REGRESSION DETECTED! 🎉 ${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.bgRed} ❌ ${failedCount} TEST CASES FAILED! PLEASE FIX REGEX PATTERNS! ❌ ${colors.reset}\n`);
    process.exit(1);
  }
}

runTestSuite();
