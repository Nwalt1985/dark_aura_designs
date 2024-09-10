import { S3 } from 'aws-sdk';

const s3 = new S3();

const BUCKET_NAME = 'generated-images';

export async function getImagesFromS3() {
  const s3Response = await s3.listObjectsV2({ Bucket: BUCKET_NAME }).promise();

  if (!s3Response.Contents) {
    console.log('No images found in S3');
    return [];
  }

  const keys = s3Response.Contents.map((content) => content.Key);

  if (keys.length === 0) {
    console.log('No images found in S3');
    return [];
  }

  const images = await Promise.all(
    keys.map(async (key) => {
      const image = await s3
        .getObject({ Bucket: BUCKET_NAME, Key: key! })
        .promise();
      return image.Body as Buffer;
    }),
  );

  return images;
}

export async function uploadImageToS3(image: Buffer, key: string) {
  return await s3
    .putObject({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: image,
      ContentType: 'image/png',
    })
    .promise();
}
