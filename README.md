# Economic Conditions · v1.1.1

An installable, read-only economic dashboard covering conditions during U.S. presidential terms. Uses public FRED CSV downloads; no API key, Python packages, account, or paid backend required. No attribution of causation and no composite partisan score.

## Features

16 indicators across jobs/pay, household costs, economy/finances, and optional price/debt details. Cards have observation dates, baseline changes, five-year trend charts, and source links. Compare latest/end-of-term values or the same elapsed point in a term. Latest five terms appear by default; all historical terms remain available. Each four-year term is separate. Select the focus term and category using the controls. Settings gear contains installation help and JSON snapshot export.

## Version 1.1.0 changes

Cards and historical table now show Better / Worse / Little changed / Context needed, with words and numerical arrows as well as green/red/neutral colors. Cards separate inherited-level comparisons from recent direction. Recent direction compares the latest observation with 3 months earlier (monthly), 13 weeks earlier (weekly), the previous quarter, or previous fiscal year; both dates are displayed and the window can cross inauguration. Little changed is less than 0.1 percentage point for rates or 0.5% for levels; this is a display threshold, not a significance test. Missing comparisons remain unavailable. Use Same point in each term to compare equal durations.

## Run locally on Windows

Install Python 3, extract this entire folder, and double-click `run_dashboard.bat`. The launcher downloads observations, starts a loopback-only server, and opens http://localhost:8000. Keep the terminal open while using it; Ctrl+C stops the server. Python must be on PATH. Do not double-click index.html: local file URLs do not support this app's fetch/service-worker behavior. The old dashboard.html filename redirects to index.html.

On any Python-supported computer: `python econ.py`, then `python -m http.server 8000 --bind 127.0.0.1` in this folder.

## Publish to GitHub Pages

1. Create a dedicated repository, suggested name `economic-conditions`. Use `main` as the default branch. A public repository makes its contents and deployed data public. This package contains public economic data only.
2. Commit the **contents** of this folder at the repository root, including `.github/workflows/publish.yml` (hidden folders can be missed by manual upload). A git push is the most reliable way to include everything.
3. Repository Settings → Pages → Build and deployment → Source: GitHub Actions.
4. Actions → Refresh and publish dashboard → Run workflow. Allow the workflow to write repository contents if organization/repository policy requires it.
5. Open the URL reported by the successful deployment. Live URL: https://markz68.github.io/economic-conditions/ (deployment and public assets verified October 28, 2026).

The workflow runs on main-branch pushes, manual dispatch, and daily at 15:23 UTC (11:23 AM Eastern daylight time / 10:23 AM Eastern standard time). Scheduled runs can be delayed; GitHub can disable schedules in inactive public repositories. The page explicitly displays the snapshot attempt and per-series retrieval dates. Check GitHub's current Actions/Pages usage limits for your account.

Python runs on GitHub, not on a visitor's device. It preserves each prior successful series if an update fails, saves data.json to the repository, and deploys only public app assets. If no series has ever succeeded, the refresh fails. A partially failed refresh publishes retained observations with visible warnings. Refreshing the app downloads the published snapshot; it does not invoke FRED or the workflow.

## Install and offline use

Visit the HTTPS URL online first. In Chrome/Edge use the Install app option; in iPhone Safari use Share → Add to Home Screen. Browser installation UI varies. After a successful initial service-worker cache, the interface and most recent cached data work offline. Data requires a connection to update. The service worker tries the network first; old assets are retained for offline fallback. A newly installed worker activates after older app windows close. Close/reopen all app windows after releases if necessary. Bump the app version, service-worker cache version, and README together on releases.

## Data and methodology

- Latest-revised historical data, not original publication vintages. Download coverage begins in January 1999.
- Monthly baselines use December before inauguration; quarterly baselines use Q4; weekly baselines use the last observation before inauguration; annual fiscal baselines use the last fiscal year ending before inauguration.
- Monthly and quarterly points are included only after their full period ends. Source timestamps for quarterly data indicate quarter start; annual fiscal timestamps indicate year label, interpreted as September 30. Endpoints stop before the next inauguration and never extend beyond today's UTC date. This is an economic-period convention, not “information known on inauguration day.”
- Same-point comparisons use elapsed calendar days from the selected term's start, capped at its duration. Different frequencies still yield different final observation dates. Cards and table show actual dates and baseline periods.
- Inflation compares exact matching months twelve months apart. Cumulative CPI price change is measured against each term baseline. Lower inflation does not mean falling prices. Rates show changes in percentage points; level measures show percentage changes. Badges show generally favorable changes vs each term’s inherited baseline: higher employment, jobs, real earnings and income; lower unemployment, grocery/shelter inflation, borrowing costs, individual prices, debt burdens and fiscal ratios. Overall inflation and GDP growth say Context needed. Cumulative prices use higher/lower wording. These are not causal claims or an overall score. Fiscal badges include context cautions.
- GDP growth is quarterly annualized, not cumulative growth. Payroll levels are thousands in the source and converted to jobs for display. Real weekly earnings are source constant dollars; real disposable income is source chained dollars at an annual rate per person. Dollar bases can change with source revisions; inspect the linked FRED metadata when comparing to other reports.
- Gross federal debt/GDP is not debt held by the public. Fiscal deficit/GDP reverses FRED's surplus-positive convention so deficits are positive; surpluses negative. Fiscal years straddle presidential terms. Annual fiscal observations are supplementary context, not a precise administration scorecard.
- Charts show up to five years ending at the comparison cutoff, which can include the previous term. A snapshot older than three days is flagged; this is retrieval age, not a claim that monthly/quarterly observations are overdue.
- Missing or failed data is never replaced by invented inauguration values. A failed download retains the previous successful series and retrieval timestamp with a warning.

Series IDs and categories are in `econ.py` (SPECS). Series pages link to original publishers and definitions. See FRED terms of use and each source's notices before redistributing data beyond this dashboard.

## Future administrations

Edit `terms.json` to add the confirmed administration's name and dates, keeping chronological order. The app chooses eligible terms by date, defaults to the latest five, and keeps all history. After the configured final term ends it displays a configuration warning; future winners are never guessed. History is not deleted. To revise term dates for an unexpected succession, update configuration carefully and test baselines. Combined eight-year presidency comparisons and arbitrary custom comparison sets are not included in v1.1.1.

## Privacy, settings, export

No analytics or account. Only history mode, comparison mode, and selected focus term are saved in this browser's `economic-conditions.preferences.v1` localStorage key. Public observations and app assets are stored in service-worker cache. There is no cloud synchronization or personal record storage. Settings → Export data snapshot downloads the read-only observations as JSON. There is no restore/import feature; official data is regenerated from FRED. Browser preferences are small and can be selected again. Original uploaded files are not overwritten by this separate project, and the original embedded API key is excluded.

## Validation and troubleshooting

Run `node test.cjs` for date/transform regression checks; `node --check app.js` and `node --check sw.js` for syntax. If data fails to load, use localhost or HTTPS, connect to the internet, and retry. For failed scheduled updates inspect Actions logs and the per-series warning. On Windows a Python-not-found error means Python is absent or not on PATH. Avoid running another server on port 8000.

This release has fetched all 15 distinct source series successfully and passed calculation and syntax checks. Automated visual/offline browser tests could not run because the test browser download failed in the build environment. Mobile appearance and offline behavior remain unverified. GitHub Pages deployment and HTTP availability of the dashboard, scripts, manifest, data, terms, and icons were verified October 28, 2026. All 15 series refreshed successfully on GitHub. Real-device installation and installed-app upgrade behavior remain unverified.
