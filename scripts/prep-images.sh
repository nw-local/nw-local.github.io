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
