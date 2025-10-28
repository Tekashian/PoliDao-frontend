// Temporary version without MongoDB for testing
export async function uploadImage(
  buffer: Buffer,
  filename: string,
  metadata: any
): Promise<string> {
  // Simulate MongoDB upload with delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log('Simulating MongoDB upload:', {
    filename,
    size: buffer.length,
    metadata: {
      originalName: metadata.originalName,
      mimeType: metadata.mimeType,
      size: metadata.size
    }
  });
  
  // Return realistic fake ObjectId (24 hex characters like real MongoDB ObjectId)
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const randomBytes = Math.random().toString(16).substring(2, 18);
  const objectId = (timestamp + randomBytes).substring(0, 24);
  
  console.log('Generated fake ObjectId:', objectId);
  return objectId;
}
