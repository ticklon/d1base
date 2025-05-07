# d1base

A Supabase-inspired type-safe data client for Cloudflare D1

## Overview

d1base is a type-safe query builder for easily manipulating Cloudflare D1 databases. Inspired by the Supabase client library, it offers a user-friendly interface with the following features:

- Chainable API (`.from().select().where()...`)
- Type safety with TypeScript
- SQL injection protection with bind execution
- Automatic JOIN fetching for relational data (avoiding N+1 problems)
- Intuitive error handling

## Installation

```bash
npm install d1base
```

## Basic Usage

```typescript
import { getDbClient } from 'd1base';

// Usage in Cloudflare Workers/Pages
export default {
  async fetch(request: Request, env: any) {
    // Initialize the database client
    const db = getDbClient(env);
    
    // Fetch user list
    const { data: users, error } = await db
      .from('users')
      .select('*')
      .where('status', '=', 'active')
      .order('created_at', 'desc')
      .limit(10)
      .execute();
    
    if (error) {
      return new Response(`An error occurred: ${error.message}`, {
        status: 500,
      });
    }
    
    // Return user list in JSON format
    return new Response(JSON.stringify({ users }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },
};
```

## Key Features

### SELECT Operations

```typescript
// Basic SELECT
const { data } = await db
  .from('posts')
  .select('id, title, content')
  .execute();

// SELECT with conditions, order, and limit
const { data } = await db
  .from('posts')
  .select('*')
  .where('user_id', '=', userId)
  .order('created_at', 'desc')
  .limit(10)
  .execute();

// Fetch single record (error if none)
const post = await db
  .from('posts')
  .select('*')
  .where('id', '=', postId)
  .single();

// Fetch single record (null if none)
const post = await db
  .from('posts')
  .select('*')
  .where('id', '=', postId)
  .maybeSingle();
```

### INSERT Operations

```typescript
// Insert a record
await db
  .from('posts')
  .insert({
    title: 'New Post',
    content: 'Content here',
    user_id: userId,
    created_at: new Date().toISOString(),
  })
  .execute();
```

### UPDATE Operations

```typescript
// Update a record
await db
  .from('posts')
  .update({
    title: 'Updated Title',
    updated_at: new Date().toISOString(),
  })
  .where('id', '=', postId)
  .execute();
```

### DELETE Operations

```typescript
// Delete a record
await db
  .from('posts')
  .delete()
  .where('id', '=', postId)
  .execute();
```

### Fetching Relation Data

```typescript
// Fetch users and their posts at once
const { data: users } = await db
  .from('users')
  .select(['id', 'name', { posts: ['id', 'title', 'content'] }])
  .where('status', '=', 'active')
  .execute();

// Fetch posts with their authors and comments (multi-level relations)
const { data: posts } = await db
  .from('posts')
  .select([
    'id', 
    'title', 
    { 
      user: ['id', 'name'],
      comments: ['id', 'content', { user: ['id', 'name'] }]
    }
  ])
  .execute();
```

## Type Safety

When using TypeScript, you can create type definitions for each table to achieve complete type safety.

```typescript
// Table type definitions
interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  created_at: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
}

// Usage example with type information
const { data } = await db
  .from<User>('users')  // Recognized as User table
  .select('*')
  .where('status', '=', 'active')
  .execute();

// data is of type User[]
data.forEach(user => {
  console.log(user.name);  // Type completion works
});
```

## License

MIT

## Contributing

Bug reports and feature requests are accepted through GitHub Issues. For more details, see the [contributing guidelines](./docs/contributing.md).
