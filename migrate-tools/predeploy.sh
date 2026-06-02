#!/bin/sh
# Instrumented pre-deploy command (temporary diagnostic build).
# Emits timestamped [PREDEPLOY] markers so a failed Railway pre-deploy can be
# localized in the Deploy Logs: start -> cd -> env presence -> TCP reachability
# to the DB -> migrate deploy -> exit code. The final `exit $rc` propagates the
# migrate result so a failure ABORTS the deploy (PROD stays on the current
# release) instead of shipping with migrations unapplied.
log() { echo "[PREDEPLOY $(date -Iseconds 2>/dev/null)] $*"; }

log "start"
cd /app/migrate-tools || { log "cd FAIL"; exit 1; }
log "cd ok"
log "DIRECT_URL set: ${DIRECT_URL:+yes}"
if [ -z "$DIRECT_URL" ]; then
  log "DIRECT_URL EMPTY - skipping tcp"
else
  log "testing TCP to db..."
  node -e 'const u=new URL(process.env.DIRECT_URL);const s=require("net").connect(+u.port||5432,u.hostname);const t=setTimeout(()=>{console.log("[PREDEPLOY] tcp TIMEOUT");process.exit(1)},10000);s.on("connect",()=>{clearTimeout(t);console.log("[PREDEPLOY] tcp ok");process.exit(0)}).on("error",e=>{clearTimeout(t);console.log("[PREDEPLOY] tcp FAIL",e.message);process.exit(1)})'
  log "tcp test exited $?"
fi
log "running migrate deploy..."
./node_modules/.bin/prisma migrate deploy
rc=$?
log "done=$rc"
exit $rc
