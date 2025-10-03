#!/bin/bash
# PromptCraft Secret Management Setup Script
# This script helps set up secure secret management for different platforms

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SECRETS_CONFIG="$PROJECT_ROOT/.secrets.yaml"

# Default values
ENVIRONMENT="development"
SECRET_STORE="local"
PROJECT_NAME="promptcraft"

# Help function
show_help() {
    cat << EOF
PromptCraft Secret Management Setup

Usage: $0 [OPTIONS]

OPTIONS:
    -e, --environment ENV    Environment (development|staging|production) [default: development]
    -s, --store STORE       Secret store (local|aws|azure|gcp|vault|k8s) [default: local]
    -p, --project NAME      Project name [default: promptcraft]
    -h, --help             Show this help message

EXAMPLES:
    # Setup for local development
    $0 --environment development --store local

    # Setup for AWS production
    $0 --environment production --store aws

    # Setup for Kubernetes
    $0 --environment production --store k8s

SUPPORTED SECRET STORES:
    local       - Local file-based secrets (development only)
    aws         - AWS Secrets Manager
    azure       - Azure Key Vault
    gcp         - Google Secret Manager
    vault       - HashiCorp Vault
    k8s         - Kubernetes Secrets

EOF
}

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -s|--store)
                SECRET_STORE="$2"
                shift 2
                ;;
            -p|--project)
                PROJECT_NAME="$2"
                shift 2
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Validate environment
validate_environment() {
    case $ENVIRONMENT in
        development|staging|production)
            log_info "Environment: $ENVIRONMENT"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            log_error "Valid environments: development, staging, production"
            exit 1
            ;;
    esac
}

# Validate secret store
validate_secret_store() {
    case $SECRET_STORE in
        local|aws|azure|gcp|vault|k8s)
            log_info "Secret store: $SECRET_STORE"
            ;;
        *)
            log_error "Invalid secret store: $SECRET_STORE"
            log_error "Valid stores: local, aws, azure, gcp, vault, k8s"
            exit 1
            ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if running as root (should not be)
    if [[ $EUID -eq 0 ]]; then
        log_error "This script should not be run as root"
        exit 1
    fi

    case $SECRET_STORE in
        aws)
            if ! command -v aws &> /dev/null; then
                log_error "AWS CLI is required but not installed"
                log_info "Install with: pip install awscli"
                exit 1
            fi
            ;;
        azure)
            if ! command -v az &> /dev/null; then
                log_error "Azure CLI is required but not installed"
                log_info "Install from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
                exit 1
            fi
            ;;
        gcp)
            if ! command -v gcloud &> /dev/null; then
                log_error "Google Cloud CLI is required but not installed"
                log_info "Install from: https://cloud.google.com/sdk/docs/install"
                exit 1
            fi
            ;;
        vault)
            if ! command -v vault &> /dev/null; then
                log_error "Vault CLI is required but not installed"
                log_info "Install from: https://www.vaultproject.io/downloads"
                exit 1
            fi
            ;;
        k8s)
            if ! command -v kubectl &> /dev/null; then
                log_error "kubectl is required but not installed"
                log_info "Install from: https://kubernetes.io/docs/tasks/tools/"
                exit 1
            fi
            ;;
    esac

    log_success "Prerequisites check passed"
}

# Setup local secrets (development only)
setup_local_secrets() {
    log_info "Setting up local secrets..."

    if [[ $ENVIRONMENT != "development" ]]; then
        log_error "Local secrets are only allowed in development environment"
        exit 1
    fi

    local secrets_dir="$PROJECT_ROOT/.secrets"
    mkdir -p "$secrets_dir"
    chmod 700 "$secrets_dir"

    # Create local secrets file
    cat > "$secrets_dir/local.env" << EOF
# Local development secrets - DO NOT COMMIT
# Generated on $(date)

# API Keys (replace with actual values)
OPENAI_API_KEY=your-openai-api-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# Database
DATABASE_PASSWORD=local-dev-password

# Encryption
ENCRYPTION_KEY=$(openssl rand -hex 32)

# JWT Secret
JWT_SECRET=$(openssl rand -hex 64)

# Session Secret
SESSION_SECRET=$(openssl rand -hex 32)
EOF

    chmod 600 "$secrets_dir/local.env"

    # Add to .gitignore
    if ! grep -q ".secrets/" "$PROJECT_ROOT/.gitignore" 2>/dev/null; then
        echo ".secrets/" >> "$PROJECT_ROOT/.gitignore"
    fi

    log_success "Local secrets created at $secrets_dir/local.env"
    log_warning "Remember to update the secrets with actual values"
    log_warning "This file is excluded from git - do not commit secrets!"
}

# Setup AWS Secrets Manager
setup_aws_secrets() {
    log_info "Setting up AWS Secrets Manager..."

    local secret_name="$PROJECT_NAME/$ENVIRONMENT/secrets"
    local region="${AWS_REGION:-us-east-1}"

    # Check AWS authentication
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS authentication failed"
        log_info "Run: aws configure"
        exit 1
    fi

    # Create secret
    local secret_value='{
        "api_key": "REPLACE_WITH_ACTUAL_API_KEY",
        "database_password": "REPLACE_WITH_ACTUAL_PASSWORD",
        "encryption_key": "'$(openssl rand -hex 32)'",
        "jwt_secret": "'$(openssl rand -hex 64)'"
    }'

    if aws secretsmanager describe-secret --secret-id "$secret_name" --region "$region" &> /dev/null; then
        log_warning "Secret $secret_name already exists"
        read -p "Update existing secret? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            aws secretsmanager update-secret \
                --secret-id "$secret_name" \
                --secret-string "$secret_value" \
                --region "$region"
            log_success "Secret updated: $secret_name"
        fi
    else
        aws secretsmanager create-secret \
            --name "$secret_name" \
            --description "PromptCraft secrets for $ENVIRONMENT" \
            --secret-string "$secret_value" \
            --region "$region"
        log_success "Secret created: $secret_name"
    fi

    # Create IAM policy for the secret
    local policy_name="PromptCraft-${ENVIRONMENT}-SecretsPolicy"
    local policy_document='{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "secretsmanager:GetSecretValue"
                ],
                "Resource": "arn:aws:secretsmanager:'$region':*:secret:'$secret_name'*"
            }
        ]
    }'

    echo "$policy_document" > "/tmp/$policy_name.json"
    
    if aws iam get-policy --policy-arn "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/$policy_name" &> /dev/null; then
        log_info "IAM policy $policy_name already exists"
    else
        aws iam create-policy \
            --policy-name "$policy_name" \
            --policy-document "file:///tmp/$policy_name.json" \
            --description "Access to PromptCraft secrets for $ENVIRONMENT"
        log_success "IAM policy created: $policy_name"
    fi

    rm "/tmp/$policy_name.json"

    log_info "AWS setup complete. Update the secret values in AWS console:"
    log_info "https://console.aws.amazon.com/secretsmanager/secret?name=$secret_name&region=$region"
}

# Setup Azure Key Vault
setup_azure_secrets() {
    log_info "Setting up Azure Key Vault..."

    local vault_name="$PROJECT_NAME-$ENVIRONMENT-kv"
    local resource_group="$PROJECT_NAME-$ENVIRONMENT-rg"
    local location="${AZURE_LOCATION:-eastus}"

    # Check Azure authentication
    if ! az account show &> /dev/null; then
        log_error "Azure authentication failed"
        log_info "Run: az login"
        exit 1
    fi

    # Create resource group if it doesn't exist
    if ! az group show --name "$resource_group" &> /dev/null; then
        az group create --name "$resource_group" --location "$location"
        log_success "Resource group created: $resource_group"
    fi

    # Create Key Vault if it doesn't exist
    if ! az keyvault show --name "$vault_name" &> /dev/null; then
        az keyvault create \
            --name "$vault_name" \
            --resource-group "$resource_group" \
            --location "$location" \
            --enable-rbac-authorization true
        log_success "Key Vault created: $vault_name"
    fi

    # Set secrets
    local secrets=(
        "api-key:REPLACE_WITH_ACTUAL_API_KEY"
        "database-password:REPLACE_WITH_ACTUAL_PASSWORD"
        "encryption-key:$(openssl rand -hex 32)"
        "jwt-secret:$(openssl rand -hex 64)"
    )

    for secret in "${secrets[@]}"; do
        local name="${secret%%:*}"
        local value="${secret##*:}"
        
        az keyvault secret set \
            --vault-name "$vault_name" \
            --name "$name" \
            --value "$value" \
            --output none
        log_success "Secret set: $name"
    done

    log_info "Azure Key Vault setup complete"
    log_info "Vault URL: https://$vault_name.vault.azure.net/"
}

# Setup Google Secret Manager
setup_gcp_secrets() {
    log_info "Setting up Google Secret Manager..."

    local project_id="${GCP_PROJECT_ID:-$PROJECT_NAME-$ENVIRONMENT}"

    # Check GCP authentication
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1 &> /dev/null; then
        log_error "GCP authentication failed"
        log_info "Run: gcloud auth login"
        exit 1
    fi

    # Enable Secret Manager API
    gcloud services enable secretmanager.googleapis.com --project="$project_id"

    # Create secrets
    local secrets=(
        "api-key"
        "database-password"
        "encryption-key"
        "jwt-secret"
    )

    for secret_name in "${secrets[@]}"; do
        local full_name="$PROJECT_NAME-$secret_name"
        
        if gcloud secrets describe "$full_name" --project="$project_id" &> /dev/null; then
            log_info "Secret $full_name already exists"
        else
            gcloud secrets create "$full_name" \
                --project="$project_id" \
                --replication-policy="automatic"
            log_success "Secret created: $full_name"
        fi

        # Add initial version
        local value
        case $secret_name in
            "encryption-key")
                value=$(openssl rand -hex 32)
                ;;
            "jwt-secret")
                value=$(openssl rand -hex 64)
                ;;
            *)
                value="REPLACE_WITH_ACTUAL_VALUE"
                ;;
        esac

        echo -n "$value" | gcloud secrets versions add "$full_name" \
            --project="$project_id" \
            --data-file=-
        log_success "Secret version added: $full_name"
    done

    log_info "Google Secret Manager setup complete"
    log_info "Project: $project_id"
}

# Setup Kubernetes secrets
setup_k8s_secrets() {
    log_info "Setting up Kubernetes secrets..."

    local namespace="$PROJECT_NAME-$ENVIRONMENT"
    local secret_name="$PROJECT_NAME-secrets"

    # Check kubectl connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "kubectl is not connected to a cluster"
        log_info "Configure kubectl to connect to your cluster"
        exit 1
    fi

    # Create namespace if it doesn't exist
    if ! kubectl get namespace "$namespace" &> /dev/null; then
        kubectl create namespace "$namespace"
        log_success "Namespace created: $namespace"
    fi

    # Create secret
    kubectl create secret generic "$secret_name" \
        --namespace="$namespace" \
        --from-literal=api-key="REPLACE_WITH_ACTUAL_API_KEY" \
        --from-literal=database-password="REPLACE_WITH_ACTUAL_PASSWORD" \
        --from-literal=encryption-key="$(openssl rand -hex 32)" \
        --from-literal=jwt-secret="$(openssl rand -hex 64)" \
        --dry-run=client -o yaml | kubectl apply -f -

    log_success "Kubernetes secret created: $secret_name in namespace $namespace"

    # Create example deployment manifest
    cat > "$PROJECT_ROOT/k8s-deployment-example.yaml" << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: $PROJECT_NAME
  namespace: $namespace
spec:
  replicas: 1
  selector:
    matchLabels:
      app: $PROJECT_NAME
  template:
    metadata:
      labels:
        app: $PROJECT_NAME
    spec:
      containers:
      - name: $PROJECT_NAME
        image: $PROJECT_NAME:latest
        env:
        - name: API_KEY
          valueFrom:
            secretKeyRef:
              name: $secret_name
              key: api-key
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: $secret_name
              key: database-password
        - name: ENCRYPTION_KEY
          valueFrom:
            secretKeyRef:
              name: $secret_name
              key: encryption-key
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: $secret_name
              key: jwt-secret
EOF

    log_success "Example deployment manifest created: k8s-deployment-example.yaml"
}

# Generate configuration file
generate_config() {
    log_info "Generating configuration..."

    cat > "$SECRETS_CONFIG" << EOF
# PromptCraft Secrets Configuration
# Generated on $(date)

project: $PROJECT_NAME
environment: $ENVIRONMENT
secret_store: $SECRET_STORE

# Secret store specific configuration
$(case $SECRET_STORE in
    aws)
        echo "aws:"
        echo "  region: ${AWS_REGION:-us-east-1}"
        echo "  secret_name: $PROJECT_NAME/$ENVIRONMENT/secrets"
        ;;
    azure)
        echo "azure:"
        echo "  vault_name: $PROJECT_NAME-$ENVIRONMENT-kv"
        echo "  resource_group: $PROJECT_NAME-$ENVIRONMENT-rg"
        ;;
    gcp)
        echo "gcp:"
        echo "  project_id: ${GCP_PROJECT_ID:-$PROJECT_NAME-$ENVIRONMENT}"
        echo "  secret_prefix: $PROJECT_NAME"
        ;;
    k8s)
        echo "kubernetes:"
        echo "  namespace: $PROJECT_NAME-$ENVIRONMENT"
        echo "  secret_name: $PROJECT_NAME-secrets"
        ;;
    vault)
        echo "vault:"
        echo "  address: ${VAULT_ADDR:-http://localhost:8200}"
        echo "  secret_path: $PROJECT_NAME/$ENVIRONMENT"
        ;;
    local)
        echo "local:"
        echo "  secrets_file: .secrets/local.env"
        ;;
esac)

# Security settings
security:
  encryption_at_rest: true
  encryption_in_transit: true
  secret_rotation_days: 90
  audit_logging: true

# Monitoring
monitoring:
  secret_access_logging: true
  anomaly_detection: true
  alert_on_unauthorized_access: true
EOF

    log_success "Configuration saved to $SECRETS_CONFIG"
}

# Main execution
main() {
    log_info "PromptCraft Secret Management Setup"
    log_info "=================================="

    parse_args "$@"
    validate_environment
    validate_secret_store
    check_prerequisites

    case $SECRET_STORE in
        local)
            setup_local_secrets
            ;;
        aws)
            setup_aws_secrets
            ;;
        azure)
            setup_azure_secrets
            ;;
        gcp)
            setup_gcp_secrets
            ;;
        k8s)
            setup_k8s_secrets
            ;;
        vault)
            log_error "HashiCorp Vault setup not implemented yet"
            exit 1
            ;;
    esac

    generate_config

    log_success "Secret management setup complete!"
    log_info ""
    log_info "Next steps:"
    log_info "1. Update secret values with actual credentials"
    log_info "2. Configure your application to use the secrets"
    log_info "3. Test the secret retrieval in your application"
    log_info "4. Set up secret rotation if required"
    log_info ""
    log_warning "Remember: Never commit actual secrets to version control!"
}

# Run main function with all arguments
main "$@"