.PHONY: deploy setup watch

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
