#!/bin/bash

# 保存当前分支
current_branch=$(git branch --show-current)

# 创建备份分支
git branch backup-${current_branch} 2>/dev/null || true

# 使用 filter-branch 修改 commit messages
git filter-branch -f --msg-filter '
if [ "$GIT_COMMIT" = "d2903705" ]; then
    echo "feat(multimodal): add persistent browser profile support"
elif [ "$GIT_COMMIT" = "a908ccfc" ]; then
    echo "docs(multimodal): add documentation"
elif [ "$GIT_COMMIT" = "b571ec5f" ]; then
    echo "feat(multimodal): add line number display in logger"
else
    cat
fi
' HEAD~4..HEAD

echo "Commit messages updated successfully!"