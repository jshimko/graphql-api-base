import { ObjectID } from 'mongodb';

export function formatPrice(cents) {
  const decimal = cents / 100;
  let price = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(decimal);
  if (price.endsWith('.00')) {
    price = price.substring(0, price.length - 3);
  }
  return price;
}


// convert all string ID's to Mongo ObjectID's
export function idKeysToObjectID(obj) {
  const newObj = obj || {};
  for (const key in obj) {
    if ({}.hasOwnProperty.call(newObj, key)) {
      const val = newObj[key];
      if (key.substr(key.length - 2) === 'Id') {
        newObj[key] = ObjectID(val);
      }
      if (key.substr(key.length - 3) === 'Ids' && Array.isArray(val)) {
        newObj[key] = val.map((id) => ObjectID(id));
      }
    }
  }

  return newObj;
}
