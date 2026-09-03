import { ExifData } from "libexif-wasm";
import {
  access,
  constants,
  glob,
  readdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import { serializeExifData } from "../lib/serializeExifData.ts";
import type { PathLike } from "node:fs";
import { basename, dirname } from "node:path";

const generateJson = async () => {
  const imageDirectories = (
    await Array.fromAsync(glob("./images/*/*.jpg"))
  ).map((path) => dirname(path));

  const images = await Promise.all(
    imageDirectories.map(async (path) => {
      const base = basename(path);
      const file = await readFile(`${path}/${base}.jpg`);

      return { name: base, parentPath: path, buffer: file };
    }),
  );

  await Promise.all(
    images.flatMap((image) => {
      const exifData = ExifData.newFromData(image.buffer);
      const { data, ...exifDataObject } = serializeExifData(exifData);
      exifData.free();

      const writeJsonPromise = writeFile(
        `${image.parentPath}/${image.name}.json`,
        JSON.stringify(exifDataObject),
      );

      return data.length === 0 ?
          [writeJsonPromise]
        : [
            writeJsonPromise,
            writeFile(
              `${image.parentPath}/${image.name}_thumbnail.jpeg`,
              new Uint8Array(data),
            ),
          ];
    }),
  );
};

generateJson();
