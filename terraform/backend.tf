terraform {
  backend "s3" {
	# 
	# bucket   = "s3-terraform-tfstates-1112223344555"
	# profile  = "dev"
	# region   = "ap-northeast-1"
    key    = "lambda-start-stop-ec2-rds/lambda-start-stop-ec2-rds.tfstate"
  }
}
