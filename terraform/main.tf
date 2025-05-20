# ---------------------------------------------
#
#  EC2, Aurora 起動/停止を行う権限の設定: ロール <- ポリシー
#    ロール: rl-ops-start_stop_ec2_aurora
#    ポリシー: pl-ops-start_stop_ec2_aurora
#
# ---------------------------------------------

# EC2, Aurora 起動/停止を行うロール
resource "aws_iam_role" "rl-ops-start_stop_ec2_aurora" {
  name = "rl-ops-start_stop_ec2_aurora"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# カスタム IAM ポリシーを定義
resource "aws_iam_policy" "pl-ops-start_stop_ec2_aurora" {
  name        = "OpsAutoStartStopLeastPrivilege"
  description = "EC2/RDS の起動停止とタグ取得、CloudWatch Logs 出力に必要な最小権限"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      # EC2 の起動・停止・照会
      {
        Effect   = "Allow",
        Action   = [
          "ec2:StartInstances",
          "ec2:StopInstances",
          "ec2:DescribeInstances",
        ],
        Resource = "*"
      },
      # RDS クラスターの起動・停止・照会
      {
        Effect   = "Allow",
        Action   = [
          "rds:StartDBCluster",
          "rds:StopDBCluster",
          "rds:DescribeDBClusters",
          "rds:DescribeDBInstances",
        ],
        Resource = "*"
      },
      # タグによるリソース絞り込み
      {
        Effect   = "Allow",
        Action   = [
          "tag:GetResources",
        ],
        Resource = "*"
      },
      # Lambda 実行ログ出力
      {
        Effect   = "Allow",
        Action   = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# ポリシー(pl-ops-start_stop_ec2_aurora)を ロール(rl-ops-start_stop_ec2_aurora) にアタッチ
resource "aws_iam_role_policy_attachment" "attach_ops_start_stop" {
  role       = aws_iam_role.rl-ops-start_stop_ec2_aurora.name
  policy_arn = aws_iam_policy.pl-ops-start_stop_ec2_aurora.arn
}

# 休日情報を保存する S3 バケットへのアクセス権限
resource "aws_iam_policy" "pl-ops-lambda-holiday-s3-access" {
  name        = "pl-ops-lambda-holiday-s3-access"
  description = "Allow Lambda to access holiday S3 bucket and key"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:HeadObject"
        ]
        Resource = [
          "arn:aws:s3:::${var.holiday_s3_bucket}/${var.holiday_s3_key}"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.holiday_s3_bucket}"
        ]
      }
    ]
  })
}

# ポリシー(pl-ops-lambda-holiday-s3-access)を ロール(rl-ops-start_stop_ec2_aurora) にアタッチ
resource "aws_iam_role_policy_attachment" "attach-ops_-holiday_s3" {
  role       = aws_iam_role.rl-ops-start_stop_ec2_aurora.name
  policy_arn = aws_iam_policy.pl-ops-lambda-holiday-s3-access.arn
}


# ---------------------------------------------
#
#  EC2, Aurora を起動/停止する Lambda
#    起動: func-ops-start_ec2_aurora
#    停止: func-ops-stop_ec2_aurora
#
# ---------------------------------------------

# Lambda 関数: Start
resource "aws_lambda_function" "func-ops-start_ec2_aurora" {
  filename         = "${path.module}/../function.zip"
  function_name    = "ops-auto-start-ec2-aurora"
  role             = aws_iam_role.rl-ops-start_stop_ec2_aurora.arn
  runtime          = "nodejs22.x"
  handler          = "index.startHandler"   # start 用ハンドラ
  source_code_hash = filebase64sha256("${path.module}/../function.zip")
  timeout          = 900 # 15min
  environment {
    variables = {
      HOLIDAY_S3_BUCKET = var.holiday_s3_bucket
      HOLIDAY_S3_KEY    = var.holiday_s3_key
    }
  }
}

# Lambda 関数: Stop
resource "aws_lambda_function" "func-ops-stop_ec2_aurora" {
  filename         = "${path.module}/../function.zip"
  function_name    = "ops-auto-stop-ec2-aurora"
  role             = aws_iam_role.rl-ops-start_stop_ec2_aurora.arn
  runtime          = "nodejs22.x"
  handler          = "index.stopHandler"    # stop 用ハンドラ
  source_code_hash = filebase64sha256("${path.module}/../function.zip")
}


# ---------------------------------------------
#
#  EC2, Aurora を起動/停止するルール(CloudWatch Rule)
#     Rule -> Target -> Lambda
#
# ---------------------------------------------


# 起動ルール
resource "aws_cloudwatch_event_rule" "cwrl-start_schedule" {
  name                = "ops-auto-start-schedule"
  schedule_expression = var.start_schedule_expression
}

# Lamnda との紐付け
resource "aws_cloudwatch_event_target" "cwtg-start_target" {
  rule      = aws_cloudwatch_event_rule.cwrl-start_schedule.name
  target_id = "startLambda"
  arn       = aws_lambda_function.func-ops-start_ec2_aurora.arn
}

# 停止ルール
resource "aws_cloudwatch_event_rule" "cwrl-stop_schedule" {
  name                = "ops-auto-stop-schedule"
  schedule_expression = var.stop_schedule_expression
}

# Lamnda との紐付け
resource "aws_cloudwatch_event_target" "cwtg-stop_target" {
  rule      = aws_cloudwatch_event_rule.cwrl-stop_schedule.name
  target_id = "stopLambda"
  arn       = aws_lambda_function.func-ops-stop_ec2_aurora.arn
}

# ---------------------------------------------
#
#  EC2, Aurora を起動/停止するLamndaのリソースベースポリシー
#  CloudWatch Rule から Lambda を呼び出せるようにする
#
# ---------------------------------------------

# Start 向けポリシー
# Lambda: func-ops-start_ec2_aurora
# ソース: cwrl-start_schedule
resource "aws_lambda_permission" "lmrp-allow_start" {
  statement_id  = "AllowEventBridgeStart"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.func-ops-start_ec2_aurora.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.cwrl-start_schedule.arn
}

# Stop 向けポリシー
# Lambda: func-ops-start_ec2_aurora
# ソース: cwrl-start_schedule
resource "aws_lambda_permission" "lmrp-allow_stop" {
  statement_id  = "AllowEventBridgeStop"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.func-ops-stop_ec2_aurora.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.cwrl-stop_schedule.arn
}
