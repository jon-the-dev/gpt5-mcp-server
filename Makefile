.PHONY: install build test check dev lint clean

install:
	pnpm install

build:
	pnpm build

test:
	pnpm test

check:
	pnpm check

dev:
	pnpm dev

lint:
	pnpm lint

clean:
	rm -rf dist
