.PHONY: clean build deploy setup watch

clean:
	rm -rf www

build: clean
	node_modules/.bin/brunch b --production

setup:
	npm install

watch: clean
	node_modules/.bin/brunch w -s

deploy: build
	cp www/index.html www/404.html
	touch www/.nojekyll
	git add --all www
	git commit -am 'Release'
	git subtree push --prefix www origin gh-pages

