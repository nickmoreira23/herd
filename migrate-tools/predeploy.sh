#!/bin/sh
# Production pre-deploy command. Railway's preDeployCommand executor does NOT
# treat an inline `cd X && Y` as a shell command (it fails with no output —
# observed on deploys d47c70ca/#122 and 51511ea9), so the migrate must run from
# an actual script invoked as `sh predeploy.sh`. `exec` replaces the shell so
# the prisma exit code propagates → a failed migration aborts the deploy
# (PROD stays on the current release).
cd /app/migrate-tools
exec ./node_modules/.bin/prisma migrate deploy
