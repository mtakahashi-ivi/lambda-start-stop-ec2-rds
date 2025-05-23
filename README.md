# lambda-start-stop-ec2-rds

EC2 と Aurora で構成される環境(開発向け環境)の定時起動/停止を行うプロジェクトです。

## 📌 概要

- AWS Lambda（Node.js 22.x）
- TypeScript（型安全）
- esbuild（高速バンドル）
- Terraform（インフラ構成管理）
- Makefile（ビルド・デプロイ操作の統一）
- ローカルテスト可能

Zenn に連動した解説記事があります → [Lambda × Terraform で始めるトイル削減：準備 編](https://zenn.dev/inventit/articles/automate-toil-by-lambda-terraform-prep)

---

## 📁 ディレクトリ構成

```
lambda-start-stop-ec2-rds/
.
├── Makefile
├── .gitignore
├── .node-version
├── .terraform-version
├── README.md
├── lambda
│   ├── build.mjs
│   ├── package-lock.json
│   ├── package.json
│   ├── src
│   │   ├── common.ts
│   │   ├── index.ts
│   │   ├── start_stop_env.ts
│   │   └── testLocal.ts
│   └── tsconfig.json
└── terraform
    ├── backend.tf
    ├── main.tf
    ├── provider.tf
    └── variables.tf
```

---

## 🔧 前提環境

- Node.js 22.14.0（`nodenv` 管理）
- Terraform 1.11.3（`tfenv` 管理）
- bash シェル
- AWS 認証情報設定済み

---

## 📝 初回セットアップ

Terraform のバックエンドを初期化します、`terraform init` 実行時にはバックエンドの設定 `s3.backend_config.tfvars` を指定してください。

```hcl:title=s3.backend_config.tfvars
# bucket 名
bucket   = "terraform-tfstates-111222333444"
# アクセスに使うAWSプロファイル
profile  = "dev"
# リージョン
region   = "ap-northeast-1"
```

> ⚠️ `terraform.tfvars` は `.gitignore` に含め、Git 管理対象にしないことを想定しています。

```bash
terraform -chdir=terraform init -backend-config="./s3.backend_config.tfvars"
```

その後、`terraform.tfvars` に以下のようにプロファイルを設定してください：

```hcl:title=terraform.tfvars
aws_profile = "dev"
aws_region  = "ap-northeast-1"
```

> ⚠️ `terraform.tfvars` は `.gitignore` に含め、Git 管理対象にしないでください。

---

## 🛠️ Makefile コマンド一覧

| コマンド             | 内容                                                  |
|----------------------|-------------------------------------------------------|
| `make test-local-*`  | ローカルで testLocal.ts のテスト実行                  |
| `make zip`           | Lambda 用パッケージ作成（build + prune + zip）       |
| `make plan`          | Terraform プラン表示                                  |
| `make apply`         | Terraform 適用（-auto-approve なし）                  |
| `make destroy`       | Terraform によるインフラの削除                      |
| `make clean`         | zip や dist、state ファイルのクリーンアップ           |

## 🧪 テスト実行: Makefile コマンド

| コマンド             | 内容                                                  |
|----------------------|-------------------------------------------------------|
| `make test-local-testHolidayTypes`  | ローカルで isHolidayOrWeekend のテスト                  |
| `make test-local-testGetResourceMap`  | ローカルで getResourceMap のテスト                  |



### AWS_PROFILE を使ったローカルテスト実行例

AWS認証情報としてプロファイルを使いたい場合、以下のように `AWS_PROFILE` を指定して実行できます。

```bash
make AWS_PROFILE=your_profile_name test-local-testGetResourceMap
```

この場合、AWS SDK は `~/.aws/credentials` の `your_profile_name` を利用してAPIにアクセスします。

- `AWS_PROFILE` を省略した場合は、デフォルトプロファイルや環境変数の認証情報が使われます。
- Makefile で `AWS_PROFILE=$(AWS_PROFILE)` を node 実行時に渡しているため、明示的な指定が可能です。

---

