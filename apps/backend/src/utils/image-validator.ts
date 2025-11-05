export const isBase64Image = (str: string): boolean => {
  return /^data:image\/(jpeg|png|webp);base64,/.test(str);
};

export const isImageURL = (str: string): boolean => {
  return /\.(jpe?g|png|webp)$/i.test(str) && str.startsWith('http');
}

export const isImageFilename = (str: string): boolean => {
  return /\.(jpe?g|png|webp)$/i.test(str)
}