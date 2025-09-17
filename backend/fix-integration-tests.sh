#!/bin/bash

# Fix integration tests to use API gateway instead of individual workers

cd tests/integration

# Fix badges test
sed -i 's|import badgeWorker from.*|import apiGateway from '\''../../src/workers/api-gateway'\'';|' badges.test.ts
sed -i 's|app = badgeWorker|app = apiGateway|' badges.test.ts
sed -i 's|makeRequest(app, '\''GET'\'', '\''/|makeRequest(app, '\''GET'\'', '\''/api/badges/|g' badges.test.ts
sed -i 's|makeRequest(app, '\''POST'\'', '\''/|makeRequest(app, '\''POST'\'', '\''/api/badges/|g' badges.test.ts
sed -i 's|makeRequest(app, '\''PUT'\'', '\''/|makeRequest(app, '\''PUT'\'', '\''/api/badges/|g' badges.test.ts
sed -i 's|makeRequest(app, '\''DELETE'\'', '\''/|makeRequest(app, '\''DELETE'\'', '\''/api/badges/|g' badges.test.ts

# Fix AI test
sed -i 's|import aiWorker from.*|import apiGateway from '\''../../src/workers/api-gateway'\'';|' ai.test.ts
sed -i 's|app = aiWorker|app = apiGateway|' ai.test.ts
sed -i 's|makeRequest(app, '\''GET'\'', '\''/|makeRequest(app, '\''GET'\'', '\''/api/ai/|g' ai.test.ts
sed -i 's|makeRequest(app, '\''POST'\'', '\''/|makeRequest(app, '\''POST'\'', '\''/api/ai/|g' ai.test.ts

# Fix core test
sed -i 's|import coreWorker from.*|import apiGateway from '\''../../src/workers/api-gateway'\'';|' core.test.ts
sed -i 's|app = coreWorker|app = apiGateway|' core.test.ts
sed -i 's|makeRequest(app, '\''GET'\'', '\''/|makeRequest(app, '\''GET'\'', '\''/api/|g' core.test.ts
sed -i 's|makeRequest(app, '\''POST'\'', '\''/|makeRequest(app, '\''POST'\'', '\''/api/|g' core.test.ts
sed -i 's|makeRequest(app, '\''PUT'\'', '\''/|makeRequest(app, '\''PUT'\'', '\''/api/|g' core.test.ts
sed -i 's|makeRequest(app, '\''DELETE'\'', '\''/|makeRequest(app, '\''DELETE'\'', '\''/api/|g' core.test.ts

# Fix payments test
sed -i 's|import paymentsWorker from.*|import apiGateway from '\''../../src/workers/api-gateway'\'';|' payments.test.ts
sed -i 's|app = paymentsWorker|app = apiGateway|' payments.test.ts
sed -i 's|makeRequest(app, '\''GET'\'', '\''/|makeRequest(app, '\''GET'\'', '\''/api/payments/|g' payments.test.ts
sed -i 's|makeRequest(app, '\''POST'\'', '\''/|makeRequest(app, '\''POST'\'', '\''/api/payments/|g' payments.test.ts

# Fix admin test (uses /admin prefix, not /api/admin)
sed -i 's|import adminWorker from.*|import apiGateway from '\''../../src/workers/api-gateway'\'';|' admin.test.ts
sed -i 's|app = adminWorker|app = apiGateway|' admin.test.ts
sed -i 's|makeRequest(app, '\''GET'\'', '\''/|makeRequest(app, '\''GET'\'', '\''/admin/|g' admin.test.ts
sed -i 's|makeRequest(app, '\''POST'\'', '\''/|makeRequest(app, '\''POST'\'', '\''/admin/|g' admin.test.ts
sed -i 's|makeRequest(app, '\''PUT'\'', '\''/|makeRequest(app, '\''PUT'\'', '\''/admin/|g' admin.test.ts
sed -i 's|makeRequest(app, '\''DELETE'\'', '\''/|makeRequest(app, '\''DELETE'\'', '\''/admin/|g' admin.test.ts

echo "Integration tests fixed!"