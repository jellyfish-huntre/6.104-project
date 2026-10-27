# Deployment readiness

The public front end serves `/health` on the platform port and forwards it to the back end. The back end returns success only when it can read MongoDB, because fairs, accounts, and call access all depend on that database. A failed read returns 503. The back end logs the error type on the first failure and logs recovery once the database responds again; repeated probes should not flood the logs or expose the connection string.

The 6.1040 Apps MongoDB binding must be named `MONGODB_URL`, which is the variable the app reads. `PUBLIC_ORIGIN` is the public HTTPS origin. A deployed test must run through the public URL after the exact commit is live, then verify account creation, fair persistence, refused access, and an error path.
The hosted MongoDB allows ten connections. Roam caps each worker's pool at four so an old and a new worker can overlap during deployment without either one claiming the entire allowance.
