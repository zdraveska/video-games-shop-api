export const typeDefs = `#graphql
  type Query {
    health: String!
    cart: Cart
    product(id: ID!): Product
    products(
      limit: Int
      offset: Int
      search: String
      categoryKey: String
      sortBy: SortField
      sortOrder: SortOrder
    ): ProductConnection!
    orders: [Order!]!
    order(id: ID, orderNumber: String): Order
}

  type Mutation {
    addToCart(productId: ID!, quantity: Int!): Cart!
    removeFromCart(productId: ID!): Cart!
   placeOrder(
      shippingAddress: AddressInput!,
      customerEmail: String!,
      billingAddress: AddressInput
    ): Order!
    removeOrder(id: ID, orderNumber: String): Boolean!
    removeAllOrders: Boolean!
  }

  type ProductConnection {
    total: Int!
    offset: Int!
    limit: Int!
    results: [Product!]!
  }

  type Product {
    id: ID!
    key: String
    version: Int!
    name: LocalizedString
    slug: LocalizedString
    description: LocalizedString
    metaTitle: LocalizedString
    metaDescription: LocalizedString
    categories: [CategoryReference!]
    masterVariant: ProductVariant!
    variants: [ProductVariant!]
  }

  type LocalizedString {
    en_US: String
  }

  type CategoryReference {
    id: ID!
    name: LocalizedString
  }

  type ProductVariant {
    id: Int!
    sku: String
    prices: [Price!]
    images: [Image!]
    attributes: [Attribute!]
  }

  type Price {
    value: Money!
  }

  type Money {
    currencyCode: String!
    centAmount: Int!
    amount: Float
  }

  type Image {
    url: String!
    label: String
    dimensions: Dimensions!
  }

  type Dimensions {
    w: Int!
    h: Int!
  }

  type Attribute {
    name: String!
    value: AttributeValue
  }

  union AttributeValue = TextAttribute | ReferenceAttribute

  type TextAttribute {
    text: String!
  }

  type ReferenceAttribute {
    typeId: String!
    id: ID!
  }

  enum SortField {
    NAME
    PRICE
  }

  enum SortOrder {
    ASC
    DESC
  }

  type Cart {
    id: ID!
    items: [CartItem!]!
    totalAmount: Money!
  }

  type CartItem {
    product: Product!
    quantity: Int!
    price: Money!
  }

  "Address input for mutations"
  input AddressInput {
    firstName: String!
    lastName: String!
    streetName: String!
    streetNumber: String!
    postalCode: String!
    city: String!
    state: String
    country: String!
    phone: String
  }

  "Address output for orders"
  type AddressOutput {
    firstName: String
    lastName: String
    streetName: String
    streetNumber: String
    postalCode: String
    city: String
    state: String
    country: String
    phone: String
  }

  type Order {
    id: ID!
    orderNumber: String
    createdAt: String!
    items: [CartItem!]!
    totalAmount: Money!
    shippingAddress: AddressOutput!
    billingAddress: AddressOutput!
    customerEmail: String!
  }
`;
