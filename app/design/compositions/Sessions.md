# Sessions

An organizer [registers an account](reaction:Sessions.Register) with a username
and password. A successful [sign-in](reaction:Sessions.SignIn) proves the same
identity. Both actions start an opaque browser session; the caller cannot choose
the account represented by it.
Registration accepts usernames of 3 to 32 letters, digits, underscores, or
hyphens and passwords of 8 to 128 characters. The account form explains these
rules before submission and reports the rule that blocks registration.

```endpoints
Sessions.Register at /auth/register
Sessions.SignIn at /auth/sign-in
```

The [current-account endpoint](reaction:Sessions.CurrentUser) resolves the
browser's session to an account. A missing, expired, or ended session is refused.
[Signing out](reaction:Sessions.SignOut) ends that session.

```endpoints
Sessions.CurrentUser at /auth/current
Sessions.SignOut at /auth/sign-out
```
