import path from "path";

export const mapUploadedFiles = (
  files = [],
  chId,
  organizationId
) => {
  return files.map((file) => {
    const extension = path.extname(file.originalname).replace(".", "");

    return [
      chId,
      organizationId,
      file.originalname,
      file.mimetype,
      file.size,
      file.path
        ? file.path.replace(/\\/g, "/")
        : file.filename,
      extension,
      1,
    ];
  });
};

export const insertChapterFiles = async (
  db,
  chId,
  files = [],
  organizationId
) => {
  if (!files?.length) return;

  const values = mapUploadedFiles(
    files,
    chId,
    organizationId
  );

  await db.query(
    `
    INSERT INTO chapter_sources
    (
      chId,
      organizationId,
      fileName,
      fileType,
      fileSize,
      filePath,
      extension,
      canPreview
    )
    VALUES ?
    `,
    [values]
  );
};