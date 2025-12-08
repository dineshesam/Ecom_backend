
# Ecommerce Local Backend (v3, numeric IDs)

File-backed (JSON) Express backend. Roles: **admin** and **user**.

## Product JSON shape
```json
{
  "id": 1,
  "name": "Wireless Earbuds",
  "description": "Bluetooth 5.3, ANC",
  "price": 1999,
  "stock": 50,
  "images": ["/data/images/earphones.jpg"],
  "category": "audio",
  "active": true,
  "createdAt": "2025-12-07T09:49:41.922Z",
  "updatedAt": "2025-12-07T09:49:41.922Z"
}
```

## Run
```bash
npm install
cp .env.example .env
npm run dev
```

## Endpoints
- `/api/auth` — register, login, me
- `/api/products` — list/get (public), create/update/delete (admin)
- `/api/cart` — get/add/update/clear (user)
- `/api/wishlist` — get/add/remove (user)
- `/api/orders` — create-from-cart, my (user); list/update-status (admin)

## Notes
- Admin `POST /api/products` auto-assigns **incremental numeric `id`**.
- `images` accepts either a single string or an array (backend stores as array).
- Static images are served from `/data/images/*`.
