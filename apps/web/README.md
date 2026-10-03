# apps/web (Next.js)

Cashier dashboard and customer tracking page. Not created yet.

Next step: scaffold with `pnpm create next-app` using the App Router, Tailwind CSS, and
`output: "export"` (static export). The tracking page reads its token from the query string
(`/t?k=...`) because static export cannot pre-build pages for unknown values.
