# OCL Security Constraints

1. Authentication is required for all protected routes and API endpoints.
2. Session cookies are HttpOnly and cleared on logout.
3. Session tokens are stored as hashes in the database and must not be accepted if revoked.
4. Expired sessions are rejected at the API boundary.
5. Disabled or deleted accounts immediately lose access.
6. Users can only access their own orders unless they have an admin role.
7. Managers and admins are allowed to read order collections for operational purposes.
8. Order creation must resolve product prices from the database server-side.
9. Client-submitted totals are not trusted.
10. Product identifiers in order requests must reference active products.
11. Unknown products are rejected during checkout.
12. Session revocation is applied on logout and on auth failures.
13. The server resolves identity from the authenticated session rather than request payloads.
14. The order API rejects attempts to bypass authentication.
15. The security guard helpers are covered by regression tests.
16. The regression tests cover customer and admin authorization boundaries.
17. The regression tests cover revoked and expired session rejection.
18. The regression tests cover server-side price and total calculation.
19. The regression tests cover unknown-product rejection.
20. The application uses local font assets and local images only.
21. No remote CDN assets are required for runtime rendering.
22. No external telemetry or analytics scripts are loaded at startup.
23. The production build completes without runtime asset fetch failures.
24. The app is designed to operate without outbound internet access for core storefront routes.
25. Type checking passes with zero errors.
26. Linting passes with zero warnings.
27. Two consecutive production builds succeed.
28. Backup artifacts are timestamped SQL dumps written to the backups directory.
29. Backup and restore scripts run against the local MariaDB configuration.
30. The restore path is expected to return the database to the exact snapshot taken by backup.
31. Session persistence must survive a server restart when the session remains active and unexpired.
32. Startup scripts must not wipe or reseed user data automatically.
33. The authorization policy is enforced in API handlers and server-side helpers.
34. The security guard module is used by order creation and auth evaluation logic.
35. The database schema is validated by Prisma before deployment.
36. Prisma migrations are deployable against the current schema.

## Implemented and tested constraints

- Constraints 1-19 are implemented and exercised by the regression tests in [tests/security-guards.test.ts](tests/security-guards.test.ts).
- Constraints 20-27 are covered by the local build and verification steps run in this workspace.
- Constraints 28-36 are backed by the backup scripts, Prisma configuration, and the server-side auth/order logic in [src/lib/auth-utils.ts](src/lib/auth-utils.ts), [src/lib/db-auth.ts](src/lib/db-auth.ts), and [src/pages/api/orders/create.ts](src/pages/api/orders/create.ts).
