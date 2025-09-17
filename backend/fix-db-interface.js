#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to fix
const filesToFix = [
  'src/lib/admin-dashboard.ts',
  'src/lib/localization.ts', 
  'src/lib/student-verification.ts',
  'src/lib/social-features.ts',
  'src/lib/health-insights.ts',
  'src/lib/paywall.ts'
];

function fixDbInterface(filePath) {
  console.log(`Fixing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Pattern 1: this.db.prepare(`query`).get(params) -> this.db.query(`query`, [params])
  content = content.replace(
    /this\.db\.prepare\(`([^`]+)`\)\.get\(([^)]+)\)/g,
    (match, query, params) => {
      return `this.db.query(\`${query}\`, [${params}])`;
    }
  );
  
  // Pattern 2: this.db.prepare(`query`).all(params) -> this.db.query(`query`, [params])
  content = content.replace(
    /this\.db\.prepare\(`([^`]+)`\)\.all\(([^)]+)\)/g,
    (match, query, params) => {
      return `this.db.query(\`${query}\`, [${params}])`;
    }
  );
  
  // Pattern 3: this.db.prepare(`query`).all() -> this.db.query(`query`)
  content = content.replace(
    /this\.db\.prepare\(`([^`]+)`\)\.all\(\)/g,
    'this.db.query(`$1`)'
  );
  
  // Pattern 4: this.db.prepare(`query`).first(params) -> this.db.query(`query`, [params])
  content = content.replace(
    /this\.db\.prepare\(`([^`]+)`\)\.first\(([^)]+)\)/g,
    (match, query, params) => {
      return `this.db.query(\`${query}\`, [${params}])`;
    }
  );
  
  // Pattern 5: this.db.prepare(`query`).first() -> this.db.query(`query`)
  content = content.replace(
    /this\.db\.prepare\(`([^`]+)`\)\.first\(\)/g,
    'this.db.query(`$1`)'
  );
  
  // Pattern 6: this.db.prepare(`query`).run(params) -> this.db.execute(`query`, [params])
  content = content.replace(
    /this\.db\.prepare\(`([^`]+)`\)\.run\(([^)]+)\)/g,
    (match, query, params) => {
      return `this.db.execute(\`${query}\`, [${params}])`;
    }
  );
  
  // Pattern 7: this.db.prepare(`query`).run() -> this.db.execute(`query`)
  content = content.replace(
    /this\.db\.prepare\(`([^`]+)`\)\.run\(\)/g,
    'this.db.execute(`$1`)'
  );
  
  // Pattern 8: this.db.prepare(`query`).bind(params).all() -> this.db.query(`query`, [params])
  content = content.replace(
    /this\.db\.prepare\(`([^`]+)`\)\.bind\(([^)]+)\)\.all\(\)/g,
    (match, query, params) => {
      return `this.db.query(\`${query}\`, [${params}])`;
    }
  );
  
  // Pattern 9: this.db.prepare(`query`).bind(params).first() -> this.db.query(`query`, [params])
  content = content.replace(
    /this\.db\.prepare\(`([^`]+)`\)\.bind\(([^)]+)\)\.first\(\)/g,
    (match, query, params) => {
      return `this.db.query(\`${query}\`, [${params}])`;
    }
  );
  
  // Pattern 10: this.db.prepare(`query`).bind(params).run() -> this.db.execute(`query`, [params])
  content = content.replace(
    /this\.db\.prepare\(`([^`]+)`\)\.bind\(([^)]+)\)\.run\(\)/g,
    (match, query, params) => {
      return `this.db.execute(\`${query}\`, [${params}])`;
    }
  );
  
  // Now fix result handling
  // Pattern 11: result -> (result.results || [])[0] for single results
  content = content.replace(
    /const (\w+) = await this\.db\.query\(`([^`]+)`(?:, \[([^\]]+)\])?\);\s*return (\w+);/g,
    (match, varName, query, params, returnVar) => {
      return `const ${varName} = await this.db.query(\`${query}\`${params ? `, [${params}]` : ''});\n      return (${returnVar}.results || [])[0];`;
    }
  );
  
  // Pattern 12: result -> result.results || [] for array results
  content = content.replace(
    /return (\w+);/g,
    (match, varName) => {
      return `return (${varName}.results || []);`;
    }
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed ${filePath}`);
}

// Fix each file
filesToFix.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    fixDbInterface(fullPath);
  } else {
    console.log(`File not found: ${fullPath}`);
  }
});

console.log('Database interface fixing complete!');
