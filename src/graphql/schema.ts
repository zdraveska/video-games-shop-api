export const typeDefs = `#graphql
  type Query {
    product(id: ID!): Product
    products(
      limit: Int
      offset: Int
      search: String
      categoryKey: String
      sortBy: SortField
      sortOrder: SortOrder
    ): ProductConnection!
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
    fractionDigits: Int!
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
`;
