variable "start_schedule_expression" {
  description = "起動処理の cron 式 (UTC)"
  type        = string
  default     = "cron(50 23 ? * SUN-THU *)"  # JST 8:50、平日
}

variable "stop_schedule_expression" {
  description = "停止処理の cron 式 (UTC)"
  type        = string
  default     = "cron(0 12 ? * * *)"      # UTC 21:00、毎日(土日の手動起動の止め忘れ防止)
}

variable "aws_profile" {
  type        = string
  description = "Terraform 実行時に使用する AWS CLI プロファイル名"
}

variable "aws_region" {
  type        = string
  default     = "ap-northeast-1"
  description = "AWS リージョン"
}

variable "holiday_s3_bucket" {
  description = "S3バケット名 (祝日データ用)"
  type        = string
}

variable "holiday_s3_key" {
  description = "S3キー名 (祝日データ用)"
  type        = string
}
