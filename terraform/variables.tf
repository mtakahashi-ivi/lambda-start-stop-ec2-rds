variable "aws_profile" {
  type        = string
  description = "Terraform 実行時に使用する AWS CLI プロファイル名"
}

variable "aws_region" {
  type        = string
  default     = "ap-northeast-1"
  description = "AWS リージョン"
}
