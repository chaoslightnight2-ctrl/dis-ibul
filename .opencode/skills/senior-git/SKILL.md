---
name: senior-git
description: Use when asked about git operations, branching strategy, commit hygiene, or resolving merge conflicts. Triggers on: "git", "branch", "commit", "merge", "rebase", "conflict", "PR", "pull request", "git flow".
---

# Senior Git Workflow Guide

## Commit Hygiene
- **Atomic commits**: one logical change per commit
- **Commit message format**:
  ```
  type(scope): short description (max 50 chars)
  
  Body explains WHAT and WHY (not HOW). Wrap at 72 chars.
  
  - Bullet points for multiple motivations
  - Reference issues: Fixes #123
  ```
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `style`
- Descriptive commit messages for ALL commits, not just PR titles
- Squash "fixup" / "wip" commits before merging

## Branch Strategy
- `main` — production-ready, protected, no direct pushes
- `feat/description` — feature branches from main
- `fix/description` — bug fix branches
- No long-lived branches: merge or rebase frequently
- Delete branches after merging

## Pull Request Best Practices
- **Small PRs**: < 400 lines of code for easier review
- Description: context, motivation, testing notes, screenshots if UI change
- Self-review before requesting review
- Respond to all review comments (resolve or discuss)
- Rebase onto target branch before merging (clean linear history)

## Conflict Resolution
```bash
# Rebasing (preferred for feature branches)
git rebase main          # replay your commits on top of main
git rebase --continue    # after resolving conflicts
git rebase --abort       # if things go wrong

# Merging (use for shared branches)
git merge main
# Resolve conflicts, then git commit (no --continue needed)
```

## Investigating History
```bash
git log --oneline --graph -20         # recent history visually
git log --all --oneline --graph       # full picture
git blame file.ts                     # who changed what, when
git log -S "searchTerm"               # find commits that changed this string
git bisect start HEAD v1.0            # binary search for bug introduction
git show <hash>                       # see full commit details
```

## Stashing & Cleanup
```bash
git stash push -m "wip: description"  # save work in progress
git stash list                         # list stashes
git stash pop                          # restore and remove latest
git clean -fd                          # remove untracked files
git reset --soft HEAD~1                # undo commit, keep changes staged
```
