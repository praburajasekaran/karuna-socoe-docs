```
MACHINE="machineB"; NEW_BRANCH="safe-work-$(date +%F)-$MACHINE"; git remote -v && git fetch --all --prune && git checkout main && git pull --rebase --autostash && git checkout -b "$NEW_BRANCH" && git fetch origin && git rebase origin/main && git push -u origin "$NEW_BRANCH" && echo "✓ Ready on branch: $NEW_BRANCH"

```


```
gh pr create --fill --draft --base main --head "$NEW_BRANCH"

```