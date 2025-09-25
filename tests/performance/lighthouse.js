const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs').promises;
const path = require('path');

const THRESHOLDS = {
  performance: 80,
  accessibility: 90,
  'best-practices': 90,
  seo: 90,
  pwa: 70,
};

const PAGES_TO_TEST = [
  { url: 'http://localhost:3000/', name: 'homepage' },
  { url: 'http://localhost:3000/gallery', name: 'gallery' },
  { url: 'http://localhost:3000/auth', name: 'auth' },
  { url: 'http://localhost:3000/docs', name: 'docs' },
];

async function runLighthouse(url, options = {}) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });

  const defaultOptions = {
    logLevel: 'info',
    output: ['json', 'html'],
    port: chrome.port,
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
  };

  const runnerResult = await lighthouse(url, { ...defaultOptions, ...options });

  await chrome.kill();
  return runnerResult;
}

async function auditPage(pageConfig) {
  console.log(`\nAuditing ${pageConfig.name} (${pageConfig.url})...`);

  try {
    const result = await runLighthouse(pageConfig.url);

    if (!result || !result.lhr) {
      throw new Error('No Lighthouse results received');
    }

    const scores = {};
    const categories = result.lhr.categories;

    for (const [key, category] of Object.entries(categories)) {
      scores[key] = Math.round(category.score * 100);
    }

    // Save HTML report
    const reportsDir = path.join(__dirname, 'lighthouse-reports');
    await fs.mkdir(reportsDir, { recursive: true });

    const htmlPath = path.join(reportsDir, `${pageConfig.name}.html`);
    await fs.writeFile(htmlPath, result.report[1]);

    // Save JSON report
    const jsonPath = path.join(reportsDir, `${pageConfig.name}.json`);
    await fs.writeFile(jsonPath, result.report[0]);

    return {
      page: pageConfig.name,
      url: pageConfig.url,
      scores,
      audits: result.lhr.audits,
    };
  } catch (error) {
    console.error(`Error auditing ${pageConfig.name}:`, error.message);
    return {
      page: pageConfig.name,
      url: pageConfig.url,
      error: error.message,
    };
  }
}

async function generateSummaryReport(results) {
  const summary = {
    timestamp: new Date().toISOString(),
    results: results,
    passed: true,
    failures: [],
  };

  // Check thresholds
  for (const result of results) {
    if (result.error) {
      summary.passed = false;
      summary.failures.push({
        page: result.page,
        reason: `Audit failed: ${result.error}`,
      });
      continue;
    }

    for (const [category, threshold] of Object.entries(THRESHOLDS)) {
      const score = result.scores[category];
      if (score < threshold) {
        summary.passed = false;
        summary.failures.push({
          page: result.page,
          category,
          score,
          threshold,
          message: `${category} score (${score}) below threshold (${threshold})`,
        });
      }
    }
  }

  // Save summary
  const summaryPath = path.join(__dirname, 'lighthouse-reports', 'summary.json');
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));

  return summary;
}

function printResults(summary) {
  console.log('\n' + '='.repeat(60));
  console.log('LIGHTHOUSE PERFORMANCE AUDIT RESULTS');
  console.log('='.repeat(60));

  for (const result of summary.results) {
    console.log(`\n${result.page.toUpperCase()} (${result.url})`);
    console.log('-'.repeat(40));

    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
      continue;
    }

    for (const [category, score] of Object.entries(result.scores)) {
      const threshold = THRESHOLDS[category];
      const passed = score >= threshold;
      const symbol = passed ? '✅' : '❌';
      const label = category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ');
      console.log(`${symbol} ${label}: ${score}/100 (threshold: ${threshold})`);
    }
  }

  console.log('\n' + '='.repeat(60));

  if (summary.passed) {
    console.log('✅ ALL PERFORMANCE TESTS PASSED!');
  } else {
    console.log('❌ PERFORMANCE TESTS FAILED!');
    console.log('\nFailures:');
    for (const failure of summary.failures) {
      console.log(`  - ${failure.page}: ${failure.message || failure.reason}`);
    }
  }

  console.log('='.repeat(60));
  console.log(`\nDetailed reports saved to: ${path.join(__dirname, 'lighthouse-reports')}`);
}

async function main() {
  console.log('Starting Lighthouse performance audits...');

  const results = [];

  for (const page of PAGES_TO_TEST) {
    const result = await auditPage(page);
    results.push(result);
  }

  const summary = await generateSummaryReport(results);
  printResults(summary);

  // Exit with error code if tests failed
  if (!summary.passed) {
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runLighthouse, auditPage, THRESHOLDS };