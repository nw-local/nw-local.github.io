#!/usr/bin/env bash
#
# Prepare images for Sanity upload: convert to JPG, rename with strain slug, check for duplicates.
#
# Usage:
#   make prep-images DIR=path/to/images STRAIN="Strain Name"

set -euo pipefail

DIR="${1:?Usage: prep-images.sh <directory> <strain-name>}"
STRAIN="${2:?Usage: prep-images.sh <directory> <strain-name>}"

if [[ ! -d "$DIR" ]]; then
  echo "Error: directory not found: $DIR" >&2
  exit 1
fi

slugify() {
  echo "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed 's/[_ ]/-/g' \
    | sed 's/[^a-z0-9-]//g' \
    | sed 's/--*/-/g' \
    | sed 's/^-//;s/-$//'
}

SLUG=$(slugify "$STRAIN")
PROCESSED_DIR="${DIR%/}/_processed"

echo "Strain: $STRAIN"
echo "Slug:   $SLUG"
echo "Source: $DIR"
echo "Output: $PROCESSED_DIR"
echo ""

# Find image files (case-insensitive), skip _processed/
IMAGE_EXTENSIONS="heic|heif|png|jpg|jpeg|webp"
IMAGES=()
while IFS= read -r -d '' file; do
  IMAGES+=("$file")
done < <(find "$DIR" -maxdepth 1 -not -path "*/_processed/*" -type f -print0 \
  | grep -ziE "\.(${IMAGE_EXTENSIONS})$" \
  | sort -z)

if [[ ${#IMAGES[@]} -eq 0 ]]; then
  echo "No image files found in $DIR" >&2
  exit 1
fi

echo "Found ${#IMAGES[@]} image(s):"
printf "  %s\n" "${IMAGES[@]}"
echo ""

# Create output directory
mkdir -p "$PROCESSED_DIR"

# Convert and rename
PROCESSED_FILES=()
for img in "${IMAGES[@]}"; do
  BASENAME=$(basename "$img")
  STEM="${BASENAME%.*}"
  STEM_SLUG=$(slugify "$STEM")
  OUTPUT_NAME="${SLUG}-${STEM_SLUG}.jpg"
  OUTPUT_PATH="${PROCESSED_DIR}/${OUTPUT_NAME}"

  EXT_LOWER=$(echo "${BASENAME##*.}" | tr '[:upper:]' '[:lower:]')

  if [[ "$EXT_LOWER" == "jpg" || "$EXT_LOWER" == "jpeg" ]]; then
    echo "Copying $BASENAME → $OUTPUT_NAME"
    cp "$img" "$OUTPUT_PATH"
  else
    echo "Converting $BASENAME → $OUTPUT_NAME"
    sips -s format jpeg -s formatOptions 90 "$img" --out "$OUTPUT_PATH" >/dev/null 2>&1
  fi

  PROCESSED_FILES+=("$OUTPUT_PATH")
done

echo ""
echo "Processed ${#PROCESSED_FILES[@]} file(s) to $PROCESSED_DIR"

echo ""
echo "Checking for duplicates in Sanity..."
echo ""

: "${SANITY_PROJECT_ID:?SANITY_PROJECT_ID is required}"
: "${SANITY_DATASET:?SANITY_DATASET is required}"
: "${SANITY_API_TOKEN:?SANITY_API_TOKEN is required}"

urlencode() {
  python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1]))" "$1"
}

parse_json_field() {
  python3 -c "
import json, sys
data = json.loads(sys.stdin.read())
result = data.get('result')
if result and isinstance(result, dict):
    print(result.get(sys.argv[1], ''))
" "$1"
}

NEW_COUNT=0
DUP_COUNT=0

for file in "${PROCESSED_FILES[@]}"; do
  FILENAME=$(basename "$file")
  HASH=$(shasum "$file" | awk '{print $1}')

  QUERY=$(urlencode "*[_type == \"sanity.imageAsset\" && sha1hash == \"${HASH}\"][0]{_id, label, originalFilename}")

  RESPONSE=$(curl --silent --fail \
    -H "Authorization: Bearer ${SANITY_API_TOKEN}" \
    "https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${SANITY_DATASET}?query=${QUERY}")

  ASSET_ID=$(echo "$RESPONSE" | parse_json_field "_id")

  if [[ -n "$ASSET_ID" ]]; then
    ASSET_LABEL=$(echo "$RESPONSE" | parse_json_field "label")
    echo "  SKIP (duplicate): $FILENAME → already uploaded as $ASSET_ID${ASSET_LABEL:+ ($ASSET_LABEL)}"
    DUP_COUNT=$((DUP_COUNT + 1))
  else
    echo "  NEW: $FILENAME"
    NEW_COUNT=$((NEW_COUNT + 1))
  fi
done

echo ""
echo "Summary: $((NEW_COUNT + DUP_COUNT)) files processed — $NEW_COUNT new, $DUP_COUNT duplicate(s)"
