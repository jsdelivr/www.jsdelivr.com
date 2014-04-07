BRUNCH=node_modules/.bin/brunch

.PHONY: clean build deploy setup watch

clean:
	rm -rf www

build: clean
	$(BRUNCH) b --production
	cp www/index.html www/404.html
	touch www/.nojekyll

setup:
	npm install

watch: clean
	node_modules/.bin/brunch w -s

deploy: build
	git add --all www
	git commit -am 'Release'
	git subtree push --prefix www origin gh-pages

