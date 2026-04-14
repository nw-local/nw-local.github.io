-include .env
export

.PHONY: dev build preview studio deploy-studio

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
