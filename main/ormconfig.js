module.exports = {
  type: 'mongodb',
  url: process.env.MONGODB_URI,
  useNewUrlParser: true,
  logging: false,
  synchronize: true,
  entities: ['src/entity/*.ts'],
  cli: {
    entitiesDir: 'src/entity',
  },
};
