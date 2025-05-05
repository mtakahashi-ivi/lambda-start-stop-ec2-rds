resource "aws_iam_role" "rl-ltprep-lambda-exec" {
  name = "rl-ltprep-lambda-exec"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Principal = {
        Service = "lambda.amazonaws.com"
      },
      Effect = "Allow"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "pl-ltprep-lambda-exec" {
  role       = aws_iam_role.rl-ltprep-lambda-exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "lm-ltprep-hello" {
  function_name = "lm-ltprep-hello"
  runtime       = "nodejs22.x"
  role          = aws_iam_role.rl-ltprep-lambda-exec.arn
  handler       = "index.handler"
  filename      = "${path.module}/../index.zip"
  source_code_hash = filebase64sha256("${path.module}/../index.zip")
}
