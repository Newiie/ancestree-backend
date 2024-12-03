
/**
 * Helper function to recursively populate the tree
 * @param {Object} query - Mongoose query object
 * @param {Number} depth - Remaining depth to populate
 * @returns {Object} - Query with recursive population
 */
function recursivePopulate(query, depth) {
  if (depth <= 0) return query;

  return query.populate({
    path: 'root',
    populate: [
      {
        path: 'children',
        populate: recursivePopulateChildren(depth - 1),
      },
      {
        path: 'parents',
        populate: recursivePopulateParents(depth - 1),
      },
      {
        path: 'person',
        select: '-address -interests -vitalInformation -emergencyContact -aboutMe -quotes',
      },
    ],
  });
}

/**
 * Helper function to populate children recursively
 * @param {Number} depth - Remaining depth to populate
 * @returns {Object} - Population object for children
 */
function recursivePopulateChildren(depth) {
  if (depth <= 0) return {};
  return [
    {
      path: 'children',
      populate: recursivePopulateChildren(depth - 1),
    },
    {
      path: 'person',
      select: '-address -interests -vitalInformation -emergencyContact -aboutMe -quotes',
    },
  ];
}

/**
 * Helper function to populate parents recursively
 * @param {Number} depth - Remaining depth to populate
 * @returns {Object} - Population object for parents
 */
function recursivePopulateParents(depth) {
  if (depth <= 0) return {};
  return [
    {
      path: 'parents',
      populate: recursivePopulateParents(depth - 1),
    },
    {
      path: 'person',
      select: '-address -interests -vitalInformation -emergencyContact -aboutMe -quotes',
    },
  ];
}


module.exports = {
  recursivePopulate,
  recursivePopulateChildren,
  recursivePopulateParents
};
