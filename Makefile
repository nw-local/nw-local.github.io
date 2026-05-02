-include .env
export

.PHONY: install dev build preview studio deploy-studio upload-image prep-images lint format

install:
	yarn install
	cd studio && yarn install

dev:
	yarn dev

build:
	yarn build

preview:
	yarn preview

studio:
	cd studio && npx sanity dev

deploy-studio:
	cd studio && npx sanity deploy

upload-image:
	@./scripts/upload-image.sh "$(FILE)" "$(LABEL)" "$(DESCRIPTION)"

prep-images:
	@./scripts/prep-images.sh "$(DIR)" "$(STRAIN)" "$(RENAME)"

lint:
	yarn lint

format:
	yarn format

# Upgrade dependencies to their latest minor/patch versions, respecting the
# tilde (~) ranges in package.json. Safe for routine maintenance — will not
# introduce breaking major-version changes.
upgrade:
	-@yarn outdated
	@yarn upgrade --tilde

# Upgrade dependencies to their absolute latest versions, ignoring semver
# ranges in package.json entirely. Use when intentionally adopting major
# version bumps. Review the `yarn outdated` output before and after carefully.
upgrade-latest:
	-@yarn outdated
	@yarn upgrade --latest
	-@yarn outdated
