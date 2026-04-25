# GoDaddy PHP API Scaffold

This folder is a starter PHP backend for GoDaddy shared hosting.
It mirrors the current React app's API shape and maps the existing Prisma schema to MySQL.

## Folder structure

```text
godaddy-php-api/
  README.md
  schema.sql
  public_html/
    api/
      .htaccess
      admin/
        .htaccess
        index.php
      config/
        bootstrap.php
        cors.php
        db.php
        helpers.php
      index.php
      routes/
        auth.php
        resource.php
        vendors.php
        admin/
          auth.php
          resource.php
```

## What this scaffold covers

- User auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- Vendor application: `/api/vendors/register`
- Generic CRUD starter routes for products, categories, cart, orders, RFQs, quotes, reviews, notifications, and warranty claims
- Admin auth: `/api/admin/auth/login`, `/api/admin/auth/me`, `/api/admin/auth/logout`
- Admin route starter for dashboard, inventory, users, vendors, RFQs, quotes, orders, MRO, warranty, complaints, reviews, analytics, categories, settings, notifications, and uploads

## MySQL schema mapping

The complete schema is in [schema.sql](schema.sql). It is based on the current Prisma models and uses MySQL-friendly table names:

- `categories`
- `products`
- `vendors`
- `users`
- `rfqs`
- `quotes`
- `complaints`
- `warranty_records`
- `mro_orders`
- `admin_settings`
- `cart`
- `orders`
- `order_items`
- `warranty_claims`
- `notifications`
- `reviews`

JSON array fields from Prisma are stored as `LONGTEXT` with JSON strings:

- `products.photos`
- `vendors.certifications`

## Current frontend API endpoints this scaffold matches

- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/me`
- `/api/vendors/register`
- `/api/products`
- `/api/categories`
- `/api/vendors`
- `/api/rfqs`
- `/api/quotes`
- `/api/cart`
- `/api/orders`
- `/api/warranty-claims`
- `/api/notifications`
- `/api/reviews`
- `/api/admin/auth/login`
- `/api/admin/auth/me`
- `/api/admin/auth/logout`
- `/api/admin/dashboard`
- `/api/admin/inventory`
- `/api/admin/users`
- `/api/admin/vendors`
- `/api/admin/rfqs`
- `/api/admin/quotes`
- `/api/admin/orders`
- `/api/admin/mro`
- `/api/admin/warranty`
- `/api/admin/warranty-claims`
- `/api/admin/complaints`
- `/api/admin/reviews`
- `/api/admin/analytics`
- `/api/admin/categories`
- `/api/admin/settings`
- `/api/admin/notifications`
- `/api/admin/uploads`

## Upload checklist for GoDaddy

### Database

1. Create the MySQL database in cPanel.
2. Create a database user.
3. Grant the user all privileges on the database.
4. Import [schema.sql](schema.sql) into phpMyAdmin.

### Files

1. Upload the contents of `public_html/` to your actual GoDaddy `public_html/`.
2. Put the API under `public_html/api/`.
3. Keep `config/` and `routes/` inside `public_html/api/`.
4. Set up the server environment values:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASS`
   - `JWT_SECRET`
   - `FRONTEND_ORIGIN`

### Frontend

1. Build the React app locally.
2. Upload the build output to the site root.
3. Set `VITE_API_BASE` to your production API base URL.

## Notes

- This scaffold is intentionally split into shared helpers plus route stubs so you can fill in table-specific SQL one module at a time.
- Auth uses a small HS256 JWT helper so the current bearer-token flow can stay intact.
- The admin area expects users with `role = ADMIN` in the `users` table.