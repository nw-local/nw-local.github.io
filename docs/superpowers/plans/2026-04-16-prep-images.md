# prep-images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `make prep-images` target that converts images to JPG, renames them with SEO-friendly strain-slug prefixes, and checks for duplicates against Sanity before upload.

**Architecture:** A single bash script (`scripts/prep-images.sh`) handles conversion, renaming, and dedup. It uses `sips` for format conversion, `shasum` for hashing, and `curl` + `python3` for querying Sanity's asset API. The Makefile gets a new `prep-images` target, and the `/new-strain` skill is updated to suggest using it.

**Tech Stack:** Bash, sips (macOS), shasum, curl, python3, Sanity GROQ API

---

### Task 1: Create `scripts/prep-images.sh` — argument parsing and slugify

**Files:**
- Create: `scripts/prep-images.sh`

- [ ] **Step 1: Create the script with argument parsing and slugify function**

```bash
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
```

- [ ] **Step 2: Make it executable and test argument parsing**

Run:
```bash
chmod +x scripts/prep-images.sh
./scripts/prep-images.sh /tmp "Donny Burger"
```

Expected output:
```
Strain: Donny Burger
Slug:   donny-burger
Source: /tmp
Output: /tmp/_processed
```

- [ ] **Step 3: Test error cases**

Run:
```bash
./scripts/prep-images.sh 2>&1 || true
./scripts/prep-images.sh /nonexistent "Test" 2>&1 || true
```

Expected: Both print error messages and exit non-zero.

- [ ] **Step 4: Commit**

```bash
git add scripts/prep-images.sh
git commit -m "feat: add prep-images script with arg parsing and slugify"
```

---

### Task 2: Add image discovery and conversion

**Files:**
- Modify: `scripts/prep-images.sh`

- [ ] **Step 1: Add image discovery and conversion logic**

Append the following to `scripts/prep-images.sh` (after the echo statements):

```bash
# Find image files (case-insensitive), skip _processed/
IMAGE_EXTENSIONS="heic|heif|png|jpg|jpeg|webp"
IMAGES=()
while IFS= read -r -d '' file; do
  IMAGES+=("$file")
done < <(find "$DIR" -maxdepth 1 -not -path "*/_processed/*" -type f \
  | grep -iE "\.(${IMAGE_EXTENSIONS})$" \
  | sort -z \
  | tr '\n' '\0')

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
```

- [ ] **Step 2: Test with a sample directory**

Run:
```bash
mkdir -p /tmp/test-prep-images
# Create a test PNG
sips -s format png /System/Library/Desktop\ Pictures/*.heic --out /tmp/test-prep-images/hero.png 2>/dev/null || \
  printf '\x89PNG\r\n\x1a\n' > /tmp/test-prep-images/hero.png
./scripts/prep-images.sh /tmp/test-prep-images "Test Strain"
ls /tmp/test-prep-images/_processed/
```

Expected: `test-strain-hero.jpg` exists in `_processed/`.

- [ ] **Step 3: Commit**

```bash
git add scripts/prep-images.sh
git commit -m "feat: add image discovery and conversion to prep-images"
```

---

### Task 3: Add dedup checking via Sanity API

**Files:**
- Modify: `scripts/prep-images.sh`

- [ ] **Step 1: Add dedup logic**

Append the following to `scripts/prep-images.sh` (after the "Processed N file(s)" echo):

```bash
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
    ((DUP_COUNT++))
  else
    echo "  NEW: $FILENAME"
    ((NEW_COUNT++))
  fi
done

echo ""
echo "Summary: $((NEW_COUNT + DUP_COUNT)) files processed — $NEW_COUNT new, $DUP_COUNT duplicate(s)"
```

- [ ] **Step 2: Test dedup with a known uploaded image**

Run from the project root (so `.env` is available):
```bash
source .env && ./scripts/prep-images.sh "/Users/benny/Library/CloudStorage/Dropbox/Northwest Local Cannabis/Strains/Donnie Burger" "Donny Burger"
```

Expected: The hero image we uploaded earlier should show as `SKIP (duplicate)`.

- [ ] **Step 3: Commit**

```bash
git add scripts/prep-images.sh
git commit -m "feat: add Sanity dedup checking to prep-images"
```

---

### Task 4: Add Makefile target

**Files:**
- Modify: `Makefile`

- [ ] **Step 1: Add the prep-images target**

Add to the `.PHONY` line and add the target after `upload-image`:

In the `.PHONY` line, add `prep-images`:
```makefile
.PHONY: dev build preview studio deploy-studio upload-image prep-images lint format
```

Add the target after `upload-image`:
```makefile
prep-images:
	@./scripts/prep-images.sh "$(DIR)" "$(STRAIN)"
```

- [ ] **Step 2: Test via make**

Run:
```bash
make prep-images DIR="/Users/benny/Library/CloudStorage/Dropbox/Northwest Local Cannabis/Strains/Donnie Burger" STRAIN="Donny Burger"
```

Expected: Same output as running the script directly — conversion, renaming, dedup summary.

- [ ] **Step 3: Commit**

```bash
git add Makefile
git commit -m "feat: add prep-images make target"
```

---

### Task 5: Update `/new-strain` skill

**Files:**
- Modify: `.claude/skills/new-strain/skill.md`

- [ ] **Step 1: Update step 5 (image prompting) to suggest prep-images**

Replace the current step 5 content with:

```markdown
5. **Prompt for images:**
   - Ask if the user has a **directory** of images or **individual file paths**
   - **If directory:** suggest running `make prep-images DIR="<path>" STRAIN="<name>"` first
     - Show the output (conversion results + dedup check)
     - For each NEW (non-duplicate) file in `_processed/`, proceed to upload via `make upload-image`
     - Skip any files flagged as duplicates
   - **If individual files:** proceed directly to upload
   - Hero image (optional — ask user for a file path)
     - **Clearly state the recommended dimensions: landscape 4:3, minimum 1200×900**
     - Explain that portrait images will be cropped on the strain page
   - Gallery images (optional — ask user for file paths, any aspect ratio is fine)
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/new-strain/skill.md
git commit -m "feat: update new-strain skill to suggest prep-images for directories"
```
