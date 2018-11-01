
const typeDefs = [`
  scalar Date
  scalar Time
  scalar DateTime
  scalar ObjID
  scalar JSON
`];

typeDefs.push(require('./_directives.graphql'));
typeDefs.push(require('./User.graphql'));
typeDefs.push(require('./Email.graphql'));
typeDefs.push(require('./Image.graphql'));
typeDefs.push(require('./Misc.graphql'));
typeDefs.push(require('./Setting.graphql'));

export default typeDefs;
