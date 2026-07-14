# Hanzo App — AI web & app builder
.PHONY: help install dev build start lint format test clean
.DEFAULT_GOAL := help

help:
	@echo "Hanzo App — AI web & app builder"
	@echo ""
	@echo "  install   Install dependencies"
	@echo "  dev       Start the dev server (http://localhost:3000)"
	@echo "  build     Build for production"
	@echo "  start     Serve the production build"
	@echo "  lint      Run ESLint"
	@echo "  format    Format with Prettier"
	@echo "  test      Run tests"
	@echo "  clean     Remove build output and caches"

install:
	npm install

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

lint:
	npm run lint

format:
	npm run format

test:
	npm test

clean:
	rm -rf .next node_modules/.cache
