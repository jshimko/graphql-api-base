import fs from 'fs';

function requireGraphQL(name) {
  const filename = require.resolve(name);
  return fs.readFileSync(filename, 'utf8');
}

const typeDefs = [`
  scalar Date
  scalar Time
  scalar DateTime
  scalar ObjID
  scalar JSON
`];

typeDefs.push(requireGraphQL('./_directives.graphql'));
typeDefs.push(requireGraphQL('./User.graphql'));
typeDefs.push(requireGraphQL('./Email.graphql'));
typeDefs.push(requireGraphQL('./Image.graphql'));
typeDefs.push(requireGraphQL('./Misc.graphql'));
typeDefs.push(requireGraphQL('./Setting.graphql'));

export default typeDefs;
