# Fix current type errors, then verify GitHub sync

## Confirmed issues

- `src/components/safe-avatar-image.tsx` declares `parsed` inside the URL-validation `try` block, but uses it afterward; the hostname checks therefore reference an out-of-scope variable.
- `src/features/SuperAdmin/components/Topbar.tsx` passes a Lucide icon element as `SafeAvatarImage`’s `fallback`, while that prop currently accepts only a string.

## Implementation steps

1. Adjust the image URL validation so the parsed hostname is available to the later allow-list check without changing the validation behavior.
2. Update the avatar fallback contract and rendering so both text fallbacks and icon fallbacks are supported safely.
3. Run the project’s existing typecheck/build verification and confirm these two errors are gone.
4. Open the project’s **+ menu → GitHub** integration, inspect the connected repository and branch, and re-trigger sync if the control is available.
5. Confirm whether the connected repository is `eduflow-hub` and whether the active branch matches the branch currently selected in that repository; report any mismatch if the integration does not expose a sync/branch control.

## Scope

Only the two reported type errors and the requested GitHub sync verification will be addressed; no other feature behavior or source files will be changed.