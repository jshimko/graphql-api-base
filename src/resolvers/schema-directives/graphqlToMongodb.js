import { SchemaDirectiveVisitor } from 'graphql-tools';
import { getMongoDbQueryResolver } from '@prinzdezibel/graphql-to-mongodb';
import { defaultFieldResolver } from 'graphql';


class GraphqlToMongodb extends SchemaDirectiveVisitor {

  visitFieldDefinition(field) {
    /* eslint-disable no-unused-vars */
    const typeNameFromDirective = this.args.type;
    const type = this.schema._typeMap[typeNameFromDirective];

    // const queryArgs = getGraphQLQueryArgs(type);
    // getGraphQLQueryArgs could be used to specify valid arguments (e.g. pagination, filter & sort)
    // on a DSL level. This is not used, atm. Instead the graphQL query needs to declare the possible
    // params manually, e.g. diamonds(filter: JSON, pagination: JSON, sort: JSON)

    const resolver = getMongoDbQueryResolver(type,
      (filter, projection, options, source, args, context, graphQLResolveInfo) => {
        // Delete original query parameters and replace them with mongodb equivalent
        delete args.pagination;
        delete args.filter;
        delete args.sort;

        Object.assign(args, {
          filter,
          options
        });
        // Call next resolver (i.e. in this case the final resolver who's going to query the db)
        return source();
      }
    );

    const originalResolver = field.resolve || defaultFieldResolver;

    field.resolve = (...args) => {
      // First param (source) is undefined. Skip it.
      const [, queryArgs, context, info] = args;
      return resolver(
        () => originalResolver.apply(this, args),
        queryArgs,
        context,
        info
      );
    };
  }
}

export default GraphqlToMongodb;
