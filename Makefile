.PHONY: install update build run check-tsc

install:
	@npm install \
		@nestjs/common @nestjs/core @nestjs/platform-express @nestjs/schedule @nestjs/config \
		@faker-js/faker \
		reflect-metadata rxjs pg dotenv class-validator class-transformer winston nest-winston \
		uuid uuidv7 cls-hooked prom-client js-yaml
	@npm install -D \
		@nestjs/cli @nestjs/schematics @nestjs/testing \
		@types/node @types/pg @types/cls-hooked @types/js-yaml \
		typescript@latest \
		eslint@^9.0.0 @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier \
		jest @types/jest ts-jest

update: install
	@npx npm-check-updates -u --target minor
	@npm install

build: update
	@echo "Building application..."
	@npm run build

run: build
	@echo "Starting application..."
	@node dist/main

check-tsc:
	@npx tsc -v