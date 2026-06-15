# Own Your Options Collective Launch

The application code is complete and connected to your existing Supabase project configuration.

## Activate the Database

1. Open your Supabase project.
2. Open **SQL Editor**.
3. Run `Own Your Options Hub Database.sql`.
4. Create or confirm April's account from the app sign-in screen.
5. In Supabase, open **Authentication > Users** and copy April's user UUID.
6. Run the final owner statement shown at the bottom of the SQL file using April's UUID.

That final statement makes April the single owner of **April Admin**.

## Publish the App

Deploy the contents of the `own-your-options-collective-app` folder to Netlify.

After publishing:

- Members create accounts and confirm their email.
- April Admin appears only for April.
- Moderator Tools appear only for assigned moderators.
- Blocked or archived accounts cannot access the hub.
- Content, directory profiles, posts, comments, progress, and roles use the shared database.

## Important

Do not share April's password or owner account. Add helpers as Moderators from **April Admin > Team & Roles**.
