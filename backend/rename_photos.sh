#!/usr/bin/env bash
# Run from backend/, or adjust ENROLLMENT_DIR below.
set -e
cd "$(dirname "$0")"
ENROLLMENT_DIR="data/enrollment_photos"

declare -A MAP=(
  [aashik]=234122
  [anamika]=231502
  [ananda]=234102
  [anjana]=231503
  [anushka]=234103
  [christina]=234104
  [kritika]=231516
  [lasta]=234106
  [lokesh]=234123
  [roshani]=231529
  [dip]=231512
  [shushant]=234120
  [suhana]=231535
  [puspa]=234111
)

for old in "${!MAP[@]}"; do
  new="${MAP[$old]}"
  if [ -d "$ENROLLMENT_DIR/$old" ]; then
    mv -v "$ENROLLMENT_DIR/$old" "$ENROLLMENT_DIR/$new"
  else
    echo "WARNING: $ENROLLMENT_DIR/$old not found, skipping"
  fi
done

echo "Done. Now re-run: uv run python -m src.enroll_all   (or your usual enroll command)"
echo "to regenerate data/known_embeddings.pkl with the new CRN keys."
