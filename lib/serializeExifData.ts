import type {
  ExifData,
  ExifEntry,
  Ifd,
  Tag,
  Format,
  DataType,
  ByteOrder,
  ExifMnoteData,
} from "libexif-wasm";

type ExifEntryObject = {
  ifd: Ifd;
  tag: Tag;
  format: Format;
  components: number;
  data: number[];
  size: number;
  value: number[];
  formattedValue: string | null;
  byteOrder: ByteOrder;
};

type ExifIfdObject = Record<Ifd, ExifEntryObject[]>;

type ExifDataObject = {
  ifd: ExifIfdObject;
  data: number[];
  dataType: DataType | null;
  byteOrder: ByteOrder | null;
  mnoteData: ExifMnoteData["data"] | null;
};

const EMPTY_EXIF_IFD_OBJECT: ExifIfdObject = {
  IFD_0: [],
  IFD_1: [],
  EXIF: [],
  GPS: [],
  INTEROPERABILITY: [],
};

const serializeExifEntry = (entry: ExifEntry): ExifEntryObject | null => {
  const ifd = entry.ifd;

  if (entry.tag === null || entry.format === null || ifd === null) {
    return null;
  }

  return {
    ifd,
    tag: entry.tag,
    format: entry.format,
    components: entry.components,
    data: Array.from(entry.data),
    size: entry.size,
    value: Array.from(entry.toTypedArray()),
    formattedValue: entry.toString(),
    byteOrder: entry.byteOrder,
  };
};

/**
 * Serializes {@link ExifData} into a {@link ExifDataObject} object. Uint8Arrays
 * are converted into Arrays, and {@link ExifEntry} are converted to
 * {@link ExifEntryObject} with {@link serializeExifEntry}.
 */
const serializeExifData = (exifData: ExifData): ExifDataObject => {
  const ifd = exifData.ifd.reduce(
    (acc, exifContent) => {
      const ifdName = exifContent.ifd;
      if (ifdName !== null && exifContent.count !== 0) {
        acc[ifdName] = exifContent.entries
          .map(serializeExifEntry)
          .filter((entry) => entry !== null);
      }
      return acc;
    },
    { ...EMPTY_EXIF_IFD_OBJECT },
  );

  return {
    data: Array.from(exifData.data),
    ifd,
    dataType: exifData.dataType,
    byteOrder: exifData.byteOrder,
    mnoteData: exifData.mnoteData?.data ?? null,
  };
};

export {
  serializeExifEntry,
  type ExifEntryObject,
  type ExifIfdObject,
  type ExifDataObject,
  serializeExifData,
};
