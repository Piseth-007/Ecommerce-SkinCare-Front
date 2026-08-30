# E-Commerce Frontend

A React and Vite storefront for browsing products, managing a shopping cart, completing orders, and viewing order history. The project also includes a protected admin dashboard for managing products, categories, brands, orders, and reviews.

## Features

- Product browsing, filtering, details, and cart management
- Customer registration, login, logout, and password reset flows
- Authenticated checkout with saved shipping addresses
- Bakong KHQR payment flow with QR code generation and payment status checks
- Customer order history
- Protected administrator login and dashboard
- Admin CRUD screens for products, categories, and brands
- Admin order and review management
- Toast notifications, confirmation dialogs, loading skeletons, and responsive layouts

## Tech Stack

- React 19
- Vite
- React Router
- Axios
- Tailwind CSS
- Lucide React
- Recharts
- `qrcode.react`

## Project Structure

```text
src/
|- api/            Axios API client
|- components/     Shared, storefront, and admin components
|- context/        Authentication, cart, toast, and confirmation state
`- pages/          Storefront, authentication, and admin pages
```

## Requirements

- Node.js and npm
- The Laravel backend running at `http://127.0.0.1:8000`

The frontend API client uses `http://127.0.0.1:8000/api` as its base URL. Update `src/api/axios.js` if the backend uses another host or port.

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Vite will print the local URL, normally `http://localhost:5173`.

## Available Scripts

| Command           | Description                                       |
| ----------------- | ------------------------------------------------- |
| `npm run dev`     | Start the Vite development server with hot reload |
| `npm run build`   | Create a production build                         |
| `npm run preview` | Preview the production build locally              |
| `npm run lint`    | Run ESLint                                        |

## Main Routes

### Storefront

- `/` - Home page
- `/products` - Product listing
- `/products/:id` - Product details
- `/cart` - Shopping cart
- `/checkout` - Authenticated checkout
- `/orders` - Authenticated order history

### Authentication

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/admin/login`

### Administration

- `/admin/dashboard`
- `/admin/products`
- `/admin/categories`
- `/admin/brands`
- `/admin/orders`
- `/admin/reviews`

Admin routes require an authenticated administrator account.
