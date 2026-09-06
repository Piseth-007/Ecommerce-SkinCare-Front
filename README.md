# E-Commerce Frontend

A React and Vite storefront for browsing products, managing a shopping cart, completing orders, and viewing order history. The project also includes a protected admin dashboard for managing products, categories, brands, orders, reviews, contacts, and store settings.

## Features

- Product browsing, filtering, details, and cart management
- Customer registration, login, logout, and password reset flows
- Authenticated checkout with saved shipping addresses
- Bakong KHQR payment flow with QR code generation and payment status checks
- Payment success state with order-ticket loading feedback
- Customer order history
- Dynamic store profile details shared between the admin settings and storefront
- Shared scroll-progress indicator and persisted light/dark theme
- Protected administrator login and dashboard
- Admin CRUD screens for products, categories, brands, and products stock data
- Admin order, review, contact, notification, and store-settings management
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
|- context/        Authentication, cart, store settings, toast, and confirmation state
|- hooks/          Shared resource and theme hooks
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
- `/categories` - Category listing
- `/brands` - Brand listing
- `/about` - About page
- `/contact` - Contact page using the configured store details
- `/cart` - Shopping cart
- `/checkout` - Authenticated checkout
- `/orders` - Authenticated order history
- `/orders/:id` - Authenticated order details
- `/favorites` - Authenticated favorites
- `/profile` - Authenticated profile

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
- `/admin/contacts`
- `/admin/reviews`
- `/admin/settings`

Admin routes require an authenticated administrator account.

## Store Settings

Administrators can update the store name, logo, contact email, phone number, address, Bakong payment credentials, and notification preferences from `/admin/settings`.

Store identity and contact information are exposed through the public `GET /api/settings/store` endpoint and displayed by the storefront Navbar, Footer, and Contact page. The storefront falls back to the default Botaniq details while the request is loading or unavailable.

## Theme and Notifications

The light/dark theme is controlled from the storefront or admin Navbar and persisted in `localStorage`. The admin sidebar and Navbar provide order notifications, contact/review counts, low-stock alerts, and direct links to the relevant records.
