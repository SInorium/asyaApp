/** PUT файла напрямую в S3/MinIO по presigned URL. */
export async function uploadToStorage(uploadUrl: string, file: File) {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'content-type': file.type },
  });
  if (!res.ok) throw new Error(`Не удалось загрузить файл (${res.status})`);
}
