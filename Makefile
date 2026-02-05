.PHONY: install update build run

install:
	@npm install \
		@nestjs/common @nestjs/core @nestjs/platform-express @nestjs/config  @nestjs/schedule @nestjs/config \
		@typescript-eslint/parser@latest @typescript-eslint/eslint-plugin@latest \
		@faker-js/faker \
		reflect-metadata rxjs pg dotenv class-validator class-transformer winston nest-winston uuid uuidv7 cls-hooked prom-client js-yaml
	@npm install -D \
		@nestjs/cli @nestjs/schematics \
		@types/node @types/pg @types/node @types/cls-hooked @types/js-yaml \
		typescript@latest \

update: install
	@npx npm-check-updates -u

build:
	@echo "Building application..."
	@npm run build

run: build
	@echo "Starting application..."
	@node dist/main

check-tsc:
	@npx tsc -v