terraform {
  backend "s3" {
    bucket = "s3-common-prd-terraform-tfstates-369569311955"
    key    = "ltprep/hello-lambda.tfstate"
    region = "ap-northeast-1"
  }
}
