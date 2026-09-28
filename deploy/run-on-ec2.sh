#!/usr/bin/env bash
# Runs in GitHub Actions: sends remote-deploy.sh to the EC2 server through
# SSM Run Command, waits for it to finish and prints its output.
set -euo pipefail
: "${INSTANCE_ID:?}" "${IMAGE_TAG:?}"

SCRIPT_B64="$(base64 -w0 "$(dirname "$0")/remote-deploy.sh")"
PARAMETERS="$(jq -n \
  --arg cmd "echo $SCRIPT_B64 | base64 -d | IMAGE_TAG=$IMAGE_TAG bash" \
  '{commands: [$cmd]}')"

COMMAND_ID="$(aws ssm send-command \
  --instance-ids "$INSTANCE_ID" \
  --document-name AWS-RunShellScript \
  --comment "Deploy showroom-backend ${IMAGE_TAG:0:7}" \
  --timeout-seconds 600 \
  --parameters "$PARAMETERS" \
  --query Command.CommandId --output text)"
echo "SSM command id: $COMMAND_ID"

STATUS="Pending"
for _ in $(seq 1 120); do
  sleep 5
  STATUS="$(aws ssm get-command-invocation \
    --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID" \
    --query Status --output text 2>/dev/null || echo Pending)"
  case "$STATUS" in
    Pending|InProgress|Delayed) ;;
    *) break ;;
  esac
done

aws ssm get-command-invocation \
  --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID" \
  --query '[StandardOutputContent, StandardErrorContent]' --output text

echo "Deploy status: $STATUS"
[ "$STATUS" = "Success" ]
