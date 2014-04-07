BRUNCH=node_modules/.bin/brunch
BUILD_DIR=/tmp/beta.jsdelivr.com/production

.PHONY: clean build deploy watch promote

clean:
	rm -rf $(BUILD_DIR)

build: clean
	$(BRUNCH) b --production
	cp $(BUILD_DIR)/index.html $(BUILD_DIR)/404.html
	touch $(BUILD_DIR)/.nojekyll

watch: clean
	$(BRUNCH) w -s

deploy: build
	divshot push

promote:
	divshot promote development production
