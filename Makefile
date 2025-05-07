LAMBDA_DIR=lambda
DIST_DIR=dist
ZIP_NAME=function.zip

.PHONY: build zip zip-prune zip-package plan apply clean test-local test-local-start test-local-stop

install-node-modules:
	cd $(LAMBDA_DIR) && npm install

build: install-node-modules
	cd $(LAMBDA_DIR) && node build.mjs

zip: clean zip-prune zip-package

zip-prune: build
	cd $(LAMBDA_DIR) && npm prune  --omit=dev

$(DIST_DIR)/package:
	mkdir -p $(DIST_DIR)/package

zip-package: $(DIST_DIR)/package
	cp $(DIST_DIR)/*.js $(DIST_DIR)/package/
	cd $(DIST_DIR)/package && zip -r ../../$(ZIP_NAME) .

plan:
	cd terraform && terraform plan

apply:
	cd terraform && terraform apply

destroy:
	cd terraform && terraform destroy

test-local-%: build
	node $(DIST_DIR)/testLocal.js ${@:test-local-%=%}

clean:
	rm -rf $(DIST_DIR) $(ZIP_NAME)
