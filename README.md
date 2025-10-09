# Video Game Shop API

Video game e-shop app for searching and filtering video games. GraphQL API built with Node.js, TypeScript, and Commercetools SDK.

## Features

- **Full-text search** - Search products by name or description
- **Multi-level categorization** - Platform → Console/Category → Genre
- **Flexible sorting** - Sort by name or price (ascending/descending)
- **Category filtering** - Filter products by genre or platform
- **GraphQL API** - Data fetching
- **Commercetools integration** - Enterprise-grade commerce platform

## Tech Stack

- **Runtime:** Node.js 16+ with TypeScript
- **API:** GraphQL (Apollo Server)
- **Commerce Platform:** Commercetools

## Prerequisites

- Node.js (v16 or higher)
- npm
- Commercetools account with API credentials ([Sign up here](https://commercetools.com/))

## Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/zdraveska/video-games-shop-api.git
cd video-games-shop-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set environment variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Commercetools credentials:

```env
CT_PROJECT_KEY=your-project-key
CT_CLIENT_ID=your-client-id
CT_CLIENT_SECRET=your-client-secret
CT_SCOPES=manage_project:your-project-key
CT_API_URL=https://api.{region}.commercetools.com
CT_AUTH_URL=https://auth.{region}.commercetools.com
PORT=4000
```

> **Note:** You can find these credentials in your Commercetools Merchant Center under Settings → Developer Settings → API Clients.

### 4. Set up data in Commercetools

Run the setup script to import categories, product types, and products:

```bash
npm run setup
```

This will:

- Create category hierarchy (platforms, genres, etc.)
- Set up product types with attributes (edition, platform, publisher, etc.)
- Import video game products with all details

⚠️ Note: The setup script deletes all existing categories, product types, and products before importing new ones.
Do not run it if you've already added custom data to your Commercetools project.

### 5. Linting and Code Style

Run ESLint to check for code issues:

```bash
npm run lint
```

and if needed, this will automatically fix lint errors:

```bash
npm run lint:fix
```

### 6. Run the server

```bash
npm run start
```

or

```bash
npm run dev
```

The GraphQL API will be available at `http://localhost:4000/graphql`

## API Documentation

### Available Queries

#### 1. Get all products

```graphql
query {
  products(limit: 10, offset: 0) {
    total
    offset
    limit
    results {
      id
      key
      name
      description
      slug
      price
      images
      categories {
        id
        name
        key
      }
      attributes {
        name
        value
      }
    }
  }
}
```

#### 2. Get product by ID

```graphql
query {
  product(id: "your-product-id") {
    id
    key
    name
    description
    price
    images
    categories {
      name
      key
    }
  }
}
```

#### 3. Search products by name or description

```graphql
query {
  products(search: "zelda", limit: 10) {
    total
    results {
      id
      name
      description
      price
    }
  }
}
```

#### 4. Filter products by category

```graphql
query {
  products(categoryKey: "rpg", limit: 10) {
    total
    results {
      id
      name
      price
      categories {
        name
      }
    }
  }
}
```

#### 5. Sort products by name

```graphql
query {
  products(sortBy: NAME, sortOrder: ASC, limit: 10) {
    results {
      id
      name
      price
    }
  }
}
```

#### 6. Sort products by price

```graphql
query {
  products(sortBy: PRICE, sortOrder: DESC, limit: 10) {
    results {
      id
      name
      price
    }
  }
}
```

#### 7. Combined query (search + filter + sort)

```graphql
query {
  products(
    search: "action"
    categoryKey: "shooter"
    sortBy: PRICE
    sortOrder: ASC
    limit: 5
  ) {
    total
    results {
      id
      name
      description
      price
      categories {
        name
      }
    }
  }
}
```

## Project Structure

```
├── scripts
│   ├── data
│   │   ├── categories.json
│   │   └── products.json
│   ├── lib
│   │   ├── delete-categories.ts
│   │   ├── delete-product-types.ts
│   │   ├── delete-products.ts
│   │   ├── import-categories.ts
│   │   ├── import-products-type.ts
│   │   ├── import-products.ts
│   │   └── utils.ts
│   └── setup-script.ts
├── src
│   ├── clients
│   │   └── ct-client.ts
│   ├── config.ts
│   ├── errors
│   │   └── api-error.ts
│   ├── graphql
│   │   ├── resolvers.ts
│   │   ├── schema.ts
│   │   └── server.ts
│   └── types.ts
├── tsconfig.json
├── .env
├── .env.example
├── .gitignore
├── eslint.config.js
├── package-lock.json
├── package.json
```

## Configuration

### Category Structure

The project uses a 3-level category hierarchy:

1. **Platforms** (e.g., Nintendo, Xbox, PlayStation, PC)
2. **Specific Platforms/Categories** (e.g., Xbox One, PS5, Nintendo Switch)
3. **Genres** (e.g., Shooter, RPG, Simulator, Sports)

### Product Attributes

Each video game product includes:

- **Required:**

  - `name` - Game title
  - `description` - Game description
  - `price` - Price in cents (e.g., 5999 = $59.99)
  - `images` - Array of cover image URLs
  - `categories` - Genre and platform categories

- **Optional:**
  - `edition` - Special edition (e.g., "Deluxe", "Standard")
  - `platform` - Platform name (e.g., "PlayStation 5")
  - `releaseDate` - Release date (ISO format)
  - `publisher` - Publisher name

## GraphQL Playground

Once the server is running, open your browser and navigate to:

```
http://localhost:4000/graphql
```

This provides an interactive GraphQL playground where you can:

- Explore the schema
- Run queries
- View documentation
- Test API endpoints

## Troubleshooting

### "Authentication failed" error

**Solution:** Check your `.env` file and ensure:

- `CT_CLIENT_ID` and `CT_CLIENT_SECRET` are correct
- `CT_SCOPES` includes `manage_project:YOUR_PROJECT_KEY`
- API URLs match your Commercetools region

### "Product type not found" during setup

**Solution:** Run setup again (will do a cleanup prior to importing data)

```bash
npm run setup
```

### Port 4000 already in use

**Solution:** Change the port in `.env`:

```env
PORT=4001
```

### TypeScript compilation errors

**Solution:** Make sure `tsconfig.json` exists (not `ts-config.json`) and run:

```bash
npm install
npm run build
```

## API Examples

### Example 1: Get all RPG games sorted by price

```graphql
query {
  products(categoryKey: "rpg", sortBy: PRICE, sortOrder: ASC) {
    total
    results {
      name
      price
      images
    }
  }
}
```

### Example 2: Search for Zelda games

```graphql
query {
  products(search: "zelda") {
    total
    results {
      name
      description
      price
      categories {
        name
      }
    }
  }
}
```

### Example 3: Get PlayStation 5 shooters

```graphql
query {
  products(categoryKey: "ps5", search: "shooter") {
    results {
      name
      price
      attributes {
        name
        value
      }
    }
  }
}
```
