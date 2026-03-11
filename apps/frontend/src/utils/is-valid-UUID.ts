export const isValidUUID = (id: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id);
};

/**
 * Validates MongoDB ObjectId (24 hexadecimal characters)
 */
export const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-f]{24}$/i.test(id);
};;