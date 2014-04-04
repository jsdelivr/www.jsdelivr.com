.PHONY: clean build deploy setup watch

clean:
	rm -rf www

build: clean
	node_modules/.bin/brunch b --production

setup:
	npm install

watch:
	rm -rf www
	node_modules/.bin/brunch w -s

deploy:
	rm -rf www
	node_modules/.bin/brunch b
	git add www
	git commit -am 'Release'
	git subtree push --prefix www origin gh-pages
