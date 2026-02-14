.PHONY: install update build run check-tsc

install:
	@npm install --legacy-peer-deps \
		@nestjs/common @nestjs/core @nestjs/platform-express @nestjs/schedule @nestjs/config \
		@faker-js/faker \
		reflect-metadata rxjs pg dotenv class-validator class-transformer winston nest-winston \
		uuid uuidv7 cls-hooked prom-client js-yaml

	@npm install -D --legacy-peer-deps \
		@nestjs/cli @nestjs/schematics @nestjs/testing \
		@types/node @types/pg @types/cls-hooked @types/js-yaml \
		typescript@latest \
		eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier \
		jest @types/jest ts-jest

update:
	@echo "Updating dependencies..."
	@npx npm-check-updates -u
	@npm install --legacy-peer-deps
	@npm install -D --legacy-peer-deps

build: update
	@echo "Building application..."
	@npm run build

run: build
	@echo "Starting application..."
	@node dist/main

check-tsc:
	@npx tsc -v