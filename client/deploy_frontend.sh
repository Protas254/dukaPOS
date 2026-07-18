#!/bin/bash
# DukaPOS Frontend Deployment Script (AWS S3 + CloudFront)

set -e

# Configuration (update these before running or export them as environment variables)
S3_BUCKET=${S3_BUCKET:-"my-dukapos-frontend-bucket"}
CLOUDFRONT_DISTRIBUTION_ID=${CLOUDFRONT_DISTRIBUTION_ID:-"E1XXXXXXXXXXXX"}
AWS_PROFILE=${AWS_PROFILE:-"default"}

echo "🚀 Starting DukaPOS Frontend Build..."

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Build the project
echo "🛠️ Building Vite project for production..."
npm run build

# 3. Deploy to S3
echo "☁️ Syncing files to S3 bucket: $S3_BUCKET..."
# We delete missing files to ensure old hashed files are removed
aws s3 sync dist/ s3://$S3_BUCKET/ --profile $AWS_PROFILE --delete

# 4. Invalidate CloudFront Cache
if [ "$CLOUDFRONT_DISTRIBUTION_ID" != "E1XXXXXXXXXXXX" ]; then
    echo "🔄 Invalidating CloudFront cache for distribution: $CLOUDFRONT_DISTRIBUTION_ID..."
    aws cloudfront create-invalidation \
        --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
        --paths "/*" \
        --profile $AWS_PROFILE
    echo "✅ Cache invalidation triggered."
else
    echo "⚠️ Skipping CloudFront invalidation (CLOUDFRONT_DISTRIBUTION_ID not set)."
fi

echo "🎉 Deployment complete!"
