function transformCreatorCard(document, options = {}) {
  const { includeAccessCode = false } = options;

  const transformed = {
    id: document._id,
    title: document.title,
    description: document.description,
    slug: document.slug,
    creator_reference: document.creator_reference,
    links: document.links || [],
    service_rates: document.service_rates || null,
    status: document.status,
    access_type: document.access_type,
  };

  if (includeAccessCode) {
    transformed.access_code = document.access_code || null;
  }

  transformed.created = document.created;
  transformed.updated = document.updated;
  transformed.deleted = typeof document.deleted === 'undefined' ? null : document.deleted;

  return transformed;
}

module.exports = transformCreatorCard;
