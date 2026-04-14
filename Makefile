-include .env
export

.PHONY: dev build preview studio deploy-studio upload-image

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
