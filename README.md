# lambda-terraform-prep

TypeScript + esbuild で実装された AWS Lambda 関数を Terraform でデプロイ・管理するプロジェクトです。  
トイル（Toil）を減らし、開発と運用の自動化を目指す構成になっています。

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
lambda-terraform-prep/
├── Makefile
├── .node-version
├── .terraform-version
├── lambda/
│   ├── src/
│   │   ├── hello.ts
│   │   └── index.ts
│   ├── tsconfig.json
│   ├── build.mjs
│   └── test.mjs
├── dist/              # ビルド成果物
├── index.zip          # Lambda デプロイ用パッケージ
├── terraform/
│   ├── backend.tf
│   ├── main.tf
│   ├── provider.tf
│   ├── variables.tf
│   └── outputs.tf
├── terraform.tfvars   # 実行時変数（.gitignore 推奨）
```

---

## 🔧 前提環境

- Node.js 22.14.0（`nodenv` 管理）
- Terraform 1.11.3（`tfenv` 管理）
- bash シェル
- AWS 認証情報（S3 バックエンド用）設定済み

`.node-version`, `.terraform-version` によって自動切り替え可能です。

---

## 📝 初回セットアップ

Terraform の状態管理に使用する AWS バックエンドへの認証のため、`terraform init` 実行時には AWS プロファイルを環境変数で明示します。

```bash
AWS_PROFILE=init-profile terraform -chdir=terraform init
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
| `make build`         | TypeScript を esbuild でビルド（自動的に npm install）|
| `make zip`           | Lambda 用パッケージ作成（build + prune + zip）       |
| `make plan`          | Terraform プラン表示                                  |
| `make apply`         | Terraform 適用（-auto-approve なし）                  |
| `make destroy`       | Terraform によるインフラの削除                      |
| `make test-local`    | ローカルで sayHello 関数をテスト実行                  |
| `make clean`         | zip や dist、state ファイルのクリーンアップ           |

---

## ✅ 補足

- Lambda のハンドラーは `src/index.ts` にあり、ロジック本体は `hello.ts` に分離されています。
- `test.mjs` を使って Lambda をローカルで実行することが可能です。
- IAM ロールや関数名などの命名は、次の規則に従っています：
  ```
  <リソース種別>-ltprep-<用途>
  ```
