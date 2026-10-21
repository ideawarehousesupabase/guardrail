<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

- GIE demo: all cybersecurity data is local mock data in src/data, mutated only through the shared store in src/state/gie-store.tsx — keeps every screen consistent.
- Firestore is used only for demo account records (users collection) via src/lib/demo-auth.tsx; never use firebase/auth or other Firebase services — project brief forbids them.
- Firebase web API key and measurement ID come from project secrets via a server function; other public Firebase identifiers are VITE_ vars in .env.
