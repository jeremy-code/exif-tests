import { ExifData } from "libexif-wasm";
import {
  access,
  constants,
  readdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import { serializeExifData } from "../lib/serializeExifData.ts";
import type { PathLike } from "node:fs";

function exists(path: PathLike) {
  return access(path, constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

const generateJson = async () => {
  const dirents = await readdir("./images", {
    withFileTypes: true,
  });
  const imageDirectories = dirents.filter(
    (dirent) =>
      dirent.isDirectory() &&
      exists(`${dirent.parentPath}/${dirent.name}/${dirent.name}.jpg`),
  );

  const images = await Promise.all(
    imageDirectories.map((dirent) =>
      readFile(`${dirent.parentPath}/${dirent.name}/${dirent.name}.jpg`).then(
        (buffer) => ({
          name: dirent.name,
          parentPath: dirent.parentPath,
          buffer,
        }),
      ),
    ),
  );

  await Promise.all(
    images.flatMap((image) => {
      const exifData = ExifData.newFromData(image.buffer);
      const { data, ...exifDataObject } = serializeExifData(exifData);
      exifData.free();

      const writeJsonPromise = writeFile(
        `${image.parentPath}/${image.name}/${image.name}.json`,
        JSON.stringify(exifDataObject),
      );

      return data.length === 0 ?
          [writeJsonPromise]
        : [
            writeJsonPromise,
            writeFile(
              `${image.parentPath}/${image.name}/${image.name}_thumbnail.jpeg`,
              new Uint8Array(data),
            ),
          ];
    }),
  );
};

generateJson();
