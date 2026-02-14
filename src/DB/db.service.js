export const create = async ({ model, data, options = {} } = {}) => {
  const docs = await model.create([data], options);
  return docs[0];
};

export const findOne = async ({ model, filter = {}, options = {} } = {}) => {
  let doc = model.findOne(filter);

  if (options.select) {
    doc = doc.select(options.select);
  }

  if (options.populate) {
    doc = doc.populate(options.populate);
  }

  if (options.sort) {
    doc = doc.sort(options.sort);
  }

  //findOne not support skip and limit ,it works on doc not doc
  //   if (options.skip) {
  //     doc.skip(options.skip);
  //   }
  //   if (options.limit) {
  //     doc.limit(options.limit);
  //   }

  return await doc.exec();
};

export const find = async ({ model, filter = {}, options = {} } = {}) => {
  const doc = model.find(filter);
  if (options.populate) {
    doc.populate(options.populate);
  }

  if (options.skip) {
    doc.skip(options.skip);
  }
  if (options.limit) {
    doc.limit(options.limit);
  }
  return await doc.exec();
};

export const updateOne = async ({
  model,
  filter = {},
  update = {},
  options = {},
} = {}) => {
  const doc = model.updateOne(filter, update, {
    runValidators: true,
    ...options,
  });

  return await doc.exec();
};

export const findOneAndUpdate = async ({
  model,
  filter = {},
  update = {},
  options = {},
} = {}) => {
  const doc = model.findOneAndUpdate(filter, update, {
    new: true,
    runValidators: true,
    ...options,
  });

  return await doc.exec();
};
