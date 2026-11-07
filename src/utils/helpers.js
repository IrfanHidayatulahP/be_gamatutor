export const formatDate = (date) => {
  return new Date(date).toISOString();
};

export const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const paginate = (page = 1, limit = 20) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;
  return { limit: limitNum, offset, page: pageNum };
};

export const buildWhereClause = (filters, allowedFields) => {
  const where = {};
  for (const [key, value] of Object.entries(filters)) {
    if (allowedFields.includes(key) && value !== undefined && value !== '') {
      where[key] = value;
    }
  }
  return where;
};

export const sanitizeUser = (user) => {
  const { password, ...sanitized } = user;
  return sanitized;
};