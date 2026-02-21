/**
 * Cursor-based pagination helper for Prisma.
 *
 * Usage:
 *   const { paginationArgs, buildResponse } = paginate(req.query);
 *   const items = await prisma.model.findMany({ ...paginationArgs, where: {...} });
 *   res.json(buildResponse(items));
 *
 * Query params:
 *   ?cursor=<id>  — start after this ID
 *   ?limit=20     — items per page (max 100)
 */
function paginate(query = {}) {
  const limit = Math.min(Math.max(parseInt(query.limit) || 20, 1), 100);
  
  const paginationArgs = {
    take: limit + 1, // Fetch one extra to detect hasMore
    orderBy: { createdAt: 'desc' },
  };

  if (query.cursor) {
    paginationArgs.cursor = { id: query.cursor };
    paginationArgs.skip = 1; // Skip the cursor item itself
  }

  function buildResponse(items) {
    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return {
      data,
      nextCursor,
      hasMore,
    };
  }

  return { paginationArgs, buildResponse };
}

module.exports = paginate;
