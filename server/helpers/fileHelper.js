import path from "path";

export const mapUploadedFiles = (files = [], chId) => {
  return files.map((file) => {
    const extension = path.extname(file.originalname).replace(".", "");

    return [
      chId,
      file.originalname,
      file.mimetype,
      file.path
        ? file.path.replace(/\\/g, "/")
        : file.filename,
      extension,
      1,
    ];
  });
};

export const insertChapterFiles = async (db, chId, files = []) => {
  if (!files?.length) return;

  const values = mapUploadedFiles(files, chId);

  await db.query(
    `
    INSERT INTO chapter_sources
    (chId, fileName, fileType, filePath, extension, canPreview)
    VALUES ?
    `,
    [values]
  );
};