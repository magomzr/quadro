# Image Upload to S3 - Implementation Analysis

This document analyzes two approaches for handling image uploads in the Quadro application and provides implementation for both patterns.

## Current State Analysis

### Database Schema
- **Product Model**: Contains `imageUrl` field (String, optional) for product images
- **Settings Model**: Contains `companyLogoUrl` field (String, optional) for company branding

### Existing Endpoints
- Product creation: `POST /v1/tenants/:tenantId/catalog/products`
- Product update: `PATCH /v1/tenants/:tenantId/catalog/products/:productId`
- Settings update: `PATCH /v1/tenants/:tenantId/settings`

Currently, these endpoints only accept JSON with URL strings - no file upload capability exists.

## Implementation Approaches

### Approach 1: Frontend Direct Upload (Current Assumption)

**How it works:**
1. Frontend obtains presigned URLs from backend or uploads directly to S3
2. Frontend uploads files directly to S3
3. Frontend receives public URLs from S3
4. Frontend sends URLs to backend via existing JSON endpoints

**Pros:**
- Reduces backend bandwidth and processing
- Faster uploads (direct to S3)
- Simpler backend implementation
- Better performance for large files

**Cons:**
- Requires S3 credentials in frontend or presigned URL generation
- More complex frontend upload logic
- Harder to implement upload validation
- Security concerns with direct S3 access

### Approach 2: Backend File Upload (New Implementation)

**How it works:**
1. Frontend sends files via multipart/form-data to backend
2. Backend validates and processes files
3. Backend uploads files to S3 using streams
4. Backend returns URLs and updates database records

**Pros:**
- Centralized file validation and processing
- Better security (S3 credentials stay on backend)
- Easier to implement business logic (resizing, validation, etc.)
- Simpler frontend implementation

**Cons:**
- Increased backend bandwidth and processing
- Potential performance bottlenecks for large files
- More complex backend implementation

## New Backend File Upload Implementation

### Dependencies Added
- `@nestjs/platform-express` - Built-in file upload support
- `multer` & `@types/multer` - Multipart form data handling
- `@aws-sdk/client-s3` - Modern AWS S3 client
- `@aws-sdk/s3-request-presigner` - For generating presigned URLs if needed
- `uuid` & `@types/uuid` - Unique filename generation

### New Services

#### S3UploadService
Located at `src/shared/s3-upload.service.ts`

**Key Features:**
- Configurable via environment variables
- Unique filename generation to prevent conflicts
- Folder organization (products/, logos/)
- Error handling with meaningful messages
- Public URL generation

**Configuration:**
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=quadro-uploads
```

### New Endpoints

#### Product Image Upload
- **Endpoint**: `POST /v1/tenants/:tenantId/catalog/products/:productId/image`
- **Content-Type**: `multipart/form-data`
- **Field**: `image` (file field)
- **Validation**: 
  - File types: JPEG, JPG, PNG, GIF, WebP
  - Size limit: 5MB
- **Behavior**: Uploads image to S3 and updates product record

#### Product Creation with Image
- **Endpoint**: `POST /v1/tenants/:tenantId/catalog/products/with-image`
- **Content-Type**: `multipart/form-data`
- **Fields**: 
  - `image` (file field, optional)
  - Other product fields in body
- **Behavior**: Creates product with uploaded image URL

#### Company Logo Upload
- **Endpoint**: `POST /v1/tenants/:tenantId/settings/logo`
- **Content-Type**: `multipart/form-data`
- **Field**: `logo` (file field)
- **Validation**:
  - File types: JPEG, JPG, PNG, GIF, WebP, SVG
  - Size limit: 2MB
- **Behavior**: Uploads logo to S3 and updates settings record

### Example Usage

#### Upload Product Image
```bash
curl -X POST \
  -H "Content-Type: multipart/form-data" \
  -F "image=@product-image.jpg" \
  http://localhost:3000/v1/tenants/123e4567-e89b-12d3-a456-426614174000/catalog/products/456e7890-e89b-12d3-a456-426614174001/image
```

#### Create Product with Image
```bash
curl -X POST \
  -H "Content-Type: multipart/form-data" \
  -F "image=@product-image.jpg" \
  -F "name=New Product" \
  -F "description=Product description" \
  -F "price=29.99" \
  -F "stock=10" \
  http://localhost:3000/v1/tenants/123e4567-e89b-12d3-a456-426614174000/catalog/products/with-image
```

#### Upload Company Logo
```bash
curl -X POST \
  -H "Content-Type: multipart/form-data" \
  -F "logo=@company-logo.png" \
  http://localhost:3000/v1/tenants/123e4567-e89b-12d3-a456-426614174000/settings/logo
```

## Security Features

### File Validation
- MIME type validation using regex patterns
- File size limits per endpoint type
- Automatic unique filename generation prevents conflicts

### Error Handling
- Meaningful error messages for invalid files
- Proper HTTP status codes
- S3 upload error handling with user-friendly messages

## Testing

### Unit Tests
- S3UploadService with mocked S3 client
- File validation logic
- Error handling scenarios

### Integration Tests
- File type validation patterns
- File size limit verification
- Error handling verification

## Recommendations

### For Production Use
1. **Use Backend Upload Approach** for better security and validation
2. **Configure proper AWS IAM roles** with minimal S3 permissions
3. **Implement image resizing/optimization** before S3 upload
4. **Add image scanning** for malware/inappropriate content
5. **Use CDN** (CloudFront) for better image delivery performance
6. **Implement cleanup jobs** for orphaned S3 files

### Performance Considerations
1. For high-volume applications, consider **hybrid approach**:
   - Small files (logos): Backend upload
   - Large files (product images): Direct upload with presigned URLs
2. **Implement image processing queues** for resizing operations
3. **Use S3 lifecycle policies** for cost optimization

### Security Best Practices
1. **Restrict S3 bucket permissions** to minimum required
2. **Validate file content**, not just extensions
3. **Implement rate limiting** on upload endpoints
4. **Log all upload activities** for audit trails
5. **Use HTTPS only** for all file uploads

## Conclusion

This implementation provides a robust backend file upload solution that offers better security and validation compared to direct frontend uploads. Both approaches remain available, allowing flexibility based on specific use cases and requirements.

The backend upload approach is recommended for most scenarios due to its security benefits and centralized validation capabilities.