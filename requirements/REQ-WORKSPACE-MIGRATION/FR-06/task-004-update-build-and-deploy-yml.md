# Task 004: Update GitHub Actions build-and-deploy.yml

> **Applied Skill:** `github-actions-ci-cd-best-practices` — multi-app build, staging assembly, Pages artifact upload, secret injection.

## 1. Objective

Rewrite the `build` job in `.github/workflows/build-and-deploy.yml` to:

1. Inject `BIKE_RENTAL_API` into all three apps' `environment.prod.ts` files.
2. Build `gateway`, `admin`, and `operator` each with their own `--base-href`.
3. Assemble a staging directory:
  - `dist/gateway/browser/` contents → `staging/` root
  - `dist/admin/browser/` → `staging/admin/`
  - `dist/operator/browser/` → `staging/operator/`
4. Add root `index.html` redirect to `/en/`.
5. Add `404.html` for each locale directory of each app.
6. Upload `staging/` as the GitHub Pages artifact.

Update the `test` job's coverage report paths to match the new multi-project layout.

## 2. File to Modify

* **File Path:** `.github/workflows/build-and-deploy.yml`
* **Action:** Modify Existing File

---

## 3. Code Implementation

Replace the entire `build` job (from `build:` through the `Upload Pages artifact` step) and update the `test` job's coverage paths.

### Replace the `build` job

**Find** (entire build job, from the `build:` key through `Upload Pages artifact`):

```yaml
  build:
    name: Build Angular Application
    runs-on: ubuntu-latest
    timeout-minutes: 15
    needs: [ quality, test ]
    steps:
      - name: Checkout code
        uses: actions/checkout@v6
        with:
          fetch-depth: 1

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 24
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Inject Bike Rental API host
        env:
          BIKE_RENTAL_API: ${{ vars.BIKE_RENTAL_API }}
        run: |
          echo "Injecting Bike Rental API host: ${{ env.BIKE_RENTAL_API }}"
          sed -i "s|BIKE_API_PLACEHOLDER|${{ env.BIKE_RENTAL_API }}|g" src/environments/environment.prod.ts

      - name: Build for production
        run: npx ng build --configuration production --base-href /${{ github.event.repository.name }}/

      - name: Create root redirect to /en/
        run: |
          BASE="/${{ github.event.repository.name }}"
          cat > dist/${{ env.PROJECT_NAME }}/browser/index.html << 'HTMLEOF'
          <!doctype html>
          <html lang="en">
            <head>
              <meta charset="utf-8" />
              <title>Bike Rental</title>
              <meta http-equiv="refresh" content="0; url=BASE_PLACEHOLDER/en/" />
              <script>window.location.replace('BASE_PLACEHOLDER/en/');</script>
            </head>
            <body></body>
          </html>
          HTMLEOF
          sed -i "s|BASE_PLACEHOLDER|${BASE}|g" dist/${{ env.PROJECT_NAME }}/browser/index.html

      - name: Add 404.html for SPA routing
        run: |
          cp dist/${{ env.PROJECT_NAME }}/browser/index.html dist/${{ env.PROJECT_NAME }}/browser/404.html
          cp dist/${{ env.PROJECT_NAME }}/browser/en/index.html dist/${{ env.PROJECT_NAME }}/browser/en/404.html
          cp dist/${{ env.PROJECT_NAME }}/browser/ru/index.html dist/${{ env.PROJECT_NAME }}/browser/ru/404.html

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v4
        with:
          path: dist/${{ env.PROJECT_NAME }}/browser
```

**Replace with:**

```yaml
  build:
    name: Build Angular Application
    runs-on: ubuntu-latest
    timeout-minutes: 20
    needs: [ quality, test ]
    steps:
      - name: Checkout code
        uses: actions/checkout@v6
        with:
          fetch-depth: 1

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 24
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Inject Bike Rental API host into all apps
        env:
          BIKE_RENTAL_API: ${{ vars.BIKE_RENTAL_API }}
        run: |
          sed -i "s|BIKE_API_PLACEHOLDER|${BIKE_RENTAL_API}|g" projects/gateway/src/environments/environment.prod.ts
          sed -i "s|BIKE_API_PLACEHOLDER|${BIKE_RENTAL_API}|g" projects/admin/src/environments/environment.prod.ts
          sed -i "s|BIKE_API_PLACEHOLDER|${BIKE_RENTAL_API}|g" projects/operator/src/environments/environment.prod.ts

      - name: Build gateway
        run: npx ng build gateway --configuration production --base-href /${{ github.event.repository.name }}/

      - name: Build admin
        run: npx ng build admin --configuration production --base-href /${{ github.event.repository.name }}/admin/

      - name: Build operator
        run: npx ng build operator --configuration production --base-href /${{ github.event.repository.name }}/operator/

      - name: Assemble staging directory
        run: |
          mkdir -p staging/admin staging/operator
          cp -r dist/gateway/browser/. staging/
          cp -r dist/admin/browser/. staging/admin/
          cp -r dist/operator/browser/. staging/operator/

      - name: Create root redirect to /en/
        run: |
          BASE="/${{ github.event.repository.name }}"
          cat > staging/index.html << 'HTMLEOF'
          <!doctype html>
          <html lang="en">
            <head>
              <meta charset="utf-8" />
              <title>Bike Rental</title>
              <meta http-equiv="refresh" content="0; url=BASE_PLACEHOLDER/en/" />
              <script>window.location.replace('BASE_PLACEHOLDER/en/');</script>
            </head>
            <body></body>
          </html>
          HTMLEOF
          sed -i "s|BASE_PLACEHOLDER|${BASE}|g" staging/index.html

      - name: Add 404.html for SPA routing
        run: |
          # gateway
          cp staging/index.html staging/404.html
          cp staging/en/index.html staging/en/404.html
          cp staging/ru/index.html staging/ru/404.html
          # admin
          cp staging/admin/en/index.html staging/admin/en/404.html
          cp staging/admin/ru/index.html staging/admin/ru/404.html
          # operator
          cp staging/operator/en/index.html staging/operator/en/404.html
          cp staging/operator/ru/index.html staging/operator/ru/404.html

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v4
        with:
          path: staging
```

### Update the `test` job coverage report paths

**Find:**

```yaml
      - name: Publish coverage report to PR
        uses: davelosert/vitest-coverage-report-action@v2
        if: always()
        with:
          threshold-icons: "{0: '🔴', 80: '🔵', 90: '🟢'}"
          json-summary-path: coverage/${{ env.PROJECT_NAME }}/coverage-summary.json
          json-final-path: coverage/${{ env.PROJECT_NAME }}/coverage-final.json

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report
          path: coverage/${{ env.PROJECT_NAME }}/
          retention-days: 30
```

**Replace with:**

```yaml
      - name: Publish coverage report to PR
        uses: davelosert/vitest-coverage-report-action@v2
        if: always()
        with:
          threshold-icons: "{0: '🔴', 80: '🔵', 90: '🟢'}"
          json-summary-path: coverage/coverage-summary.json
          json-final-path: coverage/coverage-final.json

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report
          path: coverage/
          retention-days: 30
```

---

## 4. Validation Steps

```powershell
# Verify the workflow file is valid YAML (requires yq or python)
python -c "import yaml, sys; yaml.safe_load(open('.github/workflows/build-and-deploy.yml')); print('YAML valid')"
```

Expected: `YAML valid`

```powershell
# Verify inject step no longer references the old src/environments path
Select-String -Path .github/workflows/build-and-deploy.yml -Pattern "src/environments/environment.prod.ts"
```

Expected: **no output** (old path removed).

```powershell
# Verify all three apps are built
Select-String -Path .github/workflows/build-and-deploy.yml -Pattern "ng build (gateway|admin|operator)"
```

Expected: 3 matches.
