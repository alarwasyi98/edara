# Git Workflow — EDARA Project

> This document describes how we manage branches, merge code, and keep our repository history clean. Every contributor — human or AI agent — must follow these rules.

---

## Table of Contents

- [Philosophy](#philosophy)
- [Branch Structure](#branch-structure)
- [The Golden Rule](#the-golden-rule)
- [Workflow: Building a Feature](#workflow-building-a-feature)
- [Workflow: Promoting Dev to Main](#workflow-promoting-dev-to-main)
- [Workflow: Syncing Dev After a Squash Merge](#workflow-syncing-dev-after-a-squash-merge)
- [Understanding the Sync Problem](#understanding-the-sync-problem)
- [Two Sync Methods](#two-sync-methods)
- [Decision Guide](#decision-guide)
- [Common Mistakes](#common-mistakes)

---

## Philosophy

We treat `main` as the production-ready branch. It should always be deployable, and its commit history should read like a changelog — one clean commit per meaningful body of work. We achieve this through **squash merges** from `dev` into `main` via pull requests.

`dev` is the integration branch where all feature work lands first. It accumulates granular commits — the messy, honest history of how things were actually built. That's fine. When we promote `dev` to `main`, we compress that history into a single descriptive commit.

We never push directly to `main`. All changes arrive through pull requests. This is non-negotiable.

---

## Branch Structure

```
main          Production-ready. Clean history. Squash-merged PRs only.
  └── dev     Integration branch. All feature work merges here first.
       ├── feat/auth-flow       Short-lived feature branches
       ├── fix/lint-errors      Short-lived fix branches
       └── chore/update-deps    Short-lived chore branches
```

**Naming conventions for feature branches:**

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feat/` | New feature or capability | `feat/spp-billing` |
| `fix/` | Bug fix | `fix/login-redirect` |
| `chore/` | Maintenance, deps, config | `chore/update-tailwind` |
| `docs/` | Documentation only | `docs/api-reference` |
| `refactor/` | Code restructuring | `refactor/auth-middleware` |

---

## The Golden Rule

> **Every time you squash-merge `dev` into `main`, you must sync `dev` back to `main` immediately.**

This is the single most important rule in our workflow. If you forget this step, the next pull request from `dev` to `main` will show phantom diffs — commits that were already merged appearing as "new" changes. The PR will look enormous even though the actual content difference is zero.

This happens because squash merging creates a brand-new commit on `main` with a different SHA than any commit on `dev`. Git doesn't know that the content is the same. From Git's perspective, `dev` still has dozens of "unmerged" commits, and `main` has a commit that `dev` has never seen.

The sync step resolves this by telling `dev` about the squash commit on `main`.

---

## Workflow: Building a Feature

This is the day-to-day workflow for implementing something new.

### Step 1 — Start from Dev

Always begin by making sure your local `dev` is current:

```bash
git checkout dev
git pull origin dev
```

### Step 2 — Create a Feature Branch

Branch off `dev` with a descriptive name:

```bash
git checkout -b feat/my-feature
```

### Step 3 — Work and Commit

Make your changes. Commit as often as you like — small, frequent commits are encouraged. They make it easier to review, revert, and understand what happened:

```bash
git add .
git commit -m "feat: add payment validation schema"
```

Push your branch to the remote when you're ready for review (or just for backup):

```bash
git push -u origin feat/my-feature
```

### Step 4 — Open a Pull Request to Dev

On GitHub, create a pull request targeting `dev` (not `main`). Describe what the feature does, why it exists, and any decisions you made along the way.

The merge method for feature-to-dev PRs is flexible — regular merge or squash, your choice. The important squash happens later, when `dev` goes to `main`.

### Step 5 — Clean Up

After the PR is merged, delete the feature branch. It has served its purpose, and the commits are preserved in `dev`'s history:

```bash
git branch -d feat/my-feature
git push origin --delete feat/my-feature
```

---

## Workflow: Promoting Dev to Main

When `dev` has accumulated enough work to justify a release (a completed feature, a milestone, a sprint boundary), it's time to bring `main` up to date.

### Step 1 — Make Sure Dev Is Current

```bash
git checkout dev
git pull origin dev
```

### Step 2 — Create the Pull Request

Open a PR from `dev` to `main`. You can do this on GitHub's web interface or via the CLI:

```bash
gh pr create --base main --head dev \
  --title "feat: summary of what this release includes" \
  --body "Describe the changes at a high level."
```

### Step 3 — Squash and Merge

Merge the PR using **squash and merge**. This collapses all of `dev`'s individual commits into a single commit on `main`. The result is a clean, readable history on `main` where each commit represents a meaningful body of work.

```bash
gh pr merge <PR_NUMBER> --squash
```

Or use the GitHub web interface and select "Squash and merge" from the merge button dropdown.

### Step 4 — Sync Dev (Critical)

**Do this immediately.** See the next section for the full explanation and both available methods.

---

## Workflow: Syncing Dev After a Squash Merge

This is the step people forget, and it causes the most confusion. Here's what's happening under the hood and how to fix it.

### What Happens After a Squash Merge

Before the squash merge, the state looks like this:

```
main:  A ← B ← C
dev:   A ← B ← C ← D ← E ← F ← G
```

After squash-merging `dev` into `main`, GitHub creates a single new commit (`S`) that contains the combined changes of D, E, F, and G:

```
main:  A ← B ← C ← S
dev:   A ← B ← C ← D ← E ← F ← G
```

The content of `S` is identical to `G`, but the SHA is completely different. Git sees `dev` as having four commits that `main` doesn't have (D, E, F, G), and `main` as having one commit that `dev` doesn't have (S).

If you open a new PR from `dev` to `main` right now, it will show D, E, F, and G as "new" changes — even though `main` already has all that content via `S`. This is the phantom diff problem.

### The Fix: Sync Dev to Main

You need to tell `dev` about commit `S`. There are two ways to do this.

---

## Two Sync Methods

### Method A — Reset (Clean History)

This replaces `dev`'s history with `main`'s. After this, `dev` and `main` point to the exact same commit. The history is perfectly clean — no extra merge commits, identical SHAs.

```bash
git checkout main
git pull origin main
git checkout dev
git reset --hard main
git push origin dev --force-with-lease
```

**Pros:**
- Perfectly clean history. `dev` and `main` are identical.
- No merge commits cluttering `dev`.

**Cons:**
- Requires a force push. If someone else pushed to `dev` between your squash merge and this reset, their work will be lost.
- Some CI/CD systems or branch protection rules block force pushes.

**When to use:** When you're the only person working on `dev`, or when you've coordinated with your team and no one has pushed new work to `dev` since the squash merge.

### Method B — Merge Main into Dev (Safe)

This creates a merge commit on `dev` that incorporates the squash commit from `main`. The content becomes identical, but `dev` retains its original commit history plus one extra merge commit.

```bash
git checkout main
git pull origin main
git checkout dev
git merge main -m "chore: sync dev with main after PR #N"
git push origin dev
```

**Pros:**
- No force push required. Safe even if others are working on `dev`.
- Works with any branch protection rules.

**Cons:**
- Adds a merge commit to `dev`'s history. Over time, these accumulate.
- `dev` and `main` won't have identical SHAs (but the content is identical).

**When to use:** When force push is blocked, when multiple people work on `dev`, or when you simply want the safest option.

### Verify the Sync

After either method, confirm that the branches have identical content:

```bash
git diff --stat main dev
```

This should produce **no output**. If it shows any files, the sync didn't work correctly.

---

## Decision Guide

```
You just squash-merged dev → main. Now what?

  Can you force-push to dev?
    ├── YES → Method A (reset). Cleaner history.
    └── NO  → Method B (merge main into dev). Safe, adds one merge commit.

  Are other people actively pushing to dev?
    ├── YES → Method B. Always.
    └── NO  → Either method works. Prefer A for cleanliness.

  Does your CI block force pushes?
    ├── YES → Method B.
    └── NO  → Either method works.
```

---

## Common Mistakes

### 1. Forgetting to Sync After Squash Merge

**Symptom:** Your next PR from `dev` to `main` shows hundreds of changed files and dozens of commits, even though you just merged everything.

**Fix:** Sync `dev` to `main` using Method A or B. The phantom diffs will disappear.

### 2. Pushing Directly to Main

**Symptom:** Commits appear on `main` that didn't come through a PR. History becomes unpredictable.

**Fix:** Never do this. All changes to `main` must arrive via pull request. Configure branch protection rules on GitHub to enforce this.

### 3. Long-Running Feature Branches

**Symptom:** Merge conflicts everywhere. The feature branch has drifted so far from `dev` that integrating it becomes a multi-hour ordeal.

**Fix:** Keep feature branches short-lived. Merge into `dev` frequently — per feature, not per sprint. If a feature takes weeks, break it into smaller incremental PRs.

### 4. Not Pulling Before Branching

**Symptom:** Your feature branch is based on stale code. When you open a PR, there are unexpected conflicts.

**Fix:** Always `git pull origin dev` before creating a new branch.

### 5. Letting Dev Drift Far Ahead of Main

**Symptom:** The PR from `dev` to `main` is enormous — hundreds of files, dozens of commits. Reviewing it is impractical.

**Fix:** Promote `dev` to `main` regularly. After each completed feature or at sprint boundaries. Don't wait until "it feels right."

---

## Quick Reference Card

```
DAILY WORK:
  git checkout dev && git pull
  git checkout -b feat/thing
  # ... work, commit, push ...
  # PR: feat/thing → dev (merge)
  # Delete feat/thing

RELEASE TO MAIN:
  git checkout dev && git pull
  # PR: dev → main (squash merge)
  # IMMEDIATELY sync dev:
  #   Method A: git checkout dev && git reset --hard main && git push --force-with-lease
  #   Method B: git checkout dev && git merge main && git push
  # Verify: git diff --stat main dev (should be empty)
```
