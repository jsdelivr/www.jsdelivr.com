.PHONY: deploy

deploy:
	harp compile
	git add www
	git commit -am 'Release'
	git subtree push --prefix www origin gh-pages
