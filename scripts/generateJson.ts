import { ExifData } from "libexif-wasm";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { serializeExifData } from "../lib/serializeExifData.ts";

const generateJson = async () => {
  const dirents = await readdir("./images", {
    withFileTypes: true,
  });

  const images = await Promise.all(
    dirents.map((dirent) =>
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

      return data === null ?
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
