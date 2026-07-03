# Branch Protection Setup

## Overview

Branch protection ensures code quality by requiring checks to pass before merging or deploying. This prevents broken code from reaching production.

## Setting Up Branch Protection

### Via GitHub UI

1. Go to: https://github.com/hanzoai/build/settings/branches
2. Click "Add rule" or edit existing rule for `main`
3. Configure these settings:

#### Required Settings ✅

- **Branch name pattern**: `main`
- **Require a pull request before merging**: ✅
  - Dismiss stale pull request approvals when new commits are pushed: ✅
- **Require status checks to pass before merging**: ✅
  - **Required status checks**:
    - `validate` (Quick Validation)
    - `build` (Full Build)
  - Require branches to be up to date before merging: ✅
- **Include administrators**: ✅ (recommended for consistency)

#### Optional Settings

- **Require conversation resolution before merging**: ✅
- **Require signed commits**: ⚠️ (only if team uses GPG signing)
- **Require linear history**: ⚠️ (prevents merge commits)

### Via GitHub CLI

```bash
# Install GitHub CLI if needed
brew install gh  # macOS
# or visit: https://cli.github.com/

# Authenticate
gh auth login

# Create branch protection rule
gh api repos/hanzoai/build/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["validate","build"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"dismiss_stale_reviews":true,"require_code_owner_reviews":false}' \
  --field restrictions=null
```

## How It Works

### Pipeline Flow

```
Push to feature branch
    ↓
Run CI/CD Pipeline
    ↓
1. Validate (REQUIRED) ← Tests must pass
    ├─ Lint (warning only)
    ├─ Type check (warning only)
    ├─ Tests ← BLOCKS if fails
    └─ Build verification ← BLOCKS if fails
    ↓
2. Build (REQUIRED)
    ├─ Full build
    └─ Upload artifacts
    ↓
3. Docker (on main only)
    └─ Build & push image
    ↓
4. Deploy (on main only)
    └─ Deploy to production
    ↓
5. Notify
    └─ Discord/Slack notifications
```

### What Gets Blocked

With protection enabled:

❌ **Cannot merge if**:
- Tests fail
- Build fails
- Required checks haven't run

⚠️ **Warning but can merge if**:
- Linting has issues
- Type checking has errors

✅ **Can always**:
- Push to feature branches
- Create pull requests
- Run local tests

## Testing Your Code

### Before Pushing

```bash
# Run all checks locally
./scripts/pre-push.sh

# Or run individually:
pnpm test           # Run tests
pnpm run build      # Check build
pnpm run validate   # Run all checks
```

### After Pushing

1. Check GitHub Actions: https://github.com/hanzoai/build/actions
2. Look for ✅ or ❌ next to your commit
3. Click to see detailed logs if failed

## Common Scenarios

### "I need to push a hotfix quickly!"

Even hotfixes should pass tests. If truly urgent:

1. Create PR with `[HOTFIX]` in title
2. Tests still run but can be overridden by admin
3. Fix tests in follow-up PR

### "Tests pass locally but fail in CI"

Usually environment differences:

```bash
# Run tests exactly like CI
pnpm run test:ci

# Check Node version
node --version  # Should be v20

# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### "I want to skip CI for documentation"

Add `[skip ci]` to commit message:

```bash
git commit -m "docs: Update README [skip ci]"
```

## Bypass Protection (Emergency Only)

Admins can bypass if absolutely necessary:

```bash
# Force push (requires admin rights)
git push --force-with-lease origin main

# Or temporarily disable protection
gh api repos/hanzoai/build/branches/main/protection \
  --method DELETE
```

⚠️ **Use sparingly and re-enable immediately after!**

## Benefits

1. **No broken deployments** - Tests catch issues before production
2. **Fast feedback** - Know within 2-3 minutes if code is good
3. **Confidence** - Green checks = safe to deploy
4. **Team velocity** - Less time debugging production issues

## Status Badge

Add to README.md:

```markdown
[![CI/CD](https://github.com/hanzoai/build/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/hanzoai/build/actions/workflows/ci-cd.yml)
```

Shows:
- 🟢 Passing
- 🔴 Failing
- 🟡 Running

## Questions?

- Check workflow status: https://github.com/hanzoai/build/actions
- Review this guide
- Check deployment docs: [DEPLOYMENT.md](./DEPLOYMENT.md)