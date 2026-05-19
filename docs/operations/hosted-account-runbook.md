# Hosted Account Operator Runbook

This runbook covers the manual account tasks needed for the first Railway hosted rehearsal. The app does not send email. The operator creates tokens in the admin UI, copies the resulting token link, and shares it with the intended person through the group's chosen private channel.

## Seeded Rehearsal Accounts

The hosted database is prepared from the same seed data as local development:

| Role | Email | First password expectation |
| --- | --- | --- |
| Player | `lynott@example.local` | Set a hosted password with an admin reset token before sharing the site. |
| Player | `mira@example.local` | Set a hosted password with an admin reset token before sharing the site. |
| Game Master | `gm@example.local` | Set a hosted password with an admin reset token before sharing the site. |
| Admin | `admin@example.local` | Set a hosted password immediately, then create a second admin before table use. |

The local seed password is for development only. Do not treat it as a hosted rehearsal credential.

## First Hosted Preparation

1. Prepare the hosted database with `bun run hosted:data -- prepare` as described in [Railway Hosted Rehearsal](../deployment/railway.md).
2. Sign in as the seeded admin using the temporary seed password.
3. Open `/admin`.
4. Create password reset tokens for `admin@example.local`, `gm@example.local`, `lynott@example.local`, and `mira@example.local`.
5. Use the admin reset token immediately to replace the seeded admin password.
6. Share the Game Master and player reset links privately.
7. Ask each user to set their password and sign in once before the rehearsal.

After the admin password is changed, the operator should create an invite for a backup admin and complete that invite before disabling any admin account. The app prevents disabling the last active admin.

## Invite A New User

1. Sign in as an active admin.
2. Open `/admin`.
3. In "Create invite", enter the user's email and choose `Player`, `Game Master`, or `Admin`.
4. Submit the form.
5. Copy the returned invite token into a URL shaped like `/invites/<token>` on the hosted site.
6. Send that link privately to the user.
7. Ask the user to enter their display name and password on the invite page.

Invite acceptance creates the account locally and redirects the user to `/login`. It does not send email and does not automatically add campaign membership beyond what the current invite role supports.

## Reset A Password

1. Sign in as an active admin.
2. Open `/admin`.
3. Find the user row and choose "Create reset token".
4. Copy the returned token into a URL shaped like `/password-reset/<token>` on the hosted site.
5. Send that link privately to the user.
6. Ask the user to set a new password.

Password reset tokens are single-use. A disabled user cannot use a reset token to regain access; reactivate the user first if access should be restored.

## Account Status Checks

- Use `/admin` to confirm each user has the expected role and active status.
- Keep at least two active admin accounts once the hosted rehearsal is live.
- Admins can manage accounts, invites, and reset tokens, but they do not get sheet play-edit access by default.
- Game Master and player permissions remain enforced by the existing campaign and sheet guards.

## Deferred Email Delivery

Email delivery is intentionally out of scope for this hosted rehearsal. Token delivery remains manual until a later email or external identity slice is planned.
